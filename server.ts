import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables from .env file (if present)
dotenv.config();

async function startServer() {
  const app = express();
  // Port configuration: AI Studio reverse proxy exclusively routes to port 3000
  // In production (Hostinger / Docker), process.env.PORT can be respected if provided
  const PORT = process.env.NODE_ENV === 'production' && process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Security headers & basic rate mitigation
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  app.use(express.json({ limit: '10mb' }));

  // ==========================================
  // 1. HEALTH CHECK & STATUS
  // ==========================================
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Ar Soluções - Climatização API',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // ==========================================
  // 2. GEMINI AI INTEGRATION (SERVER-SIDE ONLY)
  // ==========================================
  // Lazy-initialized Gemini client to prevent crashes if key is missing on startup
  let geminiClient: GoogleGenAI | null = null;
  function getGeminiClient(): GoogleGenAI {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error(
        'GEMINI_API_KEY não foi configurada nas variáveis de ambiente do servidor. Adicione GEMINI_API_KEY no painel da Hostinger ou em seu arquivo .env.'
      );
    }
    if (!geminiClient) {
      geminiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
    return geminiClient;
  }

  // AI Diagnostic / Text Generation route
  app.post('/api/ai/generate', async (req, res) => {
    try {
      const { prompt, systemInstruction, model } = req.body;
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: "O campo 'prompt' é obrigatório." });
      }

      const ai = getGeminiClient();
      const selectedModel = model || 'gemini-3.8-flash';

      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: prompt,
        config: systemInstruction
          ? {
              systemInstruction,
            }
          : undefined,
      });

      res.json({
        text: response.text || '',
        model: selectedModel,
      });
    } catch (error: any) {
      console.error('Erro na API Gemini Server-Side:', error);
      const isKeyMissing = error?.message?.includes('GEMINI_API_KEY');
      res.status(isKeyMissing ? 503 : 500).json({
        error: error?.message || 'Erro ao processar solicitação de IA',
      });
    }
  });

  // AI System Status route
  app.get('/api/ai/status', (req, res) => {
    res.json({
      configured: Boolean(process.env.GEMINI_API_KEY),
      defaultModel: 'gemini-3.8-flash',
      liveApiSupported: true,
    });
  });

  // Dynamic Firebase & App Config endpoint
  app.get('/api/config', (req, res) => {
    res.json({
      firebase: {
        apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || null,
        authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || null,
        projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || null,
        storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || null,
        messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID || null,
        appId: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || null,
        firestoreDatabaseId: process.env.VITE_FIRESTORE_DATABASE_ID || process.env.FIRESTORE_DATABASE_ID || null,
      },
      environment: process.env.NODE_ENV || 'development',
    });
  });

  // ========================================================
  // 3. MULTI-DEVICE CLOUD AUTO-SYNC API (Central Database)
  // ========================================================
  const DATA_DIR = path.join(process.cwd(), 'data');
  const SYNC_FILE = path.join(DATA_DIR, 'company_data.json');

  // Ensure data directory exists
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.error('Erro ao inicializar pasta de dados:', err);
  }

  // Helper to read current synced company data
  function readCompanyData() {
    try {
      if (fs.existsSync(SYNC_FILE)) {
        const raw = fs.readFileSync(SYNC_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('Erro ao ler company_data.json:', err);
    }
    return null;
  }

  // Helper to save company data safely (atomic write)
  function saveCompanyData(data: any) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tempFile = `${SYNC_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tempFile, SYNC_FILE);
      return true;
    } catch (err) {
      console.error('Erro ao salvar company_data.json:', err);
      return false;
    }
  }

  // GET /api/sync - Retrieve full synchronized data for any connected device
  app.get('/api/sync', (req, res) => {
    const data = readCompanyData();
    if (data) {
      res.json({
        exists: true,
        version: data.version || 1,
        lastUpdated: data.lastUpdated || new Date().toISOString(),
        clients: data.clients || [],
        equipment: data.equipment || [],
        visits: data.visits || [],
        quotes: data.quotes || [],
        maintenanceLogs: data.maintenanceLogs || [],
        companySettings: data.companySettings || null,
      });
    } else {
      res.json({
        exists: false,
        version: 0,
        lastUpdated: null,
      });
    }
  });

  // GET /api/sync/status - Lightweight status check for background polling (< 100 bytes)
  app.get('/api/sync/status', (req, res) => {
    const data = readCompanyData();
    res.json({
      exists: Boolean(data),
      version: data?.version || 0,
      lastUpdated: data?.lastUpdated || null,
    });
  });

  // POST /api/sync - Auto-save changes from any device (phone, desktop, tablet)
  app.post('/api/sync', (req, res) => {
    try {
      const {
        clients,
        equipment,
        visits,
        quotes,
        maintenanceLogs,
        companySettings,
        clientVersion,
      } = req.body;

      const currentData = readCompanyData();
      const currentVersion = currentData?.version || 0;
      const nextVersion = Math.max(currentVersion, typeof clientVersion === 'number' ? clientVersion : 0) + 1;
      const now = new Date().toISOString();

      const payload = {
        version: nextVersion,
        lastUpdated: now,
        clients: Array.isArray(clients) ? clients : currentData?.clients || [],
        equipment: Array.isArray(equipment) ? equipment : currentData?.equipment || [],
        visits: Array.isArray(visits) ? visits : currentData?.visits || [],
        quotes: Array.isArray(quotes) ? quotes : currentData?.quotes || [],
        maintenanceLogs: Array.isArray(maintenanceLogs) ? maintenanceLogs : currentData?.maintenanceLogs || [],
        companySettings: companySettings && typeof companySettings === 'object' ? companySettings : currentData?.companySettings || null,
      };

      const success = saveCompanyData(payload);
      if (success) {
        res.json({
          success: true,
          version: nextVersion,
          lastUpdated: now,
        });
      } else {
        res.status(500).json({ success: false, error: 'Falha ao salvar no banco central.' });
      }
    } catch (err: any) {
      console.error('Erro na rota POST /api/sync:', err);
      res.status(500).json({ success: false, error: err?.message || 'Erro ao sincronizar dados.' });
    }
  });

  // ========================================================
  // 4. PUBLIC DOCUMENT ACCESS & CLIENT DIGITAL SIGNATURE
  // (Permite que o cliente visualize e assine sem acesso ao sistema)
  // ========================================================

  // GET /api/public/document/:id - Consulta pública e segura de documento
  app.get('/api/public/document/:id', (req, res) => {
    try {
      const docId = decodeURIComponent(req.params.id);
      const data = readCompanyData();
      if (!data) {
        return res.status(404).json({ found: false, error: 'Base de dados indisponível no momento.' });
      }

      // 1. Procurar em Orçamentos
      const quotes = Array.isArray(data.quotes) ? data.quotes : [];
      const quote = quotes.find((q: any) => q.id === docId || q.number?.toLowerCase() === docId.toLowerCase());
      if (quote) {
        return res.json({
          found: true,
          type: 'quote',
          document: quote,
          companySettings: data.companySettings || null,
        });
      }

      // 2. Procurar em Ordens de Serviço / Manutenções
      const logs = Array.isArray(data.maintenanceLogs) ? data.maintenanceLogs : [];
      const log = logs.find((l: any) => l.id === docId || l.code?.toLowerCase() === docId.toLowerCase());
      if (log) {
        return res.json({
          found: true,
          type: 'maintenance',
          document: log,
          companySettings: data.companySettings || null,
        });
      }

      res.status(404).json({ found: false, error: 'Documento não localizado ou código inválido.' });
    } catch (err: any) {
      console.error('Erro em GET /api/public/document/:id:', err);
      res.status(500).json({ found: false, error: 'Erro ao buscar documento.' });
    }
  });

  // POST /api/public/document/:id/sign - Assinatura digital do cliente
  app.post('/api/public/document/:id/sign', (req, res) => {
    try {
      const docId = decodeURIComponent(req.params.id);
      const { signedBy, documentNumber, signatureDataUrl, signType } = req.body;

      if (!signedBy || typeof signedBy !== 'string' || !signedBy.trim()) {
        return res.status(400).json({ success: false, error: 'O nome do assinante é obrigatório.' });
      }

      const data = readCompanyData();
      if (!data) {
        return res.status(500).json({ success: false, error: 'Dados não encontrados.' });
      }

      const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
      const now = new Date().toISOString();

      const signature = {
        signedBy: signedBy.trim(),
        documentNumber: documentNumber ? String(documentNumber).trim() : '',
        signedAt: now,
        signatureDataUrl: signatureDataUrl || '',
        ipAddress: clientIp,
        signType: signType === 'typed' ? 'typed' : 'drawn',
      };

      let updatedDoc: any = null;
      let docType: 'quote' | 'maintenance' | null = null;

      // Check quotes
      if (Array.isArray(data.quotes)) {
        const quoteIndex = data.quotes.findIndex((q: any) => q.id === docId || q.number?.toLowerCase() === docId.toLowerCase());
        if (quoteIndex !== -1) {
          data.quotes[quoteIndex] = {
            ...data.quotes[quoteIndex],
            status: 'Aprovado',
            approvedAt: now,
            signature,
          };
          updatedDoc = data.quotes[quoteIndex];
          docType = 'quote';
        }
      }

      // Check maintenance logs
      if (!updatedDoc && Array.isArray(data.maintenanceLogs)) {
        const logIndex = data.maintenanceLogs.findIndex((l: any) => l.id === docId || l.code?.toLowerCase() === docId.toLowerCase());
        if (logIndex !== -1) {
          data.maintenanceLogs[logIndex] = {
            ...data.maintenanceLogs[logIndex],
            status: 'Concluído',
            signature,
          };
          updatedDoc = data.maintenanceLogs[logIndex];
          docType = 'maintenance';
        }
      }

      if (!updatedDoc) {
        return res.status(404).json({ success: false, error: 'Documento não encontrado para assinatura.' });
      }

      data.version = (data.version || 0) + 1;
      data.lastUpdated = now;

      const saved = saveCompanyData(data);
      if (saved) {
        res.json({
          success: true,
          message: 'Documento assinado com sucesso pelo cliente!',
          type: docType,
          document: updatedDoc,
          version: data.version,
        });
      } else {
        res.status(500).json({ success: false, error: 'Falha ao gravar assinatura no servidor.' });
      }
    } catch (err: any) {
      console.error('Erro em POST /api/public/document/:id/sign:', err);
      res.status(500).json({ success: false, error: 'Erro ao processar assinatura.' });
    }
  });

  // 404 for unmatched API routes
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: 'Endpoint de API não encontrado.' });
  });

  // ==========================================
  // 3. FRONTEND SERVING (VITE / STATIC)
  // ==========================================
  // Serve public assets (images, logos, icons) directly
  app.use(express.static(path.join(process.cwd(), 'public')));

  if (process.env.NODE_ENV !== 'production') {
    // Development mode (AI Studio and local development)
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: 3000,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode (Hostinger Node.js / Docker production)
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      try {
        let html = fs.readFileSync(indexPath, 'utf-8');
        const runtimeConfig = {
          apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
          authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN,
          projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
          storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID,
          firestoreDatabaseId: process.env.VITE_FIRESTORE_DATABASE_ID || process.env.FIRESTORE_DATABASE_ID,
        };
        // If custom runtime config exists in environment, inject it into HTML head
        if (runtimeConfig.apiKey || runtimeConfig.projectId) {
          const script = `<script>window.__RUNTIME_CONFIG__ = ${JSON.stringify(runtimeConfig)};</script>`;
          html = html.replace('<head>', `<head>\n    ${script}`);
        }
        res.send(html);
      } catch {
        res.sendFile(indexPath);
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(
      `[Ar Soluções] Servidor operacional em http://0.0.0.0:${PORT} (Ambiente: ${process.env.NODE_ENV || 'development'})`
    );
  });
}

startServer().catch((err) => {
  console.error('Falha fatal ao inicializar o servidor:', err);
  process.exit(1);
});
