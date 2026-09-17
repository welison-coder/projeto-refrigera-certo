import React, { useState } from 'react';
import {
  CalendarDays,
  Plus,
  Search,
  Phone,
  CheckCircle2,
  Clock,
  MapPin,
  User,
  Wrench,
  FileText,
  Trash2,
  Edit2,
  Bell,
  Smartphone,
  Navigation,
  Loader2,
  AlertCircle,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { TechnicalVisit, VisitStatus, Client, Equipment, CompanySettings } from '../types';
import { formatDateBR, createWhatsAppLink, generateVisitConfirmationMessage } from '../utils/formatters';
import { generateGoogleCalendarUrl, downloadICSFile } from '../utils/calendarReminder';
import { RouteButton } from './RouteButton';
import { getGoogleMapsRouteUrl, normalizeLocationUrl } from '../utils/navigation';
import { cleanCEP, formatCEP, fetchAddressByCEP } from '../utils/cep';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface VisitsViewProps {
  visits: TechnicalVisit[];
  clients: Client[];
  equipment: Equipment[];
  companySettings: CompanySettings;
  onSaveVisit: (visit: TechnicalVisit) => void;
  onDeleteVisit: (visitId: string) => void;
  onOpenCreateQuoteFromVisit: (visit: TechnicalVisit) => void;
  onOpenCreateMaintenanceFromVisit: (visit: TechnicalVisit) => void;
  onOpenReminderModal?: (visit: TechnicalVisit, autoTriggered?: boolean) => void;
}

export const VisitsView: React.FC<VisitsViewProps> = ({
  visits,
  clients,
  equipment,
  companySettings,
  onSaveVisit,
  onDeleteVisit,
  onOpenCreateQuoteFromVisit,
  onOpenCreateMaintenanceFromVisit,
  onOpenReminderModal
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('Todas');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingVisit, setEditingVisit] = useState<TechnicalVisit | null>(null);

  // Deletion confirmation modal state
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    title: string;
    itemName?: string;
    description?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    onConfirm: () => {}
  });

  // Form states
  const [formClientId, setFormClientId] = useState<string>('');
  const [formClientName, setFormClientName] = useState<string>('');
  const [formClientPhone, setFormClientPhone] = useState<string>('');
  const [formClientCep, setFormClientCep] = useState<string>('');
  const [formClientAddress, setFormClientAddress] = useState<string>('');
  const [formClientLocationUrl, setFormClientLocationUrl] = useState<string>('');
  const [formEquipmentIds, setFormEquipmentIds] = useState<string[]>([]);
  const [formDate, setFormDate] = useState<string>('2026-09-03');
  const [formTimeWindow, setFormTimeWindow] = useState<string>('08:30 - 10:30');
  const [formTechnicianName, setFormTechnicianName] = useState<string>(companySettings.technicianResponsible || 'Wellisson Medeiros');
  const [formServiceType, setFormServiceType] = useState<string>('Higienização e Limpeza Química');
  const [formReportedIssue, setFormReportedIssue] = useState<string>('');
  const [formStatus, setFormStatus] = useState<VisitStatus>('Agendada');
  const [formNotes, setFormNotes] = useState<string>('');
  const [formAutoSyncReminder, setFormAutoSyncReminder] = useState<boolean>(true);
  const [formReminderChannel, setFormReminderChannel] = useState<'google' | 'ics' | 'modal'>('google');
  const [formReminderMinutes, setFormReminderMinutes] = useState<number>(60);

  // CEP lookup states
  const [isSearchingCep, setIsSearchingCep] = useState<boolean>(false);
  const [cepStatus, setCepStatus] = useState<{
    type: 'idle' | 'loading' | 'success' | 'error';
    message?: string;
  }>({ type: 'idle' });

  const performVisitCepLookup = async (digitsToSearch?: string) => {
    const rawValue = digitsToSearch !== undefined ? digitsToSearch : formClientCep;
    const digits = cleanCEP(rawValue);
    if (digits.length !== 8) {
      setCepStatus({ type: 'error', message: 'Digite 8 dígitos para consultar o CEP.' });
      return;
    }

    setIsSearchingCep(true);
    setCepStatus({ type: 'loading', message: 'Buscando endereço pelo CEP...' });

    try {
      const res = await fetchAddressByCEP(digits);
      if (res && (res.street || res.neighborhood || res.city)) {
        const parts = [
          res.street,
          res.neighborhood ? `Bairro ${res.neighborhood}` : '',
          res.cityState
        ].filter(Boolean);
        const formattedAddress = parts.join(' - ');
        
        setFormClientAddress(formattedAddress ? `${formattedAddress}, CEP ${res.cep}` : formClientAddress);
        setCepStatus({
          type: 'success',
          message: `Endereço localizado: ${res.street || ''} (${res.neighborhood || ''})`
        });
      } else {
        setCepStatus({
          type: 'error',
          message: 'CEP não localizado. Digite o endereço manualmente.'
        });
      }
    } catch {
      setCepStatus({
        type: 'error',
        message: 'Não foi possível consultar o CEP agora.'
      });
    } finally {
      setIsSearchingCep(false);
    }
  };

  const handleVisitCepChange = (value: string) => {
    const formatted = formatCEP(value);
    setFormClientCep(formatted);
    const digits = cleanCEP(value);
    if (digits.length === 8) {
      performVisitCepLookup(digits);
    } else {
      setCepStatus({ type: 'idle' });
    }
  };

  const openNewVisitModal = () => {
    setEditingVisit(null);
    setCepStatus({ type: 'idle' });
    if (clients.length > 0) {
      const first = clients[0];
      setFormClientId(first.id);
      setFormClientName(first.name);
      setFormClientPhone(first.phone);
      setFormClientCep(first.address.zipCode || '');
      const addrWithCep = `${first.address.street}, ${first.address.number} - ${first.address.neighborhood}${first.address.city ? `, ${first.address.city}` : ''}${first.address.zipCode ? `, CEP ${first.address.zipCode}` : ''}`;
      setFormClientAddress(addrWithCep);
      setFormClientLocationUrl(first.address.locationUrl || first.locationUrl || '');
      const clientEquip = equipment.filter(e => e.clientId === first.id);
      setFormEquipmentIds(clientEquip.length > 0 ? [clientEquip[0].id] : []);
    } else {
      setFormClientId('');
      setFormClientName('');
      setFormClientPhone('');
      setFormClientCep('');
      setFormClientAddress('');
      setFormClientLocationUrl('');
      setFormEquipmentIds([]);
    }
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormTimeWindow('08:30 - 10:30');
    setFormTechnicianName(companySettings.technicianResponsible || 'Wellisson Medeiros');
    setFormServiceType('Higienização e Limpeza Química');
    setFormReportedIssue('');
    setFormStatus('Agendada');
    setFormNotes('');
    setIsModalOpen(true);
  };

  const openEditVisitModal = (visit: TechnicalVisit) => {
    setEditingVisit(visit);
    setCepStatus({ type: 'idle' });
    setFormClientId(visit.clientId);
    setFormClientName(visit.clientName);
    setFormClientPhone(visit.clientPhone);
    setFormClientCep(visit.clientCep || '');
    setFormClientAddress(visit.clientAddress);
    setFormClientLocationUrl(visit.clientLocationUrl || '');
    setFormEquipmentIds(visit.equipmentIds || []);
    setFormDate(visit.date);
    setFormTimeWindow(visit.timeWindow);
    setFormTechnicianName(visit.technicianName);
    setFormServiceType(visit.serviceType);
    setFormReportedIssue(visit.reportedIssue);
    setFormStatus(visit.status);
    setFormNotes(visit.notes || '');
    setIsModalOpen(true);
  };

  const handleClientSelectChange = (clientId: string) => {
    setFormClientId(clientId);
    const selected = clients.find(c => c.id === clientId);
    if (selected) {
      setFormClientName(selected.name);
      setFormClientPhone(selected.phone);
      setFormClientCep(selected.address.zipCode || '');
      const addrWithCep = `${selected.address.street}, ${selected.address.number} - ${selected.address.neighborhood}${selected.address.city ? `, ${selected.address.city}` : ''}${selected.address.zipCode ? `, CEP ${selected.address.zipCode}` : ''}`;
      setFormClientAddress(addrWithCep);
      setFormClientLocationUrl(selected.address.locationUrl || selected.locationUrl || '');
      const clientEquip = equipment.filter(e => e.clientId === selected.id);
      setFormEquipmentIds(clientEquip.length > 0 ? [clientEquip[0].id] : []);
    }
  };

  const handleSubmitVisit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formClientName || !formDate || !formTechnicianName) {
      alert('Por favor, preencha os campos obrigatórios (Cliente, Data e Técnico).');
      return;
    }

    const visitToSave: TechnicalVisit = {
      id: editingVisit ? editingVisit.id : `vis-${Date.now()}`,
      code: editingVisit ? editingVisit.code : `VIS-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      clientId: formClientId || `cli-${Date.now()}`,
      clientName: formClientName,
      clientPhone: formClientPhone,
      clientAddress: formClientAddress,
      clientCep: formClientCep.trim() || undefined,
      clientLocationUrl: formClientLocationUrl.trim() || undefined,
      equipmentIds: formEquipmentIds,
      date: formDate,
      timeWindow: formTimeWindow,
      technicianName: formTechnicianName,
      serviceType: formServiceType,
      reportedIssue: formReportedIssue,
      status: formStatus,
      notes: formNotes,
      completedAt: formStatus === 'Concluída' ? (editingVisit?.completedAt || new Date().toISOString().slice(0, 16).replace('T', ' ')) : undefined
    };

    onSaveVisit(visitToSave);
    setIsModalOpen(false);

    // Automatic reminder integration for mobile
    if (formAutoSyncReminder) {
      if (formReminderChannel === 'google') {
        window.open(generateGoogleCalendarUrl(visitToSave, companySettings.tradeName), '_blank', 'noopener,noreferrer');
      } else if (formReminderChannel === 'ics') {
        downloadICSFile(visitToSave, companySettings.tradeName, formReminderMinutes);
      }
      if (onOpenReminderModal) {
        onOpenReminderModal(visitToSave, true);
      }
    }
  };

  // Filter logic
  const filteredVisits = visits.filter(visit => {
    const matchesStatus = statusFilter === 'Todas' || visit.status === statusFilter;
    const matchesSearch =
      visit.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.clientAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.technicianName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.serviceType.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Agendamento de Visitas Técnicas</h1>
          <p className="text-slate-500 text-sm">
            Organize a rota e os horários dos técnicos de campo para atendimento presencial.
          </p>
        </div>

        <button
          id="btn-add-visit"
          onClick={openNewVisitModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Agendar Nova Visita</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por cliente, técnico, código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm bg-slate-50/50"
          />
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {['Todas', 'Agendada', 'A Caminho', 'Em Andamento', 'Concluída', 'Cancelada'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === status
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Visits List */}
      {filteredVisits.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
          <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-semibold text-base">Nenhuma visita técnica encontrada</p>
          <p className="text-slate-400 text-xs mt-1">Ajuste os filtros de busca ou agende uma nova visita.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredVisits.map((visit) => {
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
                className="bg-white rounded-xl border border-slate-200/90 shadow-xs hover:border-sky-400 transition-all p-5 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  
                  {/* Card Header: Code, Status & Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                        {visit.code}
                      </span>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                        visit.status === 'Concluída'
                          ? 'bg-emerald-100 text-emerald-800'
                          : visit.status === 'Em Andamento'
                          ? 'bg-blue-100 text-blue-800'
                          : visit.status === 'A Caminho'
                          ? 'bg-amber-100 text-amber-800'
                          : visit.status === 'Cancelada'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {visit.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditVisitModal(visit)}
                        className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Editar Visita"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteModalState({
                            isOpen: true,
                            title: 'Excluir Visita Técnica',
                            itemName: `${visit.code} - ${visit.clientName}`,
                            description: `Deseja realmente excluir a visita técnica ${visit.code} agendada para ${visit.clientName} em ${formatDateBR(visit.date)}?`,
                            onConfirm: () => onDeleteVisit(visit.id)
                          });
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Excluir Visita"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Client & Address with 1-click GPS route */}
                  <div>
                    <h3 className="font-bold text-base text-slate-900 leading-snug">{visit.clientName}</h3>
                    <div className="flex items-start gap-1.5 mt-1 text-xs text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                      <div className="flex flex-col">
                        <a
                          href={getGoogleMapsRouteUrl(visit.clientAddress, visit.clientCep)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline hover:text-sky-700 decoration-sky-400 transition-colors leading-relaxed"
                          title="Clique para abrir rota GPS para este endereço"
                        >
                          {visit.clientAddress}
                        </a>
                        {visit.clientCep && (
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-sky-50 border border-sky-200 text-sky-800 text-[10px] font-mono font-semibold">
                              CEP: {visit.clientCep}
                            </span>
                            <span className="text-[10px] text-emerald-600 font-medium">● Rota Otimizada</span>
                          </div>
                        )}

                        {visit.clientLocationUrl && (
                          <div className="mt-1 flex items-center gap-1.5">
                            <a
                              href={normalizeLocationUrl(visit.clientLocationUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[10px] font-semibold transition-colors shadow-2xs"
                              title="Abrir rota exata cadastrada do cliente"
                            >
                              <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>Link de Rota Cadastrado</span>
                              <ExternalLink className="w-2.5 h-2.5 text-emerald-600" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Service Details */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Serviço Solicitado:</span>
                      <span className="font-semibold text-slate-800">{visit.serviceType}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Data e Horário:</span>
                      <span className="font-semibold text-sky-800">
                        {formatDateBR(visit.date)} • {visit.timeWindow}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Técnico Escalado:</span>
                      <span className="font-semibold text-slate-700 flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        {visit.technicianName}
                      </span>
                    </div>
                  </div>

                  {/* Issue description */}
                  {visit.reportedIssue && (
                    <div className="text-xs text-slate-600 bg-amber-50/60 p-2.5 rounded-lg border border-amber-200/50">
                      <strong className="text-amber-900 font-semibold block mb-0.5">Sintoma / Problema:</strong>
                      {visit.reportedIssue}
                    </div>
                  )}

                  {visit.notes && (
                    <p className="text-xs text-slate-500 italic">
                      Obs: {visit.notes}
                    </p>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* 1-Click GPS Navigation Button with CEP and Location Link */}
                    <RouteButton
                      address={visit.clientAddress}
                      cep={visit.clientCep}
                      locationUrl={visit.clientLocationUrl}
                      size="sm"
                      variant="primary"
                    />

                    {/* WhatsApp confirmation button */}
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition-colors"
                      title="Enviar confirmação por WhatsApp já com link do calendário"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>

                    {/* Mobile Reminder button */}
                    <button
                      type="button"
                      onClick={() => onOpenReminderModal?.(visit, false)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-semibold border border-sky-200/80 transition-colors"
                      title="Sincronizar ou abrir lembrete no celular com alarme"
                    >
                      <Bell className="w-3.5 h-3.5 text-sky-600" />
                      <span>Lembrete Celular</span>
                    </button>
                  </div>

                  {/* Flow actions: Quote or Maintenance */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onOpenCreateQuoteFromVisit(visit)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-sky-400 text-slate-700 hover:text-sky-700 text-xs font-medium bg-white transition-colors"
                      title="Emitir orçamento para esta visita"
                    >
                      <FileText className="w-3.5 h-3.5 text-sky-600" />
                      <span>Orçamento</span>
                    </button>

                    <button
                      onClick={() => onOpenCreateMaintenanceFromVisit(visit)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-emerald-400 text-slate-700 hover:text-emerald-700 text-xs font-medium bg-white transition-colors"
                      title="Registrar manutenção técnica realizada"
                    >
                      <Wrench className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Laudo / OS</span>
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Modal: New / Edit Visit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">
                {editingVisit ? 'Editar Visita Técnica' : 'Agendar Nova Visita Técnica'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitVisit} className="mt-4 space-y-4">
              
              {/* Select Client or Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cliente Cadastrado
                </label>
                <select
                  value={formClientId}
                  onChange={(e) => handleClientSelectChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 bg-white"
                >
                  <option value="">-- Selecione ou digite abaixo --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.address.neighborhood})
                    </option>
                  ))}
                </select>
              </div>

              {/* Client Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome do Cliente *
                  </label>
                  <input
                    type="text"
                    required
                    value={formClientName}
                    onChange={(e) => setFormClientName(e.target.value)}
                    placeholder="Ex: Padaria Pão Dourado"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Telefone / WhatsApp *
                  </label>
                  <input
                    type="text"
                    required
                    value={formClientPhone}
                    onChange={(e) => setFormClientPhone(e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Address block with CEP search & auto-completion */}
              <div className="p-3 bg-slate-50/90 rounded-xl border border-slate-200/90 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-sky-600" />
                    Localização da Visita Técnica
                  </label>
                  {formClientAddress.trim() && (
                    <a
                      href={getGoogleMapsRouteUrl(formClientAddress, formClientCep)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
                      title="Testar rota no aplicativo de navegação"
                    >
                      <Navigation className="w-3 h-3" /> Testar Rota GPS
                    </a>
                  )}
                </div>

                {/* CEP Input + Search Button */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    CEP (digite os 8 dígitos para preencher o endereço automaticamente)
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={formClientCep}
                        onChange={(e) => handleVisitCepChange(e.target.value)}
                        placeholder="Ex: 01451-001"
                        maxLength={9}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-sky-500 bg-white"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={isSearchingCep}
                      onClick={() => performVisitCepLookup()}
                      className="px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:bg-slate-300 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                      title="Buscar endereço pelo CEP"
                    >
                      {isSearchingCep ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Buscando...</span>
                        </>
                      ) : (
                        <>
                          <Search className="w-3.5 h-3.5" />
                          <span>Buscar CEP</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Feedback message */}
                  {cepStatus.message && (
                    <div className={`mt-1.5 flex items-center gap-1.5 text-xs ${
                      cepStatus.type === 'success'
                        ? 'text-emerald-700 font-medium'
                        : cepStatus.type === 'error'
                        ? 'text-rose-600'
                        : 'text-sky-700'
                    }`}>
                      {cepStatus.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                      {cepStatus.type === 'error' && <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
                      {cepStatus.type === 'loading' && <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600 shrink-0" />}
                      <span>{cepStatus.message}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Endereço Completo do Atendimento *
                  </label>
                  <input
                    type="text"
                    required
                    value={formClientAddress}
                    onChange={(e) => setFormClientAddress(e.target.value)}
                    placeholder="Rua, número, bairro, cidade"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 bg-white"
                  />
                </div>

                {/* Location Link Input / Generator in Visit Modal */}
                <div className="pt-2 border-t border-slate-200/80">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                      Link de Localização / Rota do Cliente (Google Maps / Waze)
                    </label>
                    {formClientLocationUrl.trim() && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full">
                        Ativo
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mb-1 leading-snug">
                    Link de rota direto do cliente (ex: compartilhado via WhatsApp). O botão de rota abrirá este destino diretamente.
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={formClientLocationUrl}
                      onChange={(e) => setFormClientLocationUrl(e.target.value)}
                      placeholder="Ex: https://maps.app.goo.gl/... ou https://waze.com/ul?..."
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 bg-white"
                    />
                    {formClientLocationUrl.trim() && (
                      <a
                        href={normalizeLocationUrl(formClientLocationUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 shrink-0 transition-colors shadow-2xs"
                        title="Testar link de localização"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Testar</span>
                      </a>
                    )}
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (!formClientAddress.trim()) {
                          alert('Preencha o endereço completo primeiro para gerar a rota.');
                          return;
                        }
                        const generatedUrl = getGoogleMapsRouteUrl(formClientAddress, formClientCep);
                        setFormClientLocationUrl(generatedUrl);
                      }}
                      className="text-[11px] font-semibold text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-2 py-0.5 rounded transition-colors flex items-center gap-1"
                      title="Gerar rota do Google Maps com base no endereço digitado"
                    >
                      <Sparkles className="w-3 h-3 text-sky-600" />
                      <span>Gerar Link Google Maps pelo Endereço</span>
                    </button>
                    {formClientLocationUrl && (
                      <button
                        type="button"
                        onClick={() => setFormClientLocationUrl('')}
                        className="text-[11px] text-slate-500 hover:text-rose-600 underline"
                      >
                        Limpar link
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Date & Time Window */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data do Atendimento *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Janela de Horário
                  </label>
                  <select
                    value={formTimeWindow}
                    onChange={(e) => setFormTimeWindow(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value="08:00 - 10:00">Manhã (08:00 - 10:00)</option>
                    <option value="10:00 - 12:00">Manhã (10:00 - 12:00)</option>
                    <option value="13:30 - 15:30">Tarde (13:30 - 15:30)</option>
                    <option value="15:30 - 17:30">Tarde (15:30 - 17:30)</option>
                    <option value="Horário Comercial">Horário Comercial Flexível</option>
                    <option value="Plantão Emergencial 24h">Plantão Emergencial 24h</option>
                  </select>
                </div>
              </div>

              {/* Service Type & Technician */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tipo de Serviço
                  </label>
                  <select
                    value={formServiceType}
                    onChange={(e) => setFormServiceType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value="Higienização e Limpeza Química">Higienização e Limpeza Química</option>
                    <option value="Manutenção Preventiva / PMOC">Manutenção Preventiva / PMOC</option>
                    <option value="Manutenção Corretiva / Reparo">Manutenção Corretiva / Reparo</option>
                    <option value="Carga de Gás / Detecção de Vazamento">Carga de Gás / Detecção de Vazamento</option>
                    <option value="Diagnóstico Técnico / Avaliação">Diagnóstico Técnico / Avaliação</option>
                    <option value="Instalação de Equipamento">Instalação de Equipamento</option>
                    <option value="Desinstalação / Remanejamento">Desinstalação / Remanejamento</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Técnico Responsável *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTechnicianName}
                    onChange={(e) => setFormTechnicianName(e.target.value)}
                    placeholder="Nome do técnico de campo"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status da Visita
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as VisitStatus)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 bg-white"
                >
                  <option value="Agendada">Agendada</option>
                  <option value="A Caminho">A Caminho</option>
                  <option value="Em Andamento">Em Andamento</option>
                  <option value="Concluída">Concluída</option>
                  <option value="Cancelada">Cancelada</option>
                </select>
              </div>

              {/* Reported Issue */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Problema Relatado / Queixa do Cliente
                </label>
                <textarea
                  rows={2}
                  value={formReportedIssue}
                  onChange={(e) => setFormReportedIssue(e.target.value)}
                  placeholder="Ex: Não está gelando, ventilador parou, pingando água na parede..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Internal Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observações Internas para a Equipe
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Ex: Trazer escada de 7 degraus, ligar para portaria antes..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Celular / Lembrete Automático Integration */}
              <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-200/90 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formAutoSyncReminder}
                      onChange={(e) => setFormAutoSyncReminder(e.target.checked)}
                      className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300"
                    />
                    <span className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-sky-600" />
                      Integrar Lembrete no Celular Automaticamente
                    </span>
                  </label>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-700 bg-sky-100 px-2 py-0.5 rounded">
                    Alarme & Agenda
                  </span>
                </div>

                {formAutoSyncReminder && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Destino do Lembrete:
                      </label>
                      <select
                        value={formReminderChannel}
                        onChange={(e) => setFormReminderChannel(e.target.value as 'google' | 'ics' | 'modal')}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-sky-500"
                      >
                        <option value="google">Google Agenda (Android / Celular)</option>
                        <option value="ics">Apple / Calendário do iPhone (.ics)</option>
                        <option value="modal">Painel Completo com WhatsApp</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Disparo do Alarme Sonoro:
                      </label>
                      <select
                        value={formReminderMinutes}
                        onChange={(e) => setFormReminderMinutes(parseInt(e.target.value, 10))}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-sky-500"
                      >
                        <option value={15}>15 minutos antes</option>
                        <option value={30}>30 minutos antes</option>
                        <option value={60}>1 hora antes (Recomendado)</option>
                        <option value={120}>2 horas antes</option>
                        <option value={1440}>1 dia antes</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm shadow-sm transition-all"
                >
                  {editingVisit ? 'Salvar Alterações' : 'Confirmar Agendamento'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Visit Deletion */}
      <ConfirmDeleteModal
        isOpen={deleteModalState.isOpen}
        title={deleteModalState.title}
        itemName={deleteModalState.itemName}
        description={deleteModalState.description}
        onConfirm={deleteModalState.onConfirm}
        onClose={() => setDeleteModalState(prev => ({ ...prev, isOpen: false }))}
      />

    </div>
  );
};
