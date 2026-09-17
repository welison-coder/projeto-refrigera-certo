// Voice Assistant Service for Ar Soluções Climatização
import { Client, Equipment, TechnicalVisit, Quote, MaintenanceLog } from '../types';

export interface VoiceAssistantContext {
  currentDateTime: string;
  todayDate: string;
  clients: Client[];
  equipment: Equipment[];
  upcomingVisits: TechnicalVisit[];
  quotes: Quote[];
  recentWorkOrders: MaintenanceLog[];
}

export interface VoiceConfirmationDetail {
  label: string;
  value: string;
}

export interface VoiceConfirmationSummary {
  title: string;
  details: VoiceConfirmationDetail[];
}

export interface VoiceCommandParameters {
  clientId?: string;
  clientName?: string;
  clientPhone?: string;
  clientAddress?: string;
  serviceType?: string;
  date?: string;
  time?: string;
  timeWindow?: string;
  reminderMinutes?: number;
  reminderTime?: string;
  reportedIssue?: string;
  notes?: string;
  visitId?: string;
  quoteId?: string;
  workOrderId?: string;
  newStatus?: string;
  taskTitle?: string;
  quoteTotal?: number;
  [key: string]: any;
}

export interface VoiceCommandResponse {
  action:
    | 'create_appointment'
    | 'update_appointment'
    | 'cancel_appointment'
    | 'get_appointments'
    | 'create_task'
    | 'get_customer'
    | 'create_quote'
    | 'get_quotes'
    | 'create_work_order'
    | 'update_work_order'
    | 'get_work_orders'
    | 'clarify_info'
    | 'general_query';
  requiresConfirmation: boolean;
  speechResponse: string;
  writtenResponse: string;
  missingInformation?: string | null;
  clientClarification?: Array<{ id: string; name: string; phone: string }> | null;
  parameters: VoiceCommandParameters;
  confirmationSummary?: VoiceConfirmationSummary | null;
  queryResult?: {
    type: 'appointments' | 'customer' | 'quotes' | 'work_orders' | 'info';
    items: any[];
    summary: string;
  } | null;
}

export interface VoiceChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  responsePayload?: VoiceCommandResponse;
  status?: 'pending_confirmation' | 'confirmed' | 'cancelled' | 'executed';
  reminderVisit?: TechnicalVisit;
}

const STORAGE_KEY_HISTORY = 'ar_solucoes_voice_assistant_history_v1';
const STORAGE_KEY_VOICE_MUTED = 'ar_solucoes_voice_assistant_muted';

// ==========================================
// 1. Web Speech Recognition Helper
// ==========================================
export class VoiceRecognitionManager {
  private recognition: any = null;
  private isListening: boolean = false;

  constructor() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'pt-BR';
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;
    }
  }

  public isSupported(): boolean {
    return Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  public startListening(
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (error: string) => void,
    onEnd: () => void
  ): boolean {
    if (!this.recognition) {
      onError('Reconhecimento de voz não suportado neste navegador. Use a digitação.');
      return false;
    }

    if (this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
    }

    this.recognition.onstart = () => {
      this.isListening = true;
    };

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const text = finalTranscript || interimTranscript;
      const isFinal = Boolean(finalTranscript);
      onResult(text, isFinal);
    };

    this.recognition.onerror = (event: any) => {
      this.isListening = false;
      console.warn('Erro no reconhecimento de voz:', event.error);
      let msg = 'Erro no microfone.';
      if (event.error === 'not-allowed') {
        msg = 'Permissão de microfone negada. Permita o acesso nas configurações do navegador.';
      } else if (event.error === 'no-speech') {
        msg = 'Nenhuma voz detectada. Tente falar mais próximo ao microfone.';
      } else if (event.error === 'network') {
        msg = 'Falha de conexão no reconhecimento de voz.';
      }
      onError(msg);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      onEnd();
    };

    try {
      this.recognition.start();
      return true;
    } catch (err: any) {
      this.isListening = false;
      onError('Não foi possível iniciar o microfone. ' + (err?.message || ''));
      return false;
    }
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
      this.isListening = false;
    }
  }
}

// ==========================================
// 2. Text-to-Speech (TTS) Helper
// ==========================================
export class VoiceSpeechManager {
  private isMuted: boolean = false;

  constructor() {
    this.isMuted = localStorage.getItem(STORAGE_KEY_VOICE_MUTED) === 'true';
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    localStorage.setItem(STORAGE_KEY_VOICE_MUTED, String(muted));
    if (muted) {
      this.stop();
    }
  }

  public speak(text: string, onEnd?: () => void) {
    if (this.isMuted || !window.speechSynthesis) {
      if (onEnd) onEnd();
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Stop current speech
      const cleanText = text
        .replace(/\*/g, '')
        .replace(/#/g, '')
        .replace(/\[.*?\]/g, '')
        .replace(/\(.*?\)/g, '')
        .trim();

      if (!cleanText) {
        if (onEnd) onEnd();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'pt-BR';
      utterance.rate = 1.05; // Natural technician speed
      utterance.pitch = 1.0;

      // Select Brazilian Portuguese voice if available
      const voices = window.speechSynthesis.getVoices();
      const ptVoice = voices.find(v => v.lang.startsWith('pt') || v.lang.includes('BR'));
      if (ptVoice) {
        utterance.voice = ptVoice;
      }

      if (onEnd) {
        utterance.onend = onEnd;
        utterance.onerror = onEnd;
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Falha no sintetizador de voz (TTS):', e);
      if (onEnd) onEnd();
    }
  }

  public stop() {
    if (window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        // ignore
      }
    }
  }
}

// ==========================================
// 3. Main Voice Assistant Service API Client
// ==========================================
export const voiceAssistantService = {
  recognitionManager: new VoiceRecognitionManager(),
  speechManager: new VoiceSpeechManager(),

  // Load chat history
  getHistory(): VoiceChatMessage[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error('Erro ao ler histórico de voz:', e);
    }
    return [
      {
        id: 'welcome-msg',
        sender: 'assistant',
        text: 'Olá! Sou o Assistente Inteligente da Ar Soluções. Você pode me pedir por voz ou texto para agendar manutenções, criar orçamentos, consultar sua agenda de hoje ou amanhã, ou buscar dados de clientes.',
        timestamp: new Date().toISOString()
      }
    ];
  },

  // Save chat history
  saveHistory(messages: VoiceChatMessage[]) {
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(messages.slice(-30)));
    } catch (e) {
      console.error('Erro ao salvar histórico de voz:', e);
    }
  },

  // Clear chat history
  clearHistory(): VoiceChatMessage[] {
    const defaultMsg: VoiceChatMessage[] = [
      {
        id: 'welcome-msg-' + Date.now(),
        sender: 'assistant',
        text: 'Histórico limpo. Como posso ajudar você agora?',
        timestamp: new Date().toISOString()
      }
    ];
    this.saveHistory(defaultMsg);
    return defaultMsg;
  },

  // Call Server-side AI processing endpoint
  async sendVoiceCommand(
    userSpeech: string,
    history: VoiceChatMessage[],
    context: VoiceAssistantContext
  ): Promise<VoiceCommandResponse> {
    const formattedHistory = history.slice(-6).map(h => ({
      role: h.sender === 'user' ? 'user' : 'assistant',
      text: h.text
    }));

    const response = await fetch('/api/ai/voice-command', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userSpeech,
        conversationHistory: formattedHistory,
        context: {
          currentDateTime: context.currentDateTime,
          todayDate: context.todayDate,
          clients: context.clients,
          equipment: context.equipment,
          upcomingVisits: context.upcomingVisits,
          quotes: context.quotes,
          recentWorkOrders: context.recentWorkOrders
        }
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Erro no servidor: ${response.status}`);
    }

    return await response.json();
  }
};
