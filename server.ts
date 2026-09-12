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
  // Port configuration: Hostinger provides dynamic port in process.env.PORT, defaults to 3000 for AI Studio container
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

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
      service: 'Refrigera Certo - Climatização API',
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

  // 404 for unmatched API routes
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: 'Endpoint de API não encontrado.' });
  });

  // ==========================================
  // 3. FRONTEND SERVING (VITE / STATIC)
  // ==========================================
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
      `[Refrigera Certo] Servidor operacional em http://0.0.0.0:${PORT} (Ambiente: ${process.env.NODE_ENV || 'development'})`
    );
  });
}

startServer().catch((err) => {
  console.error('Falha fatal ao inicializar o servidor:', err);
  process.exit(1);
});
