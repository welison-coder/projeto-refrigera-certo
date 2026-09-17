import React, { useState } from 'react';
import {
  Bell,
  Calendar,
  Smartphone,
  Check,
  Share2,
  ExternalLink,
  Download,
  Phone,
  Clock,
  MapPin,
  User,
  ShieldCheck,
  Sparkles,
  Navigation
} from 'lucide-react';
import { TechnicalVisit, CompanySettings } from '../types';
import { formatDateBR, createWhatsAppLink, generateVisitConfirmationMessage } from '../utils/formatters';
import { getGoogleMapsRouteUrl, getWazeRouteUrl, getAppleMapsRouteUrl, getAndroidGeoUrl, isIOS, normalizeLocationUrl } from '../utils/navigation';
import {
  generateGoogleCalendarUrl,
  downloadICSFile,
  requestMobileNotificationPermission,
  triggerImmediateNotification
} from '../utils/calendarReminder';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  visit: TechnicalVisit | null;
  companySettings: CompanySettings;
  autoTriggered?: boolean;
}

export const ReminderModal: React.FC<ReminderModalProps> = ({
  isOpen,
  onClose,
  visit,
  companySettings,
  autoTriggered = false
}) => {
  const [reminderMinutes, setReminderMinutes] = useState<number>(60);
  const [notificationStatus, setNotificationStatus] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  if (!isOpen || !visit) return null;

  const googleCalUrl = generateGoogleCalendarUrl(visit, companySettings.tradeName);

  const handleOpenGoogleCal = () => {
    window.open(googleCalUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDownloadICS = () => {
    downloadICSFile(visit, companySettings.tradeName, reminderMinutes);
  };

  const handleEnableWebNotification = async () => {
    const perm = await requestMobileNotificationPermission();
    if (perm === 'granted') {
      const ok = triggerImmediateNotification(
        `Lembrete Ativado: Visita em ${visit.clientName}`,
        `Data: ${formatDateBR(visit.date)} às ${visit.timeWindow} com ${visit.technicianName}.`
      );
      if (ok) {
        setNotificationStatus('Notificação de teste disparada no celular!');
      } else {
        setNotificationStatus('Permissão concedida! Seu navegador alertará as visitas.');
      }
    } else {
      setNotificationStatus('Permissão para notificações não foi autorizada no aparelho.');
    }
    setTimeout(() => setNotificationStatus(''), 4000);
  };

  const handleCopyCalendarLink = () => {
    navigator.clipboard.writeText(googleCalUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const waMessage = generateVisitConfirmationMessage(
    companySettings.tradeName,
    visit.clientName,
    visit.date,
    visit.timeWindow,
    visit.technicianName,
    visit.serviceType,
    googleCalUrl
  );
  const waLink = createWhatsAppLink(visit.clientPhone, waMessage);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 p-5 sm:p-6">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-200/60">
              <Bell className="w-5 h-5 text-sky-600 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-lg font-bold text-slate-900">Lembrete no Celular</h2>
                {autoTriggered && (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                    Agendado!
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Sincronize o agendamento com a agenda e alarme do seu celular.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold p-1 text-lg rounded-lg hover:bg-slate-100 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Visit Details Pill */}
        <div className="my-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
          <div className="flex items-center justify-between font-bold text-slate-900 text-sm">
            <span>{visit.clientName}</span>
            <span className="text-sky-700 font-mono text-xs">{visit.code}</span>
          </div>
          <p className="text-slate-600 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            <span className="font-semibold text-slate-800">{formatDateBR(visit.date)}</span>
            <span>•</span>
            <Clock className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            <span className="font-semibold text-slate-800">{visit.timeWindow}</span>
          </p>
          <p className="text-slate-600 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Técnico: <strong>{visit.technicianName}</strong></span>
          </p>
          <p className="text-slate-600 flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            <a
              href={getGoogleMapsRouteUrl(visit.clientAddress, visit.clientCep)}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate hover:underline hover:text-sky-700 decoration-sky-400"
              title="Abrir rota no aplicativo de navegação"
            >
              {visit.clientAddress}
            </a>
          </p>
        </div>

        {/* GPS Navigation 1-Click Section */}
        <div className="mb-4 p-3 rounded-xl bg-sky-50/70 border border-sky-200/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-sky-600" />
              Navegar até o Cliente (Rota no GPS)
            </span>
            <span className="text-[10px] text-sky-700 bg-sky-100 px-1.5 py-0.5 rounded font-semibold">1 Toque no Celular</span>
          </div>

          {visit.clientLocationUrl && (
            <div className="mb-2.5">
              <a
                id="btn-navigate-direct-location"
                href={normalizeLocationUrl(visit.clientLocationUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold shadow-2xs transition-colors"
                title="Abrir rota direta cadastrada do cliente"
              >
                <MapPin className="w-4 h-4 text-emerald-200 shrink-0" />
                <span>Abrir Rota Direta do Cliente</span>
                <ExternalLink className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
              </a>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <a
              id="btn-navigate-google-maps"
              href={getGoogleMapsRouteUrl(visit.clientAddress, visit.clientCep)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white text-xs font-semibold shadow-2xs transition-colors"
              title="Abrir rota imediatamente no Google Maps"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Google Maps</span>
            </a>
            <a
              id="btn-navigate-waze"
              href={getWazeRouteUrl(visit.clientAddress, visit.clientCep)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 active:bg-cyan-800 text-white text-xs font-semibold shadow-2xs transition-colors"
              title="Abrir navegação imediatamente no Waze"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Waze GPS</span>
            </a>
            <a
              id="btn-navigate-alt-maps"
              href={isIOS() ? getAppleMapsRouteUrl(visit.clientAddress, visit.clientCep) : getAndroidGeoUrl(visit.clientAddress, visit.clientCep)}
              target="_blank"
              rel="noopener noreferrer"
              className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-700 hover:bg-slate-800 active:bg-slate-900 text-white text-xs font-semibold shadow-2xs transition-colors"
              title={isIOS() ? "Abrir rota no Apple Maps (iPhone)" : "Abrir no GPS Padrão do Celular (Android)"}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>{isIOS() ? 'Apple Maps' : 'GPS do Celular'}</span>
            </a>
          </div>
          {visit.clientCep && (
            <div className="mt-2 text-[10px] text-sky-800/80 font-mono bg-sky-100/50 px-2 py-0.5 rounded flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0"></span>
              <span>Destino indexado com CEP: {visit.clientCep}</span>
            </div>
          )}
        </div>

        {/* Alarm Offset Select */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
            <span>Antecedência do Alerta no Celular:</span>
            <span className="text-[11px] text-sky-600 font-normal">Dispara notificação antes</span>
          </label>
          <select
            value={reminderMinutes}
            onChange={(e) => setReminderMinutes(parseInt(e.target.value, 10))}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium bg-white focus:ring-2 focus:ring-sky-500"
          >
            <option value={15}>15 minutos antes da visita</option>
            <option value={30}>30 minutos antes da visita</option>
            <option value={60}>1 hora antes da visita (Recomendado)</option>
            <option value={120}>2 horas antes da visita</option>
            <option value={1440}>1 dia antes da visita</option>
          </select>
        </div>

        {/* Integration Buttons */}
        <div className="space-y-2.5">
          
          {/* Option 1: Google Calendar (Android / Gmail) */}
          <button
            id="btn-reminder-google-cal"
            onClick={handleOpenGoogleCal}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600 text-white font-semibold text-xs shadow-sm hover:shadow transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Smartphone className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm">Google Agenda (Android / Celular)</p>
                <p className="text-[11px] text-sky-100 font-normal">
                  Abre o app do celular com alarme e local preenchidos
                </p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-sky-200 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Option 2: Apple Calendar / Native .ICS file (iPhone / Outlook) */}
          <button
            id="btn-reminder-apple-cal"
            onClick={handleDownloadICS}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs shadow-sm hover:shadow transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-sky-300" />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm">Apple / Calendário do iPhone (.ics)</p>
                <p className="text-[11px] text-slate-300 font-normal">
                  Importa com alarme sonoro de {reminderMinutes} min antes
                </p>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-300 group-hover:translate-y-0.5 transition-transform" />
          </button>

          {/* Option 3: Send to Client WhatsApp with Calendar link embedded */}
          <a
            id="btn-reminder-send-whatsapp"
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between p-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm hover:shadow transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center">
                <Phone className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm">Enviar Lembrete ao Cliente (WhatsApp)</p>
                <p className="text-[11px] text-emerald-100 font-normal">
                  Cliente recebe mensagem com link direto para salvar no celular dele
                </p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-emerald-200 group-hover:translate-x-0.5 transition-transform" />
          </a>

          {/* Option 4: Web Browser Notification */}
          <button
            type="button"
            onClick={handleEnableWebNotification}
            className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-sky-300 bg-slate-50 hover:bg-sky-50/40 text-slate-700 text-xs font-medium transition-all"
          >
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-sky-600" />
              <span>Ativar Notificações no Navegador do Aparelho</span>
            </div>
            <span className="text-[11px] text-sky-600 font-semibold">Ativar</span>
          </button>

          {/* Option 5: Copy Direct Calendar Link */}
          <button
            type="button"
            onClick={handleCopyCalendarLink}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-slate-500 hover:text-slate-800 transition-colors"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600 font-semibold">Link do lembrete copiado!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Copiar link direto do lembrete</span>
              </>
            )}
          </button>

        </div>

        {notificationStatus && (
          <p className="mt-3 p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium text-center">
            {notificationStatus}
          </p>
        )}

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
