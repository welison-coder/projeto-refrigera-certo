import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Send,
  Check,
  Edit3,
  Calendar,
  Clock,
  User,
  Wrench,
  Bell,
  Trash2,
  ChevronRight,
  Phone,
  FileText,
  AlertCircle,
  Sparkles,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import {
  Client,
  Equipment,
  TechnicalVisit,
  Quote,
  MaintenanceLog,
  VisitStatus
} from '../types';
import {
  voiceAssistantService,
  VoiceChatMessage,
  VoiceCommandResponse,
  VoiceCommandParameters
} from '../services/voiceAssistantService';
import { formatDateBR, createWhatsAppLink, generateVisitConfirmationMessage } from '../utils/formatters';
import {
  generateGoogleCalendarUrl,
  downloadICSFile,
  triggerImmediateNotification,
  requestMobileNotificationPermission
} from '../utils/calendarReminder';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  equipment: Equipment[];
  visits: TechnicalVisit[];
  quotes: Quote[];
  maintenanceLogs: MaintenanceLog[];
  onSaveVisit: (visit: TechnicalVisit) => void;
  onSaveQuote: (quote: Quote) => void;
  onSaveLog: (log: MaintenanceLog) => void;
  onSaveClient: (client: Client) => void;
  onNavigateTab: (tab: 'dashboard' | 'visits' | 'quotes' | 'maintenance' | 'clients') => void;
  onTriggerReminderModal: (visit: TechnicalVisit) => void;
}

type AssistantState = 'idle' | 'listening' | 'processing' | 'understood' | 'speaking';

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  clients,
  equipment,
  visits,
  quotes,
  maintenanceLogs,
  onSaveVisit,
  onSaveQuote,
  onSaveLog,
  onSaveClient,
  onNavigateTab,
  onTriggerReminderModal
}) => {
  const [messages, setMessages] = useState<VoiceChatMessage[]>(() =>
    voiceAssistantService.getHistory()
  );
  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [assistantState, setAssistantState] = useState<AssistantState>('idle');
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [isMuted, setIsMuted] = useState<boolean>(() =>
    voiceAssistantService.speechManager.getMuted()
  );
  const [pendingConfirmation, setPendingConfirmation] = useState<{
    messageId: string;
    response: VoiceCommandResponse;
  } | null>(null);

  // Edit parameters inline mode
  const [editingParams, setEditingParams] = useState<VoiceCommandParameters | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, messages, pendingConfirmation]);

  // Sync mute state
  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    voiceAssistantService.speechManager.setMuted(nextMuted);
  };

  // Build current system context for the AI
  const getSystemContext = () => {
    const now = new Date();
    const todayDate = now.toISOString().slice(0, 10);
    return {
      currentDateTime: now.toISOString(),
      todayDate,
      clients,
      equipment,
      upcomingVisits: visits,
      quotes,
      recentWorkOrders: maintenanceLogs
    };
  };

  // Execute Voice Command
  const processUserCommand = async (text: string) => {
    if (!text.trim()) return;

    const userMsgId = 'msg-user-' + Date.now();
    const userMessage: VoiceChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toISOString()
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    voiceAssistantService.saveHistory(nextMessages);
    setInputPrompt('');
    setLiveTranscript('');
    setAssistantState('processing');

    try {
      const context = getSystemContext();
      const response = await voiceAssistantService.sendVoiceCommand(
        text,
        nextMessages,
        context
      );

      setAssistantState('understood');

      // Create assistant chat bubble
      const assistantMsgId = 'msg-asst-' + Date.now();
      const assistantMessage: VoiceChatMessage = {
        id: assistantMsgId,
        sender: 'assistant',
        text: response.writtenResponse,
        timestamp: new Date().toISOString(),
        responsePayload: response,
        status: response.requiresConfirmation ? 'pending_confirmation' : 'executed'
      };

      const updatedHistory = [...nextMessages, assistantMessage];
      setMessages(updatedHistory);
      voiceAssistantService.saveHistory(updatedHistory);

      // Handle confirmation requirement
      if (response.requiresConfirmation) {
        setPendingConfirmation({
          messageId: assistantMsgId,
          response
        });
      } else {
        setPendingConfirmation(null);
      }

      // Speak response using TTS
      if (!isMuted && response.speechResponse) {
        setAssistantState('speaking');
        voiceAssistantService.speechManager.speak(response.speechResponse, () => {
          setAssistantState('idle');
        });
      } else {
        setTimeout(() => setAssistantState('idle'), 1200);
      }
    } catch (err: any) {
      console.error('Falha ao processar comando de voz:', err);
      setAssistantState('idle');
      const errorMsg: VoiceChatMessage = {
        id: 'msg-err-' + Date.now(),
        sender: 'assistant',
        text:
          'Desculpe, ocorreu uma instabilidade ao conectar com o serviço de IA. ' +
          (err?.message || 'Por favor, tente novamente ou use os botões rápidos.'),
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    }
  };

  // Voice recording triggers
  const handleStartListening = () => {
    if (assistantState === 'listening') {
      voiceAssistantService.recognitionManager.stopListening();
      setAssistantState('idle');
      return;
    }

    voiceAssistantService.speechManager.stop();
    setAssistantState('listening');
    setLiveTranscript('');

    const started = voiceAssistantService.recognitionManager.startListening(
      (transcript, isFinal) => {
        setLiveTranscript(transcript);
        if (isFinal && transcript.trim().length > 0) {
          voiceAssistantService.recognitionManager.stopListening();
          processUserCommand(transcript);
        }
      },
      (errorMsg) => {
        setAssistantState('idle');
        const alertMsg: VoiceChatMessage = {
          id: 'msg-alert-' + Date.now(),
          sender: 'assistant',
          text: errorMsg,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, alertMsg]);
      },
      () => {
        if (assistantState === 'listening' && liveTranscript.trim()) {
          processUserCommand(liveTranscript);
        } else {
          setAssistantState('idle');
        }
      }
    );

    if (!started) {
      setAssistantState('idle');
    }
  };

  // ========================================================
  // ACTION EXECUTION (Calling Existing System Functions)
  // ========================================================
  const handleConfirmAction = () => {
    if (!pendingConfirmation) return;
    const { response } = pendingConfirmation;
    const { action, parameters } = response;

    let successNotice = '';
    let confirmedVisit: TechnicalVisit | undefined;

    if (action === 'create_appointment') {
      // 1. Resolve client with deep fuzzy & token matching
      let client = clients.find(c => c.id === parameters.clientId);
      const rawTargetName = (parameters.clientName || '').trim();

      if (!client && rawTargetName) {
        const lowerTarget = rawTargetName.toLowerCase();
        // Exact match
        client = clients.find(c => c.name.toLowerCase() === lowerTarget);

        // Includes match
        if (!client) {
          client = clients.find(c => {
            const cLower = c.name.toLowerCase();
            return cLower.includes(lowerTarget) || lowerTarget.includes(cLower);
          });
        }

        // Sub-token match (e.g. "Camila" matching "Dra. Camila Vasconcelos", "Pão Dourado" matching "Padaria & Empório Pão Dourado Ltda")
        if (!client) {
          const searchTokens = lowerTarget
            .replace(/^(dra\.?|dr\.?|sr\.?|sra\.?|o|a|cliente|padaria|supermercado)\s+/gi, '')
            .split(/[\s,()\-–/]+/)
            .filter(t => t.length >= 3);
          if (searchTokens.length > 0) {
            client = clients.find(c => {
              const cTokens = c.name.toLowerCase().split(/[\s,()\-–/]+/).filter(t => t.length >= 3);
              return searchTokens.some(st => cTokens.includes(st));
            });
          }
        }
      }

      // Determine clean client name (never allow placeholder like '(a confirmar)' or 'Cliente a Selecionar')
      let cleanClientName = client ? client.name : rawTargetName;
      if (!cleanClientName || ['a confirmar', '(a confirmar)', 'cliente a selecionar', 'cliente a vincular', 'cliente'].includes(cleanClientName.toLowerCase())) {
        cleanClientName = clients.length > 0 ? clients[0].name : 'Cliente Principal';
      }

      if (!client) {
        client = {
          id: 'client-' + Date.now(),
          name: cleanClientName,
          document: 'Não informado',
          phone: parameters.clientPhone || '',
          email: '',
          address: {
            street: parameters.clientAddress || 'Endereço a combinar',
            number: '',
            neighborhood: '',
            city: 'São Paulo'
          },
          createdAt: new Date().toISOString()
        };
        onSaveClient(client);
      }

      const visitYear = new Date().getFullYear();
      const visitCount = visits.length + 1;
      const visitCode = `VIS-${visitYear}-${String(visitCount).padStart(3, '0')}`;

      // Address resolution: ensure it's not 'Endereço a confirmar'
      let resolvedAddress = '';
      if (client?.address?.street) {
        resolvedAddress = `${client.address.street} ${client.address.number || ''}`.trim();
        if (client.address.neighborhood) resolvedAddress += ` - ${client.address.neighborhood}`;
        if (client.address.city) resolvedAddress += `, ${client.address.city}`;
      } else if (parameters.clientAddress && !parameters.clientAddress.toLowerCase().includes('confirmar')) {
        resolvedAddress = parameters.clientAddress;
      } else {
        resolvedAddress = 'Atendimento presencial no local do cliente';
      }

      const reminderMinutes = parameters.reminderMinutes || 60;
      const reminderTime = parameters.reminderTime || '1 hora antes';

      const newVisit: TechnicalVisit = {
        id: 'visit-' + Date.now(),
        code: visitCode,
        clientId: client.id,
        clientName: cleanClientName,
        clientPhone: client.phone || parameters.clientPhone || '',
        clientAddress: resolvedAddress,
        equipmentIds: [],
        date: parameters.date || new Date().toISOString().slice(0, 10),
        timeWindow: parameters.timeWindow || `${parameters.time || '14:00'} - 16:00`,
        technicianName: 'Wellisson Medeiros (Técnico Responsável)',
        serviceType: parameters.serviceType || 'Manutenção Preventiva',
        reportedIssue: parameters.reportedIssue || 'Agendamento registrado pelo Assistente por Voz',
        status: 'Agendada',
        notes: `Lembrete automático programado para ${reminderMinutes} min antes (${reminderTime}).`
      };

      // 1. Call existing save function
      onSaveVisit(newVisit);
      confirmedVisit = newVisit;

      // 2. AUTOMATICALLY CREATE REMINDER
      // Trigger reminder modal in App
      onTriggerReminderModal(newVisit);

      // Fire or request browser notification
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          try {
            triggerImmediateNotification(
              `⏰ Lembrete Criado: ${newVisit.clientName}`,
              `Agendamento de ${newVisit.serviceType} em ${formatDateBR(newVisit.date)} às ${newVisit.timeWindow}. Alarme automático ativo!`
            );
          } catch (e) {
            console.warn('Could not trigger notification', e);
          }
        } else if (Notification.permission === 'default') {
          requestMobileNotificationPermission();
        }
      }

      successNotice = `Agendamento ${newVisit.code} confirmado para ${newVisit.clientName} em ${formatDateBR(newVisit.date)} às ${newVisit.timeWindow}! Lembrete automático de ${reminderMinutes} min antes ativado.`;
      
      // Notify voice
      if (!isMuted) {
        voiceAssistantService.speechManager.speak(`Agendamento confirmado com sucesso para ${newVisit.clientName} com lembrete automático ativado!`);
      }
    } else if (action === 'update_appointment') {
      const visitToUpdate = visits.find(
        v => v.id === parameters.visitId || v.clientName.toLowerCase().includes((parameters.clientName || '').toLowerCase())
      );
      if (visitToUpdate) {
        const updated: TechnicalVisit = {
          ...visitToUpdate,
          date: parameters.date || visitToUpdate.date,
          timeWindow: parameters.timeWindow || visitToUpdate.timeWindow,
          serviceType: parameters.serviceType || visitToUpdate.serviceType,
          status: (parameters.newStatus as VisitStatus) || visitToUpdate.status
        };
        onSaveVisit(updated);
        successNotice = `Visita ${updated.code} de ${updated.clientName} foi atualizada para ${formatDateBR(updated.date)}!`;
        if (!isMuted) {
          voiceAssistantService.speechManager.speak(`Visita de ${updated.clientName} atualizada.`);
        }
      }
    } else if (action === 'cancel_appointment') {
      const visitToCancel = visits.find(
        v => v.id === parameters.visitId || v.clientName.toLowerCase().includes((parameters.clientName || '').toLowerCase())
      );
      if (visitToCancel) {
        const cancelled: TechnicalVisit = {
          ...visitToCancel,
          status: 'Cancelada'
        };
        onSaveVisit(cancelled);
        successNotice = `A visita de ${cancelled.clientName} foi marcada como Cancelada.`;
        if (!isMuted) {
          voiceAssistantService.speechManager.speak(`Agendamento de ${cancelled.clientName} cancelado.`);
        }
      }
    } else if (action === 'create_task') {
      // Create reminder or task
      const dummyVisit: TechnicalVisit = {
        id: 'task-' + Date.now(),
        code: 'TAR-' + Math.floor(Math.random() * 900 + 100),
        clientId: '',
        clientName: parameters.clientName || 'Tarefa Geral',
        clientPhone: '',
        clientAddress: 'Atendimento operacional',
        equipmentIds: [],
        date: parameters.date || new Date().toISOString().slice(0, 10),
        timeWindow: parameters.time || '14:00',
        technicianName: 'Wellisson Medeiros',
        serviceType: 'Lembrete / Tarefa',
        reportedIssue: parameters.taskTitle || parameters.reportedIssue || 'Tarefa de voz',
        status: 'Agendada'
      };
      onTriggerReminderModal(dummyVisit);
      confirmedVisit = dummyVisit;
      successNotice = `Lembrete programado para ${formatDateBR(parameters.date || new Date().toISOString().slice(0, 10))} às ${parameters.time || '14:00'}!`;
    } else if (action === 'update_work_order') {
      const log = maintenanceLogs.find(
        l => l.id === parameters.workOrderId || l.clientName.toLowerCase().includes((parameters.clientName || '').toLowerCase())
      );
      if (log) {
        const updatedLog: MaintenanceLog = {
          ...log,
          status: (parameters.newStatus as any) || 'Concluído',
          observations: parameters.notes ? `${log.observations}\nObs via Voz: ${parameters.notes}` : log.observations
        };
        onSaveLog(updatedLog);
        successNotice = `Ordem de Serviço ${log.code} atualizada com sucesso!`;
      }
    }

    // Add confirmation message to chat
    const confMsg: VoiceChatMessage = {
      id: 'msg-exec-' + Date.now(),
      sender: 'assistant',
      text: `✅ ${successNotice || 'Ação executada com sucesso no sistema!'}`,
      timestamp: new Date().toISOString(),
      reminderVisit: confirmedVisit
    };
    const updatedHistory = [...messages, confMsg];
    setMessages(updatedHistory);
    voiceAssistantService.saveHistory(updatedHistory);

    setPendingConfirmation(null);
    setEditingParams(null);
  };

  const handleCancelAction = () => {
    setPendingConfirmation(null);
    setEditingParams(null);
    const cancelMsg: VoiceChatMessage = {
      id: 'msg-cancel-' + Date.now(),
      sender: 'assistant',
      text: 'Ação cancelada. Nenhuma alteração foi realizada no sistema.',
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, cancelMsg]);
    if (!isMuted) {
      voiceAssistantService.speechManager.speak('Operação cancelada.');
    }
  };

  const handleClearHistory = () => {
    const fresh = voiceAssistantService.clearHistory();
    setMessages(fresh);
    setPendingConfirmation(null);
    setEditingParams(null);
  };

  if (!isOpen) return null;

  return (
    <div
      id="voice-assistant-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="voice-assistant-modal"
        className="bg-white rounded-2xl max-w-xl w-full flex flex-col shadow-2xl border border-slate-200 h-[88vh] max-h-[760px] overflow-hidden"
      >
        {/* ======================================================== */}
        {/* Header                                                   */}
        {/* ======================================================== */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 text-white px-5 py-4 flex items-center justify-between border-b border-slate-700/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  assistantState === 'listening'
                    ? 'bg-rose-500 shadow-lg shadow-rose-500/40 animate-pulse'
                    : assistantState === 'processing'
                    ? 'bg-amber-500 animate-spin'
                    : 'bg-sky-600 shadow-md shadow-sky-600/30'
                }`}
              >
                <Mic className="w-5 h-5 text-white" />
              </div>
              {assistantState === 'listening' && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white leading-tight">
                  Assistente por Voz
                </h2>
                <span className="text-[10px] font-semibold bg-sky-500/30 text-sky-200 px-2 py-0.5 rounded-full border border-sky-400/30 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-sky-300" />
                  IA Integrada
                </span>
              </div>
              <p className="text-[11px] text-slate-300 flex items-center gap-1.5 mt-0.5">
                {assistantState === 'listening' ? (
                  <span className="text-rose-300 font-medium animate-pulse">
                    🎙️ Estou ouvindo você... fale agora
                  </span>
                ) : assistantState === 'processing' ? (
                  <span className="text-amber-300 font-medium">
                    ⚡ Interpretando comando com IA...
                  </span>
                ) : assistantState === 'speaking' ? (
                  <span className="text-sky-300 font-medium">
                    🔊 Respondendo por voz...
                  </span>
                ) : (
                  <span className="text-slate-300">
                    Toque no microfone ou digite seu pedido
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Audio Voice Mute Toggle */}
            <button
              id="voice-mute-toggle"
              type="button"
              onClick={toggleMute}
              className={`p-2 rounded-lg transition-colors ${
                isMuted
                  ? 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  : 'bg-sky-500/20 text-sky-300 hover:bg-sky-500/30'
              }`}
              title={isMuted ? 'Ativar resposta falada (Voz desativada)' : 'Desativar resposta falada (Voz ativada)'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Clear history */}
            <button
              id="voice-clear-history"
              type="button"
              onClick={handleClearHistory}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="Limpar histórico de conversa"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Close */}
            <button
              id="voice-close-modal"
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Fechar assistente"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* Chat Stream & Interaction Canvas                         */}
        {/* ======================================================== */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/60">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            const payload = msg.responsePayload;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
              >
                <div
                  className={`max-w-[88%] sm:max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-2xs whitespace-pre-wrap ${
                    isUser
                      ? 'bg-sky-600 text-white rounded-br-xs'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
                  }`}
                >
                  <p>{msg.text}</p>

                  {/* Disambiguation: Multiple Clients found */}
                  {payload?.clientClarification && payload.clientClarification.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-2">
                      <p className="font-semibold text-slate-700 text-[11px]">
                        Toque no cliente correto para prosseguir:
                      </p>
                      <div className="space-y-1.5">
                        {payload.clientClarification.map((cli) => (
                          <button
                            key={cli.id}
                            type="button"
                            onClick={() => {
                              processUserCommand(`Confirmar agendamento para o cliente ${cli.name}`);
                            }}
                            className="w-full text-left bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-950 p-2.5 rounded-lg flex items-center justify-between text-xs transition-colors group"
                          >
                            <div className="flex items-center gap-2">
                              <User className="w-3.5 h-3.5 text-sky-600" />
                              <div>
                                <span className="font-bold">{cli.name}</span>
                                {cli.phone && (
                                  <span className="text-[10px] text-slate-500 block">
                                    Tel: {cli.phone}
                                  </span>
                                )}
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-sky-600 group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Direct Query Result Display (Appointments, Customers, Quotes) */}
                  {payload?.queryResult && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100">
                      {payload.queryResult.type === 'appointments' && (
                        <div className="space-y-2">
                          <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-sky-600" />
                            Serviços Agendados:
                          </span>
                          {payload.queryResult.items.length === 0 ? (
                            <p className="text-[11px] text-slate-500 italic">Nenhum serviço programado para este período.</p>
                          ) : (
                            <div className="space-y-1.5">
                              {payload.queryResult.items.map((it: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-center justify-between"
                                >
                                  <div>
                                    <div className="font-bold text-slate-900">{it.clientName}</div>
                                    <div className="text-[10px] text-slate-500 flex items-center gap-2">
                                      <span>⏰ {it.timeWindow || it.time}</span>
                                      <span>• {it.serviceType}</span>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onClose();
                                      onNavigateTab('visits');
                                    }}
                                    className="text-[10px] font-semibold text-sky-600 hover:text-sky-800 bg-white px-2 py-1 rounded border border-slate-200"
                                  >
                                    Ver Agenda →
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {payload.queryResult.type === 'customer' && (
                        <div className="space-y-2">
                          {payload.queryResult.items.map((cli: any) => (
                            <div
                              key={cli.id}
                              className="p-3 bg-sky-50/70 border border-sky-200 rounded-lg text-xs space-y-1.5"
                            >
                              <div className="font-bold text-slate-900 flex items-center justify-between">
                                <span>{cli.name}</span>
                                <span className="text-[10px] text-sky-700 font-normal">Cliente Ativo</span>
                              </div>
                              {cli.phone && (
                                <div className="flex items-center gap-2 text-slate-700 text-xs">
                                  <Phone className="w-3 h-3 text-sky-600" />
                                  <span className="font-mono">{cli.phone}</span>
                                  <a
                                    href={`https://wa.me/55${cli.phone.replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-auto text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded font-semibold hover:bg-emerald-700"
                                  >
                                    WhatsApp
                                  </a>
                                </div>
                              )}
                              {cli.address?.street && (
                                <p className="text-[11px] text-slate-600">
                                  📍 {cli.address.street}, {cli.address.number || 'S/N'} {cli.address.neighborhood || ''} - {cli.address.city || ''}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {payload.queryResult.type === 'quotes' && (
                        <div className="space-y-2">
                          <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-sky-600" />
                            Orçamentos em Aberto:
                          </span>
                          <div className="space-y-1.5">
                            {payload.queryResult.items.slice(0, 4).map((q: any) => (
                              <div
                                key={q.id}
                                className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-center justify-between"
                              >
                                <div>
                                  <span className="font-bold text-slate-800">{q.number || 'ORC'}: {q.clientName}</span>
                                  <div className="text-[10px] text-slate-500">
                                    Total: R$ {Number(q.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onClose();
                                    onNavigateTab('quotes');
                                  }}
                                  className="text-[10px] text-sky-600 font-semibold underline"
                                >
                                  Abrir
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Automatic Reminder Quick Actions */}
                  {msg.reminderVisit && (
                    <div className="mt-3 p-3 bg-emerald-50/90 border border-emerald-200 rounded-xl space-y-2.5 text-xs animate-in fade-in">
                      <div className="flex items-center justify-between pb-1.5 border-b border-emerald-200/70">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                          <Bell className="w-3.5 h-3.5 text-emerald-600 animate-bounce" />
                          <span>Lembrete Automático Ativado</span>
                        </div>
                        <span className="text-[10px] bg-emerald-200/70 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                          60 min antes
                        </span>
                      </div>

                      <div className="text-[11px] text-emerald-800 space-y-0.5">
                        <div className="flex justify-between">
                          <span className="text-emerald-700">Cliente:</span>
                          <span className="font-bold text-emerald-950">{msg.reminderVisit.clientName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-emerald-700">Data e Horário:</span>
                          <span className="font-semibold text-emerald-950">
                            {formatDateBR(msg.reminderVisit.date)} às {msg.reminderVisit.timeWindow}
                          </span>
                        </div>
                      </div>

                      {/* Instant Actions Grid */}
                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            const googleUrl = generateGoogleCalendarUrl(msg.reminderVisit!, 'Ar Soluções Climatização');
                            window.open(googleUrl, '_blank');
                          }}
                          className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-white hover:bg-emerald-100/50 text-emerald-800 border border-emerald-300 rounded-lg text-[10px] font-bold shadow-2xs transition-colors cursor-pointer"
                        >
                          <Calendar className="w-3 h-3 text-sky-600" />
                          Google Agenda
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            downloadICSFile(msg.reminderVisit!, 'Ar Soluções Climatização', 60);
                          }}
                          className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold shadow-2xs transition-colors cursor-pointer"
                        >
                          <Bell className="w-3 h-3" />
                          Baixar Alarme (.ics)
                        </button>

                        {msg.reminderVisit.clientPhone && (
                          <a
                            href={createWhatsAppLink(
                              msg.reminderVisit.clientPhone,
                              generateVisitConfirmationMessage(
                                'Ar Soluções Climatização',
                                msg.reminderVisit.clientName,
                                formatDateBR(msg.reminderVisit.date),
                                msg.reminderVisit.timeWindow,
                                msg.reminderVisit.technicianName,
                                msg.reminderVisit.serviceType,
                                generateGoogleCalendarUrl(msg.reminderVisit, 'Ar Soluções Climatização')
                              )
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[10px] font-bold shadow-2xs transition-colors"
                          >
                            <MessageSquare className="w-3 h-3" />
                            Avisar WhatsApp
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => onTriggerReminderModal(msg.reminderVisit!)}
                          className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer"
                        >
                          <ExternalLink className="w-3 h-3 text-slate-500" />
                          Ver Painel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <span className="text-[9px] text-slate-400 px-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })}

          {/* Real-time Listening Wave Preview */}
          {assistantState === 'listening' && (
            <div className="flex items-center gap-2 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 animate-in fade-in">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-4 bg-rose-600 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-6 bg-rose-600 rounded-full animate-bounce [animation-delay:0.15s]"></span>
                <span className="w-1.5 h-3 bg-rose-600 rounded-full animate-bounce [animation-delay:0.3s]"></span>
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-bold block text-rose-700">Estou ouvindo...</span>
                <span className="text-[11px] text-rose-600 truncate block">
                  {liveTranscript || 'Fale seu comando de agendamento ou consulta...'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  voiceAssistantService.recognitionManager.stopListening();
                  if (liveTranscript.trim()) {
                    processUserCommand(liveTranscript);
                  } else {
                    setAssistantState('idle');
                  }
                }}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold shadow-xs shrink-0"
              >
                Concluir Fala
              </button>
            </div>
          )}

          {/* ======================================================== */}
          {/* Confirmation Box (Mandatory for Critical Actions)        */}
          {/* ======================================================== */}
          {pendingConfirmation && (
            <div
              id="voice-confirmation-dialog"
              className="bg-white rounded-xl border-2 border-sky-500 shadow-md p-4 space-y-3 animate-in zoom-in-95 duration-150"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-sky-100 text-sky-700 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900">
                    {pendingConfirmation.response.confirmationSummary?.title || 'Confirmação de Ação'}
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Confirmação Obrigatória
                </span>
              </div>

              {/* Confirmation Details Card */}
              {!editingParams ? (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 space-y-2 text-xs">
                  {pendingConfirmation.response.confirmationSummary?.details ? (
                    pendingConfirmation.response.confirmationSummary.details.map((detail, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">{detail.label}:</span>
                        <span className="font-bold text-slate-900 text-right">{detail.value}</span>
                      </div>
                    ))
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Cliente:</span>
                        <span className="font-bold text-slate-900">
                          {pendingConfirmation.response.parameters.clientName && !['a confirmar', '(a confirmar)', 'cliente a selecionar', 'cliente a vincular'].includes(pendingConfirmation.response.parameters.clientName.toLowerCase())
                            ? pendingConfirmation.response.parameters.clientName
                            : (clients[0]?.name || 'Cliente Principal')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Serviço:</span>
                        <span className="font-bold text-slate-900">
                          {pendingConfirmation.response.parameters.serviceType || 'Manutenção Preventiva'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Data:</span>
                        <span className="font-bold text-slate-900">
                          {formatDateBR(pendingConfirmation.response.parameters.date || '')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Horário:</span>
                        <span className="font-bold text-slate-900">
                          {pendingConfirmation.response.parameters.time || '14:00'} ({pendingConfirmation.response.parameters.timeWindow || '14:00 - 16:00'})
                        </span>
                      </div>
                      <div className="flex justify-between text-emerald-700 font-medium">
                        <span>Lembrete Automático:</span>
                        <span className="font-bold">
                          {pendingConfirmation.response.parameters.reminderMinutes || 60} min antes (Alarme Ativo)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Inline Edit Mode */
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2 text-xs">
                  <div className="font-bold text-slate-800 text-[11px] mb-1">
                    Ajustar parâmetros antes de salvar:
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="text-[10px] text-slate-500 block">Nome do Cliente:</label>
                      {clients.length > 0 && (
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              const sel = clients.find(c => c.name === e.target.value);
                              setEditingParams({
                                ...editingParams,
                                clientName: e.target.value,
                                clientId: sel?.id,
                                clientPhone: sel?.phone || editingParams.clientPhone
                              });
                            }
                          }}
                          className="text-[10px] text-sky-700 bg-transparent border-0 font-medium cursor-pointer"
                        >
                          <option value="">Selecionar cadastrado...</option>
                          {clients.map(c => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                      )}
                    </div>
                    <input
                      type="text"
                      value={editingParams.clientName || ''}
                      onChange={(e) => setEditingParams({ ...editingParams, clientName: e.target.value })}
                      placeholder="Ex: Dra. Camila ou Padaria Pão Dourado"
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs bg-white font-medium"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">Data:</label>
                      <input
                        type="date"
                        value={editingParams.date || ''}
                        onChange={(e) => setEditingParams({ ...editingParams, date: e.target.value })}
                        className="w-full px-2 py-1 rounded border border-slate-300 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">Horário / Janela:</label>
                      <input
                        type="text"
                        value={editingParams.timeWindow || editingParams.time || '14:00 - 16:00'}
                        onChange={(e) => setEditingParams({ ...editingParams, timeWindow: e.target.value })}
                        className="w-full px-2 py-1 rounded border border-slate-300 text-xs bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons: [CONFIRMAR] [EDITAR] [CANCELAR] */}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  id="voice-confirm-cancel-btn"
                  type="button"
                  onClick={handleCancelAction}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors"
                >
                  Cancelar
                </button>

                {!editingParams ? (
                  <button
                    id="voice-confirm-edit-btn"
                    type="button"
                    onClick={() => setEditingParams({ ...pendingConfirmation.response.parameters })}
                    className="px-3 py-1.5 rounded-lg border border-sky-300 bg-sky-50 hover:bg-sky-100 text-sky-800 font-semibold text-xs flex items-center gap-1 transition-colors"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Editar</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setPendingConfirmation({
                        ...pendingConfirmation,
                        response: {
                          ...pendingConfirmation.response,
                          parameters: editingParams
                        }
                      });
                      setEditingParams(null);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs transition-colors"
                  >
                    Salvar Ajuste
                  </button>
                )}

                <button
                  id="voice-confirm-accept-btn"
                  type="button"
                  onClick={handleConfirmAction}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Confirmar</span>
                </button>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ======================================================== */}
        {/* Quick Suggestion Chips                                   */}
        {/* ======================================================== */}
        <div className="px-4 py-2 bg-slate-100/90 border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto text-[11px] shrink-0 no-scrollbar">
          <span className="text-slate-400 font-semibold whitespace-nowrap">Exemplos:</span>
          <button
            type="button"
            onClick={() => processUserCommand('Quais são meus serviços de amanhã?')}
            className="px-2.5 py-1 rounded-full bg-white hover:bg-sky-50 border border-slate-200 text-slate-700 whitespace-nowrap transition-colors"
          >
            "Serviços de amanhã?"
          </button>
          <button
            type="button"
            onClick={() => processUserCommand('O que tenho agendado hoje?')}
            className="px-2.5 py-1 rounded-full bg-white hover:bg-sky-50 border border-slate-200 text-slate-700 whitespace-nowrap transition-colors"
          >
            "Agenda de hoje?"
          </button>
          <button
            type="button"
            onClick={() => {
              const sampleClient = clients[0]?.name || 'João';
              processUserCommand(`Agendar manutenção para ${sampleClient} amanhã às 14 horas e me lembrar uma hora antes`);
            }}
            className="px-2.5 py-1 rounded-full bg-white hover:bg-sky-50 border border-slate-200 text-slate-700 whitespace-nowrap transition-colors"
          >
            "Agendar manutenção amanhã às 14h..."
          </button>
          <button
            type="button"
            onClick={() => processUserCommand('Mostrar os orçamentos pendentes')}
            className="px-2.5 py-1 rounded-full bg-white hover:bg-sky-50 border border-slate-200 text-slate-700 whitespace-nowrap transition-colors"
          >
            "Orçamentos pendentes"
          </button>
        </div>

        {/* ======================================================== */}
        {/* Input Controls (Voice Mic & Fallback Text Field)        */}
        {/* ======================================================== */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              processUserCommand(inputPrompt);
            }}
            className="flex items-center gap-2"
          >
            {/* Prominent Voice Microphone Button */}
            <button
              id="voice-mic-main-button"
              type="button"
              onClick={handleStartListening}
              className={`p-3 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                assistantState === 'listening'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/40 ring-4 ring-rose-200 scale-105'
                  : 'bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/20'
              }`}
              title={assistantState === 'listening' ? 'Parar de ouvir' : 'Tocar para falar por voz'}
            >
              {assistantState === 'listening' ? (
                <MicOff className="w-5 h-5 animate-pulse" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>

            {/* Natural Language Text Fallback Field */}
            <div className="relative flex-1">
              <input
                ref={inputRef}
                id="voice-text-fallback-input"
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder="Fale no microfone ou digite seu comando aqui..."
                disabled={assistantState === 'listening'}
                className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs sm:text-sm bg-slate-50 focus:bg-white transition-all disabled:opacity-50"
              />

              <button
                id="voice-send-text-btn"
                type="submit"
                disabled={!inputPrompt.trim() || assistantState === 'listening'}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white disabled:opacity-30 disabled:hover:bg-sky-600 transition-colors"
                title="Enviar comando escrito"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          <p className="text-[10px] text-slate-400 text-center mt-2">
            💡 Dica: Diga <span className="font-semibold text-slate-600">"Agendar instalação para Carlos amanhã às 9 horas"</span> ou <span className="font-semibold text-slate-600">"Quais são meus serviços de hoje?"</span>
          </p>
        </div>
      </div>
    </div>
  );
};
