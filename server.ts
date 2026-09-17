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
  const PORT = 3000;

  // CORS and iframe-friendly headers for AI Studio preview & site integration
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    res.setHeader('X-Content-Type-Options', 'nosniff');
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

  // ========================================================
  // VOICE ASSISTANT INTENT & COMMAND PROCESSING (SERVER-SIDE)
  // ========================================================
  app.post('/api/ai/voice-command', async (req, res) => {
    try {
      const { userSpeech, conversationHistory, context } = req.body;
      if (!userSpeech || typeof userSpeech !== 'string') {
        return res.status(400).json({ error: "O campo 'userSpeech' é obrigatório." });
      }

      const currentDateTime = context?.currentDateTime || new Date().toISOString();
      const todayDate = context?.todayDate || new Date().toISOString().slice(0, 10);
      const clientsList = (context?.clients || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        phone: c.phone || '',
        address: c.address ? `${c.address.street || ''}, ${c.address.number || ''} ${c.address.neighborhood || ''} - ${c.address.city || ''}` : ''
      }));
      const visitsList = (context?.upcomingVisits || []).slice(0, 20);
      const quotesList = (context?.quotes || []).slice(0, 20);
      const workOrdersList = (context?.recentWorkOrders || []).slice(0, 20);

      const systemPrompt = `Você é o Assistente Inteligente por Voz do sistema "Refrigera Certo" (Ar Soluções Climatização).
Sua missão é interpretar comandos naturais de voz do técnico/gestor de climatização e mapear para ações estruturadas seguras no sistema.

DIRETRIZES FUNDAMENTAIS:
1. DATA E HORA ATUAL DE REFERÊNCIA: ${currentDateTime} (Hoje é ${todayDate}).
2. Interprete datas relativas com precisão matemática:
   - "hoje" => ${todayDate}
   - "amanhã" => data do dia seguinte
   - "depois de amanhã" => 2 dias após hoje
   - "sexta-feira", "segunda-feira" => calcule o próximo dia da semana correspondente
   - Horários como "às 14", "às 14 horas", "duas da tarde" => "14:00"
   - "às 9", "às 9 horas", "nove da manhã" => "09:00"
3. CLIENTES CADASTRADOS NO SISTEMA:
${JSON.stringify(clientsList, null, 2)}
   - Se o usuário mencionar um cliente cadastrado por nome parcial ou fantasia (ex: "Camila" para "Dra. Camila Vasconcelos", "Pão Dourado" para "Padaria & Empório Pão Dourado Ltda", "Central" para "Supermercado Central da Vila"), ASSOCIE IMEDIATAMENTE este cliente nos campos "clientId", "clientName", "clientPhone" e "clientAddress".
   - REGRA DE OURO PARA CLIENTES: NUNCA retorne "A confirmar", "(a confirmar)", "Cliente a confirmar" ou "Não informado" no campo "clientName" se o usuário mencionou o nome de uma pessoa ou estabelecimento! Se o cliente for novo ou não estiver na lista cadastrada, extraia o nome falado com fidelidade (ex: "João da Silva", "Mercado Bom Preço", "Pedro Santos") para que o sistema cadastre e agende com o nome real.
   - Se houver AMBIGUIDADE (múltiplos clientes com o mesmo primeiro nome), preencha "clientClarification" com as opções.
4. LEMBRETES AUTOMÁTICOS:
   - TODO agendamento de visita técnica / manutenção DEVE ter lembrete automático configurado.
   - Se o usuário não disser um horário diferente, configure SEMPRE por padrão "reminderMinutes": 60 e calcule "reminderTime" para 1 hora antes do horário do atendimento.
   - Se o usuário falar "me lembra 30 minutos antes", use "reminderMinutes": 30. Se falar "com lembrete às 13h", use "reminderTime": "13:00".
5. AGENDAMENTOS / VISITAS EXISTENTES:
${JSON.stringify(visitsList, null, 2)}
6. ORÇAMENTOS EXISTENTES:
${JSON.stringify(quotesList, null, 2)}
7. ORDENS DE SERVIÇO / MANUTENÇÕES:
${JSON.stringify(workOrdersList, null, 2)}

8. AÇÕES SUPORTADAS ("action"):
   - "create_appointment": criar agendamento de visita técnica / manutenção / instalação
   - "update_appointment": alterar data, horário ou detalhes de visita existente
   - "cancel_appointment": cancelar uma visita existente
   - "get_appointments": consultar visitas agendadas (ex: "o que tenho agendado hoje?", "serviços de amanhã")
   - "create_task": criar lembrete ou tarefa operacional
   - "get_customer": buscar dados/telefone/endereço de cliente
   - "create_quote": criar proposta/orçamento
   - "get_quotes": consultar orçamentos (ex: "orçamentos pendentes", "valor do orçamento do Carlos")
   - "create_work_order": abrir ordem de serviço de manutenção
   - "update_work_order": marcar OS como concluída ou adicionar observação
   - "get_work_orders": consultar ordens de serviço
   - "clarify_info": quando faltam informações essenciais para prosseguir (ex: faltou data ou horário)
   - "general_query": resposta informativa sobre o sistema

9. CONFIRMAÇÃO OBRIGATÓRIA:
   - "requiresConfirmation" DEVE ser true para ações que criam, alteram ou cancelam registros (create_appointment, update_appointment, cancel_appointment, create_quote, create_task, create_work_order, update_work_order).
   - "requiresConfirmation" DEVE ser false para consultas diretas (get_appointments, get_customer, get_quotes, get_work_orders, clarify_info, general_query).

10. RESPOSTA FALADA ("speechResponse"):
   - Texto natural, conciso, profissional em português do Brasil, perfeito para ser lido pelo sintetizador de voz (TTS). Sem markdown nem caracteres especiais estranhos.
   Exemplo de consulta: "Você tem 2 serviços agendados para amanhã. O primeiro é uma manutenção para João da Silva às 14 horas."
   Exemplo de criação: "Entendi seu pedido: agendamento de manutenção para Camila Vasconcelos amanhã às 14 horas, com lembrete automático às 13 horas. Deseja confirmar?"

11. FORMATO DE SAÍDA JSON ESTRITO:
Retorne SEMPRE um JSON válido com a seguinte estrutura:
{
  "action": "create_appointment" | "update_appointment" | "cancel_appointment" | "get_appointments" | "create_task" | "get_customer" | "create_quote" | "get_quotes" | "create_work_order" | "update_work_order" | "get_work_orders" | "clarify_info" | "general_query",
  "requiresConfirmation": boolean,
  "speechResponse": string,
  "writtenResponse": string,
  "missingInformation": string | null,
  "clientClarification": Array<{ "id": string, "name": string, "phone": string }> | null,
  "parameters": {
    "clientId"?: string,
    "clientName"?: string,
    "clientPhone"?: string,
    "clientAddress"?: string,
    "serviceType"?: string, // "Manutenção Preventiva" | "Instalação" | "Higienização e Limpeza Química" | "Diagnóstico Técnico" | "Manutenção Corretiva"
    "date"?: string, // "YYYY-MM-DD"
    "time"?: string, // "HH:MM"
    "timeWindow"?: string, // Ex: "14:00 - 16:00"
    "reminderMinutes"?: number, // Ex: 60 (padrão)
    "reminderTime"?: string, // Ex: "13:00"
    "reportedIssue"?: string,
    "notes"?: string,
    "visitId"?: string,
    "quoteId"?: string,
    "workOrderId"?: string,
    "newStatus"?: string,
    "taskTitle"?: string,
    "quoteTotal"?: number
  },
  "confirmationSummary": {
    "title": string,
    "details": Array<{ "label": string, "value": string }>
  } | null,
  "queryResult": {
    "type": "appointments" | "customer" | "quotes" | "work_orders" | "info",
    "items": Array<any>,
    "summary": string
  } | null
}`;

      // Try Gemini AI first if configured
      let resultData: any = null;
      try {
        const ai = getGeminiClient();
        const promptPayload = `Histórico recente da conversa:
${JSON.stringify(conversationHistory || [], null, 2)}

Fala do usuário atual:
"${userSpeech}"`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: promptPayload,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
          },
        });

        if (response.text) {
          resultData = JSON.parse(response.text);
        }
      } catch (geminiError: any) {
        console.warn('Gemini não disponível ou chave não configurada, utilizando parser determinístico local:', geminiError?.message);
      }

      // Fallback local intelligent parser if Gemini was unavailable or threw an error
      if (!resultData) {
        resultData = parseVoiceCommandLocally(userSpeech, context, todayDate);
      }

      res.json(resultData);
    } catch (error: any) {
      console.error('Erro ao processar comando de voz:', error);
      res.status(500).json({
        error: error?.message || 'Erro ao interpretar comando de voz',
      });
    }
  });

  // Local fallback parser ensuring offline / zero-key capability for common technician voice requests
  function parseVoiceCommandLocally(speech: string, context: any, todayDate: string) {
    const s = speech.toLowerCase().trim();
    const clients: any[] = context?.clients || [];
    const visits: any[] = context?.upcomingVisits || [];
    const quotes: any[] = context?.quotes || [];

    // Calculate dates
    const todayObj = new Date(todayDate + 'T12:00:00');
    const tomorrowObj = new Date(todayObj);
    tomorrowObj.setDate(tomorrowObj.getDate() + 1);
    const tomorrowDate = tomorrowObj.toISOString().slice(0, 10);

    // Check for target date
    let targetDate = todayDate;
    let dateLabel = 'Hoje';
    if (s.includes('amanhã') || s.includes('amanha')) {
      targetDate = tomorrowDate;
      dateLabel = 'Amanhã';
    }

    // Extract time (e.g. "às 14", "14 horas", "às 9", "15:00", "duas da tarde")
    let targetTime = '14:00';
    let targetTimeWindow = '14:00 - 16:00';
    const timeMatch = s.match(/(?:às|as)\s*(\d{1,2})(?::(\d{2}))?/i) || s.match(/(\d{1,2})\s*horas/i);
    if (timeMatch) {
      let hour = parseInt(timeMatch[1], 10);
      if (s.includes('tarde') && hour < 12) hour += 12;
      const min = timeMatch[2] ? timeMatch[2].padStart(2, '0') : '00';
      targetTime = `${String(hour).padStart(2, '0')}:${min}`;
      targetTimeWindow = `${String(hour).padStart(2, '0')}:${min} - ${String(hour + 2).padStart(2, '0')}:${min}`;
    }

    // Extract reminder - ALWAYS AUTOMATIC BY DEFAULT (60 minutes prior)
    let reminderMinutes = 60;
    let reminderTime = '';
    const [th, tm] = targetTime.split(':').map(Number);
    const defRemH = Math.max(0, th - 1);
    reminderTime = `${String(defRemH).padStart(2, '0')}:${String(tm).padStart(2, '0')}`;

    if (s.includes('30 minutos') || s.includes('meia hora')) {
      reminderMinutes = 30;
      const remH30 = tm >= 30 ? th : Math.max(0, th - 1);
      const remM30 = tm >= 30 ? tm - 30 : tm + 30;
      reminderTime = `${String(remH30).padStart(2, '0')}:${String(remM30).padStart(2, '0')}`;
    } else if (s.includes('15 minutos')) {
      reminderMinutes = 15;
      const remH15 = tm >= 15 ? th : Math.max(0, th - 1);
      const remM15 = tm >= 15 ? tm - 15 : tm + 45;
      reminderTime = `${String(remH15).padStart(2, '0')}:${String(remM15).padStart(2, '0')}`;
    } else if (s.includes('2 horas') || s.includes('duas horas')) {
      reminderMinutes = 120;
      reminderTime = `${String(Math.max(0, th - 2)).padStart(2, '0')}:${String(tm).padStart(2, '0')}`;
    } else {
      // Check for explicit reminder time (e.g. "lembrete às 13h")
      const explicitRemMatch = s.match(/lembrete\s*(?:às|as)\s*(\d{1,2})(?::(\d{2}))?/i);
      if (explicitRemMatch) {
        const rh = parseInt(explicitRemMatch[1], 10);
        const rm = explicitRemMatch[2] ? explicitRemMatch[2].padStart(2, '0') : '00';
        reminderTime = `${String(rh).padStart(2, '0')}:${rm}`;
      }
    }

    // Match Client with multi-token & partial name flexibility
    let matchedClient: any = null;
    let matchingClients: any[] = [];
    for (const c of clients) {
      const cName = c.name.toLowerCase();
      // Remove common prefix noise like "dra.", "dr.", "sr.", "sra.", "clínica", "padaria & empório", "supermercado"
      const simplified = cName
        .replace(/^(dra\.?|dr\.?|sr\.?|sra\.?|padaria\s*&\s*emp[oó]rio|supermercado|cl[ií]nica)\s+/gi, '')
        .trim();
      const parts = simplified.split(/[\s,()\-–/]+/).filter((p: string) => p.length >= 3 && !['ltda', 'epp', 'me'].includes(p));

      if (s.includes(cName) || s.includes(simplified) || parts.some((p: string) => s.includes(p))) {
        matchingClients.push(c);
      }
    }

    let extractedClientName = '';
    if (matchingClients.length === 1) {
      matchedClient = matchingClients[0];
      extractedClientName = matchedClient.name;
    } else if (matchingClients.length > 1) {
      // Prioritize exact or highest-token match
      const exact = matchingClients.find(c => s.includes(c.name.toLowerCase()));
      if (exact) {
        matchedClient = exact;
        extractedClientName = matchedClient.name;
      } else {
        return {
          action: 'clarify_info',
          requiresConfirmation: false,
          speechResponse: `Encontrei ${matchingClients.length} clientes com esse nome. Qual deles você deseja?`,
          writtenResponse: `Encontrei ${matchingClients.length} clientes correspondentes. Por favor, selecione:`,
          missingInformation: 'client_choice',
          clientClarification: matchingClients.map(c => ({ id: c.id, name: c.name, phone: c.phone })),
          parameters: {},
          confirmationSummary: null,
          queryResult: null
        };
      }
    } else {
      // Extract client name spoken in natural Portuguese grammar:
      // Ex: "agendar manutenção para Carlos amanhã às 14 horas"
      // Ex: "agendar visita para o cliente Mercado Esperança dia 20"
      // Ex: "marcar com João da Silva amanhã"
      const nameMatch = speech.match(/(?:para|com|ao|no|na|cliente)\s+(?:o\s+|a\s+|o\s+cliente\s+|a\s+cliente\s+)?([A-ZÀ-Úa-zà-ú0-9&.\s]+?)(?=\s+(?:amanhã|amanha|hoje|depois|segunda|terça|quarta|quinta|sexta|sábado|sabado|domingo|dia|às|as|com\s+lembrete|para\s+o\s+dia|no\s+dia|\d{1,2}\/|\d{1,2}\s+de|\bàs\b|\bas\b|$))/i);
      if (nameMatch && nameMatch[1]) {
        const candidate = nameMatch[1].trim();
        const banned = ['visita', 'manutenção', 'manutencao', 'higienização', 'instalação', 'serviço', 'reparo', 'conserto'];
        if (!banned.includes(candidate.toLowerCase()) && candidate.length >= 2) {
          extractedClientName = candidate;
        }
      }
    }

    // 1. Queries: "quais são meus serviços...", "o que tenho agendado..."
    if (s.includes('quais') || s.includes('o que tenho') || s.includes('mostrar agenda') || s.includes('próximos serviços') || s.includes('consultar agenda')) {
      const filtered = visits.filter((v: any) => v.date === targetDate);
      if (filtered.length === 0) {
        return {
          action: 'get_appointments',
          requiresConfirmation: false,
          speechResponse: `Você não tem nenhum serviço agendado para ${dateLabel.toLowerCase()}.`,
          writtenResponse: `Nenhum serviço agendado para ${dateLabel.toLowerCase()} (${targetDate}).`,
          missingInformation: null,
          clientClarification: null,
          parameters: { date: targetDate },
          confirmationSummary: null,
          queryResult: {
            type: 'appointments',
            items: [],
            summary: `Sem agendamentos para ${dateLabel}.`
          }
        };
      }
      const summaryList = filtered.map((v: any) => `${v.timeWindow}: ${v.clientName} (${v.serviceType})`).join('. ');
      return {
        action: 'get_appointments',
        requiresConfirmation: false,
        speechResponse: `Você tem ${filtered.length} serviço(s) para ${dateLabel.toLowerCase()}. ${summaryList}`,
        writtenResponse: `Encontrados ${filtered.length} serviço(s) para ${dateLabel} (${targetDate}):\n${summaryList}`,
        missingInformation: null,
        clientClarification: null,
        parameters: { date: targetDate },
        confirmationSummary: null,
        queryResult: {
          type: 'appointments',
          items: filtered,
          summary: `${filtered.length} serviço(s) agendado(s).`
        }
      };
    }

    // 2. Customer query: "telefone do joão", "dados do cliente"
    if (s.includes('telefone') || s.includes('dados do cliente') || s.includes('contato')) {
      if (matchedClient) {
        return {
          action: 'get_customer',
          requiresConfirmation: false,
          speechResponse: `O telefone de ${matchedClient.name} é ${matchedClient.phone || 'não cadastrado'}.`,
          writtenResponse: `Cliente: ${matchedClient.name}\nTelefone: ${matchedClient.phone}\nEndereço: ${matchedClient.address ? `${matchedClient.address.street}, ${matchedClient.address.number}` : 'Não informado'}`,
          missingInformation: null,
          clientClarification: null,
          parameters: { clientId: matchedClient.id, clientName: matchedClient.name },
          confirmationSummary: null,
          queryResult: {
            type: 'customer',
            items: [matchedClient],
            summary: `Contato de ${matchedClient.name}`
          }
        };
      }
    }

    // 3. Quotes query: "mostrar orçamentos pendentes"
    if (s.includes('orçamento') && (s.includes('pendente') || s.includes('mostrar') || s.includes('quais'))) {
      const pending = quotes.filter((q: any) => q.status === 'Enviado' || q.status === 'Rascunho');
      return {
        action: 'get_quotes',
        requiresConfirmation: false,
        speechResponse: `Você tem ${pending.length} orçamento(s) pendente(s) no sistema.`,
        writtenResponse: `Exibindo ${pending.length} orçamento(s) pendente(s) de aprovação.`,
        missingInformation: null,
        clientClarification: null,
        parameters: {},
        confirmationSummary: null,
        queryResult: {
          type: 'quotes',
          items: pending,
          summary: `${pending.length} orçamentos pendentes.`
        }
      };
    }

    // 4. Create appointment action: "agendar...", "marcar..."
    if (s.includes('agendar') || s.includes('marcar') || s.includes('visita') || s.includes('manutenção') || s.includes('instalação')) {
      let serviceType = 'Manutenção Preventiva';
      if (s.includes('instalação') || s.includes('instalacao')) serviceType = 'Instalação';
      else if (s.includes('higienização') || s.includes('limpeza')) serviceType = 'Higienização e Limpeza Química';
      else if (s.includes('corretiva') || s.includes('conserto') || s.includes('reparo')) serviceType = 'Manutenção Corretiva';

      const clientName = matchedClient ? matchedClient.name : (extractedClientName || 'Cliente a Definir');
      const clientId = matchedClient ? matchedClient.id : '';

      return {
        action: 'create_appointment',
        requiresConfirmation: true,
        speechResponse: `Entendi seu pedido: agendamento de ${serviceType} para ${clientName} em ${targetDate === tomorrowDate ? 'amanhã' : targetDate} às ${targetTime}, com lembrete automático às ${reminderTime}. Deseja confirmar?`,
        writtenResponse: `Entendi seu pedido:\nCliente: ${clientName}\nServiço: ${serviceType}\nData: ${targetDate}\nHorário: ${targetTime}\nLembrete Automático: ${reminderTime} (${reminderMinutes} min antes)\n\nDeseja confirmar?`,
        missingInformation: null,
        clientClarification: null,
        parameters: {
          clientId,
          clientName,
          clientPhone: matchedClient?.phone || '',
          clientAddress: matchedClient?.address ? `${matchedClient.address.street}, ${matchedClient.address.number}` : '',
          serviceType,
          date: targetDate,
          time: targetTime,
          timeWindow: targetTimeWindow,
          reminderMinutes,
          reminderTime,
          reportedIssue: `${serviceType} agendada via Assistente Inteligente por Voz`
        },
        confirmationSummary: {
          title: 'Confirmar Novo Agendamento',
          details: [
            { label: 'Cliente', value: clientName },
            { label: 'Serviço', value: serviceType },
            { label: 'Data', value: targetDate },
            { label: 'Horário', value: `${targetTime} (${targetTimeWindow})` },
            { label: 'Lembrete Automático', value: `${reminderMinutes} min antes (às ${reminderTime})` }
          ]
        },
        queryResult: null
      };
    }

    // Default general response
    return {
      action: 'general_query',
      requiresConfirmation: false,
      speechResponse: 'Não consegui entender completamente. Você quer criar um agendamento, uma tarefa ou consultar sua agenda?',
      writtenResponse: 'Não consegui identificar a ação com clareza. Você pode tentar dizer por exemplo:\n• "Agendar manutenção para João amanhã às 14 horas e me lembrar uma hora antes"\n• "Quais são meus serviços de amanhã?"\n• "Encontrar o telefone do João"',
      missingInformation: null,
      clientClarification: null,
      parameters: {},
      confirmationSummary: null,
      queryResult: null
    };
  }

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
      server: { middlewareMode: true },
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
