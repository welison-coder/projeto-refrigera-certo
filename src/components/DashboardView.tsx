import React from 'react';
import {
  CalendarDays,
  FileText,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Phone,
  ArrowRight,
  TrendingUp,
  MapPin,
  CalendarCheck,
  Bell,
  Navigation
} from 'lucide-react';
import { TechnicalVisit, Quote, Equipment, MaintenanceLog, CompanySettings } from '../types';
import { formatCurrency, formatDateBR, createWhatsAppLink, generateVisitConfirmationMessage } from '../utils/formatters';
import { generateGoogleCalendarUrl } from '../utils/calendarReminder';
import { RouteButton } from './RouteButton';
import { getGoogleMapsRouteUrl } from '../utils/navigation';
import { BrandLogo } from './BrandLogo';

interface DashboardViewProps {
  visits: TechnicalVisit[];
  quotes: Quote[];
  equipment: Equipment[];
  maintenanceLogs: MaintenanceLog[];
  companySettings: CompanySettings;
  onNavigate: (tab: 'visits' | 'quotes' | 'maintenance' | 'clients') => void;
  onScheduleVisit: () => void;
  onNewQuote: () => void;
  onOpenQuoteDetails: (quote: Quote) => void;
  onOpenVisitDetails: (visit: TechnicalVisit) => void;
  onQuickUpdateVisitStatus: (visitId: string, status: TechnicalVisit['status']) => void;
  onOpenReminderModal?: (visit: TechnicalVisit, autoTriggered?: boolean) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  visits,
  quotes,
  equipment,
  companySettings,
  onNavigate,
  onScheduleVisit,
  onNewQuote,
  onOpenQuoteDetails,
  onOpenVisitDetails,
  onQuickUpdateVisitStatus,
  onOpenReminderModal
}) => {
  // Current date (local time)
  const todayStr = '2026-09-02'; // or current day

  const todayVisits = visits.filter(v => v.date === todayStr);
  const pendingVisits = visits.filter(v => v.status === 'Agendada' || v.status === 'A Caminho' || v.status === 'Em Andamento');
  
  const pendingQuotes = quotes.filter(q => q.status === 'Enviado' || q.status === 'Rascunho');
  const approvedQuotes = quotes.filter(q => q.status === 'Aprovado' || q.status === 'Faturado');
  const totalApprovedValue = approvedQuotes.reduce((acc, q) => acc + q.total, 0);
  const totalPendingValue = pendingQuotes.reduce((acc, q) => acc + q.total, 0);

  // Equipment with upcoming maintenance (nextMaintenanceDate <= 30 days)
  const maintenanceAlerts = equipment.filter(eq => {
    if (!eq.nextMaintenanceDate) return false;
    // Check if within next 45 days or expired
    return eq.nextMaintenanceDate <= '2026-10-15';
  });

  return (
    <div className="space-y-6">
      
      {/* Top Welcome & Quick Actions Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-700/50">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-8">
          <Wrench className="w-64 h-64 text-sky-400" />
        </div>

        <div className="relative z-10 max-w-3xl">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <div className="bg-white/95 px-3.5 py-1.5 rounded-xl inline-flex items-center shadow-sm">
              <BrandLogo size="sm" theme="light" />
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-semibold border border-sky-400/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Operação em Tempo Real
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
            Gestão Integrada de Climatização
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
            Acompanhe a escala dos técnicos em rota, emita orçamentos com valor e garantia técnica expressa, e garanta a fidelização com o histórico das máquinas.
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              id="btn-dash-new-visit"
              onClick={onScheduleVisit}
              className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-sm shadow-md transition-all flex items-center gap-2"
            >
              <CalendarDays className="w-4 h-4" />
              <span>Agendar Nova Visita</span>
            </button>
            <button
              id="btn-dash-new-quote"
              onClick={onNewQuote}
              className="px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-sky-200 border border-sky-500/40 font-semibold text-sm transition-all flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              <span>Criar Novo Orçamento</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Visitas Pendentes */}
        <div 
          onClick={() => onNavigate('visits')}
          className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Visitas Pendentes</span>
            <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <CalendarDays className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">{pendingVisits.length}</span>
            <span className="text-xs text-slate-500">visitas na fila</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-sky-600 font-medium">
            <span>{todayVisits.length} agendadas para hoje</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Metric 2: Orçamentos em Aberto */}
        <div 
          onClick={() => onNavigate('quotes')}
          className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Orçamentos em Aberto</span>
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">{pendingQuotes.length}</span>
            <span className="text-xs text-amber-600 font-medium">Aguardando aprovação</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Previsão: <strong className="text-slate-800">{formatCurrency(totalPendingValue)}</strong></span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Metric 3: Faturamento Aprovado */}
        <div 
          onClick={() => onNavigate('quotes')}
          className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Orçamentos Aprovados</span>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-emerald-600">{formatCurrency(totalApprovedValue)}</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>{approvedQuotes.length} ordens faturadas/aprovadas</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Metric 4: Preventivas a Vencer / PMOC */}
        <div 
          onClick={() => onNavigate('maintenance')}
          className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Alertas de Manutenção</span>
            <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-rose-600">{maintenanceAlerts.length}</span>
            <span className="text-xs text-slate-500">máquinas a revisar</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-rose-600 font-medium">
            <span>Prevenção & fidelização</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

      </div>

      {/* Main Dual Grid: Visitas Agendadas & Orçamentos Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Próximas Visitas Técnicas (2 cols on desktop) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-sky-600" />
              <h2 className="font-bold text-lg text-slate-900">Agenda de Visitas Técnicas</h2>
            </div>
            <button
              onClick={() => onNavigate('visits')}
              className="text-xs font-semibold text-sky-600 hover:text-sky-800 flex items-center gap-1 transition-colors"
            >
              <span>Ver todas ({visits.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {visits.slice(0, 4).map((visit) => {
              const googleCalUrl = generateGoogleCalendarUrl(visit, companySettings.tradeName);
              const waText = generateVisitConfirmationMessage(
                companySettings.tradeName,
                visit.clientName,
                visit.date,
                visit.timeWindow,
                visit.technicianName,
                visit.serviceType,
                googleCalUrl
              );
              const waLink = createWhatsAppLink(visit.clientPhone, waText);

              return (
                <div
                  key={visit.id}
                  className="p-4 rounded-xl border border-slate-200 hover:border-sky-300 bg-slate-50/50 hover:bg-sky-50/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 cursor-pointer flex-1" onClick={() => onOpenVisitDetails(visit)}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900">{visit.clientName}</span>
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                        visit.status === 'Concluída'
                          ? 'bg-emerald-100 text-emerald-700'
                          : visit.status === 'Em Andamento'
                          ? 'bg-blue-100 text-blue-700'
                          : visit.status === 'A Caminho'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-200 text-slate-700'
                      }`}>
                        {visit.status}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">#{visit.code}</span>
                    </div>

                    <p className="text-xs text-slate-600 font-medium flex items-center gap-1.5">
                      <span className="text-sky-700 font-semibold">{visit.serviceType}</span>
                      <span>•</span>
                      <span>{visit.timeWindow} ({formatDateBR(visit.date)})</span>
                    </p>

                    <div className="text-xs text-slate-500 flex items-center gap-1 truncate max-w-md">
                      <MapPin className="w-3 h-3 text-sky-600 shrink-0" />
                      <a
                        href={getGoogleMapsRouteUrl(visit.clientAddress, visit.clientCep)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="truncate hover:underline hover:text-sky-700 decoration-sky-400"
                        title="Abrir rota no aplicativo de navegação"
                      >
                        {visit.clientAddress}
                      </a>
                      {visit.clientCep && (
                        <span className="shrink-0 px-1.5 py-0.2 rounded bg-sky-100/70 text-sky-800 text-[10px] font-mono font-semibold">
                          CEP: {visit.clientCep}
                        </span>
                      )}
                      {visit.clientLocationUrl && (
                        <span className="shrink-0 px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[10px] font-semibold flex items-center gap-1">
                          ● Rota Direta
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                    {/* 1-Click GPS Navigation Button with CEP and Location Link */}
                    <RouteButton
                      address={visit.clientAddress}
                      cep={visit.clientCep}
                      locationUrl={visit.clientLocationUrl}
                      size="sm"
                      variant="primary"
                    />

                    <button
                      type="button"
                      onClick={() => onOpenReminderModal?.(visit, false)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-semibold border border-sky-200/80 transition-colors"
                      title="Sincronizar lembrete com alarme no celular"
                    >
                      <Bell className="w-3.5 h-3.5 text-sky-600" />
                      <span>Lembrete</span>
                    </button>

                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
                      title="Enviar confirmação no WhatsApp com link do lembrete"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>

                    {visit.status !== 'Concluída' && (
                      <button
                        onClick={() => onQuickUpdateVisitStatus(visit.id, 'Concluída')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition-colors"
                        title="Marcar visita como Concluída"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Concluir</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Orçamentos em Destaque & Alertas de Preventiva */}
        <div className="space-y-6">
          
          {/* Orçamentos Recentes Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-600" />
                <h2 className="font-bold text-base text-slate-900">Últimos Orçamentos</h2>
              </div>
              <button
                onClick={() => onNavigate('quotes')}
                className="text-xs font-semibold text-sky-600 hover:text-sky-800"
              >
                Ver todos
              </button>
            </div>

            <div className="space-y-3">
              {quotes.slice(0, 3).map((quote) => (
                <div
                  key={quote.id}
                  onClick={() => onOpenQuoteDetails(quote)}
                  className="p-3.5 rounded-xl border border-slate-100 hover:border-sky-300 bg-slate-50/50 hover:bg-sky-50/20 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-xs text-slate-900 line-clamp-1">{quote.clientName}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{quote.equipmentDescription}</p>
                    </div>
                    <span className="font-bold text-xs text-slate-900 whitespace-nowrap">
                      {formatCurrency(quote.total)}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className={`px-2 py-0.5 rounded-full font-medium ${
                      quote.status === 'Aprovado' || quote.status === 'Faturado'
                        ? 'bg-emerald-100 text-emerald-700'
                        : quote.status === 'Enviado'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      {quote.status}
                    </span>
                    <span className="text-slate-400 font-mono">#{quote.number}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alertas de Manutenção Preventiva / PMOC */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <h3 className="font-bold text-sm">Prevenção / Retornos a Agendar</h3>
            </div>
            <p className="text-xs text-amber-700 leading-relaxed">
              Equipamentos que atingiram a periodicidade recomendada de higienização ou revisão de carga de gás:
            </p>

            <div className="space-y-2">
              {maintenanceAlerts.slice(0, 3).map((eq) => (
                <div key={eq.id} className="bg-white/80 p-2.5 rounded-lg border border-amber-200/60 text-xs">
                  <p className="font-semibold text-slate-800 truncate">{eq.brand} {eq.capacity} - {eq.clientName}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                    <span>{eq.locationDescription}</span>
                    <span className="font-medium text-amber-700">Vencimento: {formatDateBR(eq.nextMaintenanceDate || '')}</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => onNavigate('maintenance')}
              className="w-full text-center text-xs font-semibold text-amber-800 hover:text-amber-900 pt-1 block"
            >
              Abrir Histórico Completo de Manutenção →
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
