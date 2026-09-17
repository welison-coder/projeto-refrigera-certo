import React, { useState, useRef } from 'react';
import {
  Users,
  Wrench,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Trash2,
  Edit2,
  CalendarDays,
  FileText,
  Clock,
  Navigation,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Camera,
  Tag,
  ZoomIn,
  Download,
  Image as ImageIcon,
  Zap,
  ShieldCheck,
  Wind
} from 'lucide-react';
import { Client, Equipment, EquipmentStatus } from '../types';
import { formatDateBR } from '../utils/formatters';
import { RouteButton } from './RouteButton';
import { getGoogleMapsRouteUrl, normalizeLocationUrl } from '../utils/navigation';
import { cleanCEP, formatCEP, fetchAddressByCEP } from '../utils/cep';
import { EquipmentPhotoLightbox, PhotoType } from './EquipmentPhotoLightbox';
import { EquipmentPhotoUploader } from './EquipmentPhotoUploader';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface ClientsEquipmentViewProps {
  clients: Client[];
  equipment: Equipment[];
  onSaveClient: (client: Client) => void;
  onDeleteClient: (clientId: string) => void;
  onSaveEquipment: (equipment: Equipment) => void;
  onDeleteEquipment: (equipmentId: string) => void;
  onScheduleVisitForClient: (client: Client, equipmentId?: string) => void;
  onNewQuoteForClient: (client: Client) => void;
  onViewEquipmentHistory: (equipmentId: string) => void;
  initialTab?: 'clients' | 'equipment';
}

export const ClientsEquipmentView: React.FC<ClientsEquipmentViewProps> = ({
  clients,
  equipment,
  onSaveClient,
  onDeleteClient,
  onSaveEquipment,
  onDeleteEquipment,
  onScheduleVisitForClient,
  onNewQuoteForClient,
  onViewEquipmentHistory,
  initialTab = 'clients'
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'clients' | 'equipment'>(initialTab);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Client modal
  const [isClientModalOpen, setIsClientModalOpen] = useState<boolean>(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientFormName, setClientFormName] = useState<string>('');
  const [clientFormDoc, setClientFormDoc] = useState<string>('');
  const [clientFormPhone, setClientFormPhone] = useState<string>('');
  const [clientFormEmail, setClientFormEmail] = useState<string>('');
  const [clientFormZipCode, setClientFormZipCode] = useState<string>('');
  const [clientFormStreet, setClientFormStreet] = useState<string>('');
  const [clientFormNumber, setClientFormNumber] = useState<string>('');
  const [clientFormNeighborhood, setClientFormNeighborhood] = useState<string>('');
  const [clientFormCity, setClientFormCity] = useState<string>('São Paulo - SP');
  const [clientFormLocationUrl, setClientFormLocationUrl] = useState<string>('');
  const [clientFormNotes, setClientFormNotes] = useState<string>('');
  
  // CEP lookup state
  const [isSearchingCep, setIsSearchingCep] = useState<boolean>(false);
  const [cepStatus, setCepStatus] = useState<{
    type: 'idle' | 'loading' | 'success' | 'error';
    message?: string;
  }>({ type: 'idle' });
  const numberInputRef = useRef<HTMLInputElement>(null);

  // Equipment modal
  const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState<boolean>(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [equipFormClientId, setEquipFormClientId] = useState<string>('');
  const [equipFormType, setEquipFormType] = useState<string>('Split Inverter');
  const [equipFormBrand, setEquipFormBrand] = useState<string>('Daikin');
  const [equipFormModel, setEquipFormModel] = useState<string>('');
  const [equipFormCapacity, setEquipFormCapacity] = useState<string>('12.000 BTU');
  const [equipFormGasType, setEquipFormGasType] = useState<string>('R-410A');
  const [equipFormSerial, setEquipFormSerial] = useState<string>('');
  const [equipFormNominalCurrent, setEquipFormNominalCurrent] = useState<string>('');
  const [equipFormVoltage, setEquipFormVoltage] = useState<string>('220V 1F 60Hz');
  const [equipFormLocation, setEquipFormLocation] = useState<string>('');
  const [equipFormStatus, setEquipFormStatus] = useState<EquipmentStatus>('Operando Normal');
  const [equipFormNextDate, setEquipFormNextDate] = useState<string>('');
  const [equipFormLabelPhotoUrl, setEquipFormLabelPhotoUrl] = useState<string | undefined>(undefined);
  const [equipFormLabelPhotoDate, setEquipFormLabelPhotoDate] = useState<string | undefined>(undefined);
  const [equipFormInstallPhotoUrl, setEquipFormInstallPhotoUrl] = useState<string | undefined>(undefined);
  const [equipFormInstallPhotoDate, setEquipFormInstallPhotoDate] = useState<string | undefined>(undefined);
  const [equipFormCondenserPhotoUrl, setEquipFormCondenserPhotoUrl] = useState<string | undefined>(undefined);
  const [equipFormCondenserPhotoDate, setEquipFormCondenserPhotoDate] = useState<string | undefined>(undefined);

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

  // Fullscreen Lightbox viewer state
  const [lightboxEquipment, setLightboxEquipment] = useState<Equipment | null>(null);
  const [lightboxPhotoType, setLightboxPhotoType] = useState<PhotoType>('label');
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);

  const openLightbox = (eq: Equipment, type: PhotoType = 'label') => {
    setLightboxEquipment(eq);
    setLightboxPhotoType(type);
    setIsLightboxOpen(true);
  };

  const openNewClientModal = () => {
    setEditingClient(null);
    setClientFormName('');
    setClientFormDoc('');
    setClientFormPhone('');
    setClientFormEmail('');
    setClientFormZipCode('');
    setClientFormStreet('');
    setClientFormNumber('');
    setClientFormNeighborhood('');
    setClientFormCity('São Paulo - SP');
    setClientFormLocationUrl('');
    setClientFormNotes('');
    setCepStatus({ type: 'idle' });
    setIsClientModalOpen(true);
  };

  const openEditClientModal = (c: Client) => {
    setEditingClient(c);
    setClientFormName(c.name);
    setClientFormDoc(c.document);
    setClientFormPhone(c.phone);
    setClientFormEmail(c.email);
    setClientFormZipCode(c.address.zipCode || '');
    setClientFormStreet(c.address.street);
    setClientFormNumber(c.address.number);
    setClientFormNeighborhood(c.address.neighborhood);
    setClientFormCity(c.address.city);
    setClientFormLocationUrl(c.address.locationUrl || c.locationUrl || '');
    setClientFormNotes(c.notes || '');
    setCepStatus({ type: 'idle' });
    setIsClientModalOpen(true);
  };

  const performCepLookup = async (digitsToSearch?: string) => {
    const rawValue = digitsToSearch !== undefined ? digitsToSearch : clientFormZipCode;
    const digits = cleanCEP(rawValue);
    if (digits.length !== 8) {
      setCepStatus({ type: 'error', message: 'Digite os 8 números do CEP para buscar o endereço.' });
      return;
    }

    setIsSearchingCep(true);
    setCepStatus({ type: 'loading', message: 'Localizando endereço pelo CEP...' });

    try {
      const result = await fetchAddressByCEP(digits);
      if (result && (result.street || result.neighborhood || result.city)) {
        if (result.street) setClientFormStreet(result.street);
        if (result.neighborhood) setClientFormNeighborhood(result.neighborhood);
        if (result.cityState) setClientFormCity(result.cityState);
        setCepStatus({
          type: 'success',
          message: `Endereço encontrado: ${result.street || ''} (${result.neighborhood || ''})`
        });
        // Automatically focus the number input so technician or manager just enters the number
        setTimeout(() => {
          numberInputRef.current?.focus();
        }, 120);
      } else {
        setCepStatus({
          type: 'error',
          message: 'CEP não encontrado na base de dados. Preencha o endereço manualmente.'
        });
      }
    } catch {
      setCepStatus({
        type: 'error',
        message: 'Falha na busca online do CEP. Preencha o endereço manualmente.'
      });
    } finally {
      setIsSearchingCep(false);
    }
  };

  const handleCepInputChange = (value: string) => {
    const formatted = formatCEP(value);
    setClientFormZipCode(formatted);
    const digits = cleanCEP(value);

    // When the user completes 8 digits, automatically trigger address search!
    if (digits.length === 8) {
      performCepLookup(digits);
    } else {
      setCepStatus({ type: 'idle' });
    }
  };

  const handleSaveClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientFormName || !clientFormPhone) {
      alert('Nome e Telefone são campos obrigatórios.');
      return;
    }
    const clientToSave: Client = {
      id: editingClient ? editingClient.id : `cli-${Date.now()}`,
      name: clientFormName,
      document: clientFormDoc,
      phone: clientFormPhone,
      email: clientFormEmail,
      address: {
        street: clientFormStreet,
        number: clientFormNumber,
        neighborhood: clientFormNeighborhood,
        city: clientFormCity,
        zipCode: clientFormZipCode.trim() || undefined,
        locationUrl: clientFormLocationUrl.trim() || undefined
      },
      locationUrl: clientFormLocationUrl.trim() || undefined,
      notes: clientFormNotes,
      createdAt: editingClient ? editingClient.createdAt : new Date().toISOString().slice(0, 10)
    };
    onSaveClient(clientToSave);
    setIsClientModalOpen(false);
  };

  const openNewEquipmentModal = (preselectedClientId?: string) => {
    setEditingEquipment(null);
    setEquipFormClientId(preselectedClientId || (clients[0]?.id || ''));
    setEquipFormType('Split Inverter');
    setEquipFormBrand('Daikin');
    setEquipFormModel('');
    setEquipFormCapacity('12.000 BTU');
    setEquipFormGasType('R-410A');
    setEquipFormSerial('');
    setEquipFormNominalCurrent('');
    setEquipFormVoltage('220V 1F 60Hz');
    setEquipFormLocation('Sala Principal');
    setEquipFormStatus('Operando Normal');
    setEquipFormLabelPhotoUrl(undefined);
    setEquipFormLabelPhotoDate(undefined);
    setEquipFormInstallPhotoUrl(undefined);
    setEquipFormInstallPhotoDate(undefined);
    setEquipFormCondenserPhotoUrl(undefined);
    setEquipFormCondenserPhotoDate(undefined);
    
    const d = new Date();
    d.setDate(d.getDate() + 90);
    setEquipFormNextDate(d.toISOString().slice(0, 10));

    setIsEquipmentModalOpen(true);
  };

  const openEditEquipmentModal = (eq: Equipment) => {
    setEditingEquipment(eq);
    setEquipFormClientId(eq.clientId);
    setEquipFormType(eq.type);
    setEquipFormBrand(eq.brand);
    setEquipFormModel(eq.model);
    setEquipFormCapacity(eq.capacity);
    setEquipFormGasType(eq.gasType);
    setEquipFormSerial(eq.serialNumber || '');
    setEquipFormNominalCurrent(eq.nominalCurrent || '');
    setEquipFormVoltage(eq.voltage || '220V 1F 60Hz');
    setEquipFormLocation(eq.locationDescription);
    setEquipFormStatus(eq.status);
    setEquipFormNextDate(eq.nextMaintenanceDate || '');
    setEquipFormLabelPhotoUrl(eq.labelPhotoUrl);
    setEquipFormLabelPhotoDate(eq.labelPhotoDate);
    setEquipFormInstallPhotoUrl(eq.installationPhotoUrl);
    setEquipFormInstallPhotoDate(eq.installationPhotoDate);
    setEquipFormCondenserPhotoUrl(eq.condenserPhotoUrl);
    setEquipFormCondenserPhotoDate(eq.condenserPhotoDate);
    setIsEquipmentModalOpen(true);
  };

  const handleSaveEquipmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find(c => c.id === equipFormClientId);
    if (!client) {
      alert('Selecione o cliente responsável pelo equipamento.');
      return;
    }

    const equipToSave: Equipment = {
      id: editingEquipment ? editingEquipment.id : `eq-${Date.now()}`,
      clientId: client.id,
      clientName: client.name,
      type: equipFormType,
      brand: equipFormBrand,
      model: equipFormModel,
      capacity: equipFormCapacity,
      gasType: equipFormGasType,
      serialNumber: equipFormSerial.trim() || undefined,
      nominalCurrent: equipFormNominalCurrent.trim() || undefined,
      voltage: equipFormVoltage.trim() || undefined,
      locationDescription: equipFormLocation,
      status: equipFormStatus,
      nextMaintenanceDate: equipFormNextDate || undefined,
      lastMaintenanceDate: editingEquipment?.lastMaintenanceDate,
      labelPhotoUrl: equipFormLabelPhotoUrl,
      labelPhotoDate: equipFormLabelPhotoDate,
      installationPhotoUrl: equipFormInstallPhotoUrl,
      installationPhotoDate: equipFormInstallPhotoDate,
      condenserPhotoUrl: equipFormCondenserPhotoUrl,
      condenserPhotoDate: equipFormCondenserPhotoDate
    };

    onSaveEquipment(equipToSave);
    setIsEquipmentModalOpen(false);
  };

  // Filter clients
  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) ||
    c.address.neighborhood.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.document.includes(searchTerm)
  );

  // Filter equipment
  const filteredEquipment = equipment.filter(eq =>
    eq.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    eq.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    eq.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    eq.locationDescription.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clientes & Parque de Equipamentos</h1>
          <p className="text-slate-500 text-sm">
            Cadastro detalhado dos clientes e máquinas atendidas para rastreabilidade e contratos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-add-client"
            onClick={openNewClientModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Cliente</span>
          </button>

          <button
            id="btn-add-machine"
            onClick={() => openNewEquipmentModal()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-200 border border-slate-700 font-semibold text-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Máquina</span>
          </button>
        </div>
      </div>

      {/* Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('clients')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'clients'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Clientes ({clients.length})
          </button>
          <button
            onClick={() => setActiveTab('equipment')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'equipment'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Equipamentos ({equipment.length})
          </button>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={activeTab === 'clients' ? "Buscar cliente por nome, tel, bairro..." : "Buscar máquina por marca, cliente, tipo..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm bg-slate-50/50"
          />
        </div>
      </div>

      {/* Tab 1: Clients List */}
      {activeTab === 'clients' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredClients.map((client) => {
            const clientEquipments = equipment.filter(e => e.clientId === client.id);

            const fullAddress = `${client.address.street}, ${client.address.number} - ${client.address.neighborhood}${client.address.city ? `, ${client.address.city}` : ''}${client.address.zipCode ? `, CEP ${client.address.zipCode}` : ''}`;

            return (
              <div
                key={client.id}
                className="bg-white rounded-xl border border-slate-200/90 shadow-xs hover:border-sky-300 transition-all p-5 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-base text-slate-900 leading-snug">{client.name}</h3>
                      {client.document && (
                        <span className="text-[11px] font-mono text-slate-500">Doc: {client.document}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditClientModal(client)}
                        className="p-1.5 text-slate-400 hover:text-sky-600 rounded-lg"
                        title="Editar Cliente"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteModalState({
                            isOpen: true,
                            title: 'Excluir Cliente',
                            itemName: client.name,
                            description: `Tem certeza que deseja excluir o cliente "${client.name}"? Todos os aparelhos associados a ele também serão excluídos do sistema.`,
                            onConfirm: () => onDeleteClient(client.id)
                          });
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                        title="Excluir Cliente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600">
                    <p className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <span>{client.phone}</span>
                    </p>
                    {client.email && (
                      <p className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{client.email}</span>
                      </p>
                    )}
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                      <div className="flex flex-col">
                        <a
                          href={getGoogleMapsRouteUrl(fullAddress, client.address.zipCode)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline hover:text-sky-700 decoration-sky-400 transition-colors leading-relaxed"
                          title="Clique para abrir rota GPS para este endereço"
                        >
                          {client.address.street}, {client.address.number} - {client.address.neighborhood}
                          {client.address.city && <span className="text-slate-500">, {client.address.city}</span>}
                        </a>
                        {client.address.zipCode && (
                          <div className="mt-1 flex items-center gap-1.5">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-sky-50 border border-sky-200 text-sky-800 text-[10px] font-mono font-semibold">
                              CEP: {client.address.zipCode}
                            </span>
                            <span className="text-[10px] text-emerald-600 font-medium">● GPS Otimizado</span>
                          </div>
                        )}

                        {/* Location Link Badge if saved */}
                        {(client.address.locationUrl || client.locationUrl) && (
                          <div className="mt-1.5 flex items-center gap-2">
                            <a
                              href={normalizeLocationUrl(client.address.locationUrl || client.locationUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[11px] font-semibold transition-colors shadow-2xs"
                              title="Abrir link de rota/localização exata cadastrada do cliente"
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

                  {/* Registered Equipment for this client */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-slate-700">
                        {clientEquipments.length} Máquina(s) Instalada(s):
                      </span>
                      <button
                        onClick={() => openNewEquipmentModal(client.id)}
                        className="text-[11px] font-semibold text-sky-600 hover:text-sky-700"
                      >
                        + Adicionar Máquina
                      </button>
                    </div>

                    {clientEquipments.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic">Nenhum equipamento registrado.</p>
                    ) : (
                      <div className="space-y-1">
                        {clientEquipments.map(eq => (
                          <div key={eq.id} className="flex items-center justify-between text-[11px] bg-white p-1.5 rounded border border-slate-200 gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="truncate">{eq.brand} {eq.capacity} ({eq.locationDescription})</span>
                              {(eq.labelPhotoUrl || eq.installationPhotoUrl) && (
                                <button
                                  type="button"
                                  onClick={() => openLightbox(eq, eq.labelPhotoUrl ? 'label' : 'installation')}
                                  className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-sky-50 text-sky-700 hover:bg-sky-100 font-semibold text-[9px] shrink-0 border border-sky-200 transition-colors"
                                  title="Ver fotos deste equipamento no Lightbox"
                                >
                                  <Camera className="w-2.5 h-2.5 text-sky-600" />
                                  <span>Fotos</span>
                                </button>
                              )}
                            </div>
                            <span className="text-slate-400 font-mono text-[10px] shrink-0">{eq.gasType}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {client.notes && (
                    <p className="text-xs text-slate-500 italic bg-amber-50/50 p-2 rounded border border-amber-100">
                      Obs: {client.notes}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* 1-Click Route button with CEP and optional custom Location Link */}
                    <RouteButton
                      address={fullAddress}
                      cep={client.address.zipCode}
                      locationUrl={client.address.locationUrl || client.locationUrl}
                      size="sm"
                      variant="primary"
                    />

                    <button
                      onClick={() => onScheduleVisitForClient(client)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-semibold transition-colors"
                      title="Agendar visita técnica para este cliente"
                    >
                      <CalendarDays className="w-3.5 h-3.5" />
                      <span>Agendar</span>
                    </button>
                  </div>

                  <button
                    onClick={() => onNewQuoteForClient(client)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Orçamento</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Equipment List */}
      {activeTab === 'equipment' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEquipment.map((eq) => (
            <div
              key={eq.id}
              className="bg-white rounded-xl border border-slate-200/90 shadow-xs hover:border-sky-300 transition-all p-5 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-2 py-0.5 rounded">
                      {eq.type}
                    </span>
                    <h3 className="font-bold text-base text-slate-900 mt-1">{eq.brand} - {eq.capacity}</h3>
                    <p className="text-xs text-slate-500 font-medium">{eq.clientName}</p>
                  </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditEquipmentModal(eq)}
                        className="p-1.5 text-slate-400 hover:text-sky-600 rounded"
                        title="Editar Equipamento"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteModalState({
                            isOpen: true,
                            title: 'Excluir Aparelho',
                            itemName: `${eq.brand} ${eq.capacity} (${eq.locationDescription})`,
                            description: `Tem certeza que deseja excluir este equipamento (${eq.brand} ${eq.capacity}) vinculado ao cliente ${eq.clientName}?`,
                            onConfirm: () => onDeleteEquipment(eq.id)
                          });
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors"
                        title="Excluir Equipamento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Localização:</span>
                    <span className="font-semibold text-slate-800">{eq.locationDescription}</span>
                  </div>
                  {eq.model && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Modelo:</span>
                      <span className="font-mono text-slate-700">{eq.model}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-400">Gás Refrigerante:</span>
                    <span className="font-mono font-bold text-sky-700">{eq.gasType}</span>
                  </div>
                  {eq.nominalCurrent && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Corrente (A):</span>
                      <span className="font-mono font-bold text-amber-700">{eq.nominalCurrent}</span>
                    </div>
                  )}
                  {eq.voltage && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tensão / Fase:</span>
                      <span className="font-mono text-slate-700">{eq.voltage}</span>
                    </div>
                  )}
                  {eq.serialNumber && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Nº de Série:</span>
                      <span className="font-mono text-slate-700">{eq.serialNumber}</span>
                    </div>
                  )}
                  {eq.nextMaintenanceDate && (
                    <div className="flex justify-between pt-1 border-t border-slate-200/60 text-amber-800">
                      <span>Próxima Preventiva:</span>
                      <span className="font-bold">{formatDateBR(eq.nextMaintenanceDate)}</span>
                    </div>
                  )}
                </div>

                {/* ========================================================= */}
                {/* Miniaturas Diretas nos Cartões (3 Opções de Foto)         */}
                {/* ========================================================= */}
                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5 text-sky-600" />
                      Registro Fotográfico (3 Fotos)
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">
                      {[eq.labelPhotoUrl, eq.installationPhotoUrl, eq.condenserPhotoUrl].filter(Boolean).length === 3
                        ? '3 fotos (completas)'
                        : `${[eq.labelPhotoUrl, eq.installationPhotoUrl, eq.condenserPhotoUrl].filter(Boolean).length} de 3 fotos`}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {/* 1. Miniatura Etiqueta Técnica */}
                    {eq.labelPhotoUrl ? (
                      <button
                        type="button"
                        onClick={() => openLightbox(eq, 'label')}
                        className="group relative flex flex-col rounded-lg border border-slate-200 overflow-hidden bg-slate-950 text-left hover:border-sky-500 hover:shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                        title="Inspecionar foto da Etiqueta Técnica em Tela Cheia (Lightbox)"
                      >
                        <div className="h-16 w-full overflow-hidden bg-slate-900 flex items-center justify-center relative">
                          <img
                            src={eq.labelPhotoUrl}
                            alt="Etiqueta Técnica"
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60 group-hover:opacity-30 transition-opacity" />
                          <div className="absolute top-0.5 right-0.5 p-0.5 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            <ZoomIn className="w-2.5 h-2.5 text-sky-300" />
                          </div>
                          <span className="absolute bottom-0.5 left-0.5 text-[8px] font-bold text-white bg-sky-600/90 px-1 py-0.2 rounded shadow-xs">
                            Etiqueta
                          </span>
                        </div>
                        <div className="px-1 py-0.5 bg-white border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[9px] font-semibold text-slate-700 truncate">Placa</span>
                          <span className="text-[8px] text-sky-600 font-bold group-hover:underline">
                            Ver
                          </span>
                        </div>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openEditEquipmentModal(eq)}
                        className="flex flex-col items-center justify-center h-[90px] rounded-lg border border-dashed border-slate-200 hover:border-sky-400 bg-slate-50/70 hover:bg-sky-50/40 text-slate-400 hover:text-sky-700 transition-all p-1 text-center group"
                        title="Adicionar foto da etiqueta técnica"
                      >
                        <Tag className="w-3.5 h-3.5 mb-0.5 text-slate-400 group-hover:text-sky-600 transition-colors" />
                        <span className="text-[9px] font-semibold leading-tight">+ Etiqueta</span>
                        <span className="text-[8px] text-slate-400">Placa</span>
                      </button>
                    )}

                    {/* 2. Miniatura Instalação / Evaporadora */}
                    {eq.installationPhotoUrl ? (
                      <button
                        type="button"
                        onClick={() => openLightbox(eq, 'installation')}
                        className="group relative flex flex-col rounded-lg border border-slate-200 overflow-hidden bg-slate-950 text-left hover:border-sky-500 hover:shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                        title="Inspecionar foto da Unidade Interna em Tela Cheia (Lightbox)"
                      >
                        <div className="h-16 w-full overflow-hidden bg-slate-900 flex items-center justify-center relative">
                          <img
                            src={eq.installationPhotoUrl}
                            alt="Instalação Interna"
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60 group-hover:opacity-30 transition-opacity" />
                          <div className="absolute top-0.5 right-0.5 p-0.5 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            <ZoomIn className="w-2.5 h-2.5 text-sky-300" />
                          </div>
                          <span className="absolute bottom-0.5 left-0.5 text-[8px] font-bold text-white bg-emerald-600/90 px-1 py-0.2 rounded shadow-xs">
                            Interna
                          </span>
                        </div>
                        <div className="px-1 py-0.5 bg-white border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[9px] font-semibold text-slate-700 truncate">Evap</span>
                          <span className="text-[8px] text-emerald-600 font-bold group-hover:underline">
                            Ver
                          </span>
                        </div>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openEditEquipmentModal(eq)}
                        className="flex flex-col items-center justify-center h-[90px] rounded-lg border border-dashed border-slate-200 hover:border-sky-400 bg-slate-50/70 hover:bg-sky-50/40 text-slate-400 hover:text-sky-700 transition-all p-1 text-center group"
                        title="Adicionar foto da unidade interna"
                      >
                        <Wind className="w-3.5 h-3.5 mb-0.5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                        <span className="text-[9px] font-semibold leading-tight">+ Interna</span>
                        <span className="text-[8px] text-slate-400">Evaporadora</span>
                      </button>
                    )}

                    {/* 3. Miniatura Condensadora / Unidade Externa */}
                    {eq.condenserPhotoUrl ? (
                      <button
                        type="button"
                        onClick={() => openLightbox(eq, 'condenser')}
                        className="group relative flex flex-col rounded-lg border border-slate-200 overflow-hidden bg-slate-950 text-left hover:border-sky-500 hover:shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                        title="Inspecionar foto da Unidade Externa / Condensadora em Tela Cheia (Lightbox)"
                      >
                        <div className="h-16 w-full overflow-hidden bg-slate-900 flex items-center justify-center relative">
                          <img
                            src={eq.condenserPhotoUrl}
                            alt="Unidade Externa Condensadora"
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60 group-hover:opacity-30 transition-opacity" />
                          <div className="absolute top-0.5 right-0.5 p-0.5 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            <ZoomIn className="w-2.5 h-2.5 text-sky-300" />
                          </div>
                          <span className="absolute bottom-0.5 left-0.5 text-[8px] font-bold text-white bg-amber-600/90 px-1 py-0.2 rounded shadow-xs">
                            Externa
                          </span>
                        </div>
                        <div className="px-1 py-0.5 bg-white border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[9px] font-semibold text-slate-700 truncate">Condens</span>
                          <span className="text-[8px] text-amber-600 font-bold group-hover:underline">
                            Ver
                          </span>
                        </div>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openEditEquipmentModal(eq)}
                        className="flex flex-col items-center justify-center h-[90px] rounded-lg border border-dashed border-slate-200 hover:border-sky-400 bg-slate-50/70 hover:bg-sky-50/40 text-slate-400 hover:text-sky-700 transition-all p-1 text-center group"
                        title="Adicionar foto da unidade externa (condensadora)"
                      >
                        <Camera className="w-3.5 h-3.5 mb-0.5 text-slate-400 group-hover:text-amber-600 transition-colors" />
                        <span className="text-[9px] font-semibold leading-tight">+ Externa</span>
                        <span className="text-[8px] text-slate-400">Condensadora</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => onViewEquipmentHistory(eq.id)}
                  className="text-xs font-semibold text-sky-600 hover:text-sky-800"
                >
                  Ver Histórico Completo →
                </button>

                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  eq.status === 'Operando Normal'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {eq.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Client */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4">
              {editingClient ? 'Editar Cadastro do Cliente' : 'Novo Cliente'}
            </h2>
            <form onSubmit={handleSaveClientSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Razão Social / Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={clientFormName}
                  onChange={(e) => setClientFormName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">CNPJ ou CPF</label>
                  <input
                    type="text"
                    value={clientFormDoc}
                    onChange={(e) => setClientFormDoc(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Telefone / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={clientFormPhone}
                    onChange={(e) => setClientFormPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">E-mail</label>
                <input
                  type="email"
                  value={clientFormEmail}
                  onChange={(e) => setClientFormEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>

              {/* Address block with CEP search & auto-completion */}
              <div className="p-3.5 bg-slate-50/90 rounded-xl border border-slate-200/90 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-sky-600" />
                    Endereço do Cliente & Rota GPS
                  </span>
                  <span className="text-[11px] text-sky-700 font-medium">
                    Preenchimento automático
                  </span>
                </div>

                {/* CEP Input with Mask and Auto-fetch */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    CEP (digite os 8 dígitos para buscar)
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={clientFormZipCode}
                        onChange={(e) => handleCepInputChange(e.target.value)}
                        placeholder="Ex: 01451-001"
                        maxLength={9}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={isSearchingCep}
                      onClick={() => performCepLookup()}
                      className="px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:bg-slate-300 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                      title="Consultar CEP e preencher endereço"
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

                  {/* Feedback on CEP search */}
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

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Rua / Logradouro</label>
                    <input
                      type="text"
                      value={clientFormStreet}
                      onChange={(e) => setClientFormStreet(e.target.value)}
                      placeholder="Nome da rua ou avenida"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Número *</label>
                    <input
                      ref={numberInputRef}
                      type="text"
                      value={clientFormNumber}
                      onChange={(e) => setClientFormNumber(e.target.value)}
                      placeholder="Ex: 1240"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 bg-white font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Bairro</label>
                    <input
                      type="text"
                      value={clientFormNeighborhood}
                      onChange={(e) => setClientFormNeighborhood(e.target.value)}
                      placeholder="Bairro"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Cidade - UF</label>
                    <input
                      type="text"
                      value={clientFormCity}
                      onChange={(e) => setClientFormCity(e.target.value)}
                      placeholder="Cidade - UF"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 bg-white"
                    />
                  </div>
                </div>

                {/* Location Link Input / Generator */}
                <div className="pt-2 border-t border-slate-200/80">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                      Link de Localização / Rota GPS (Google Maps / Waze / Ponto)
                    </label>
                    {clientFormLocationUrl.trim() && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full">
                        Ativo
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mb-1.5 leading-snug">
                    Cole o link do Google Maps, Waze ou marcador enviado pelo cliente no WhatsApp para traçar a rota exata.
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={clientFormLocationUrl}
                      onChange={(e) => setClientFormLocationUrl(e.target.value)}
                      placeholder="Ex: https://maps.app.goo.gl/... ou https://waze.com/ul?..."
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 bg-white"
                    />
                    {clientFormLocationUrl.trim() && (
                      <a
                        href={normalizeLocationUrl(clientFormLocationUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 shrink-0 transition-colors shadow-2xs"
                        title="Abrir e testar o link de rota cadastrado"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Testar</span>
                      </a>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const addrParts = [
                          clientFormStreet,
                          clientFormNumber,
                          clientFormNeighborhood,
                          clientFormCity
                        ].filter(Boolean).join(', ');
                        if (!addrParts) {
                          alert('Preencha os campos de rua e cidade primeiro para gerar o link.');
                          return;
                        }
                        const generatedUrl = getGoogleMapsRouteUrl(addrParts, clientFormZipCode);
                        setClientFormLocationUrl(generatedUrl);
                      }}
                      className="text-[11px] font-semibold text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-2.5 py-1 rounded-md transition-colors flex items-center gap-1"
                      title="Preencher automaticamente com o link do Google Maps baseado no endereço acima"
                    >
                      <Sparkles className="w-3 h-3 text-sky-600" />
                      <span>Gerar Link Google Maps pelo Endereço</span>
                    </button>
                    {clientFormLocationUrl && (
                      <button
                        type="button"
                        onClick={() => setClientFormLocationUrl('')}
                        className="text-[11px] text-slate-500 hover:text-rose-600 underline"
                      >
                        Limpar link
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Observações de Acesso / Horários</label>
                <input
                  type="text"
                  value={clientFormNotes}
                  onChange={(e) => setClientFormNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs"
                >
                  Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Equipment */}
      {isEquipmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              {editingEquipment ? 'Editar Equipamento' : 'Cadastrar Novo Equipamento'}
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Identificação técnica, dados de placa, localização e registro fotográfico completo.
            </p>

            <form onSubmit={handleSaveEquipmentSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cliente Proprietário *</label>
                <select
                  required
                  value={equipFormClientId}
                  onChange={(e) => setEquipFormClientId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                >
                  <option value="">-- Selecione o Cliente --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipo de Equipamento</label>
                  <select
                    value={equipFormType}
                    onChange={(e) => setEquipFormType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                  >
                    <option value="Split Hi-Wall">Split Hi-Wall</option>
                    <option value="Split Inverter">Split Inverter</option>
                    <option value="Multi-Split">Multi-Split</option>
                    <option value="Split Cassete">Split Cassete</option>
                    <option value="Piso Teto">Piso Teto</option>
                    <option value="Split Dutado">Split Dutado</option>
                    <option value="VRF / VRV">VRF / VRV</option>
                    <option value="Chiller / Fan Coil">Chiller / Fan Coil</option>
                    <option value="Ar de Janela (ACJ)">Ar de Janela (ACJ)</option>
                    <option value="Outro (Climatização)">Outro (Climatização)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Marca do Fabricante *</label>
                  <input
                    type="text"
                    required
                    value={equipFormBrand}
                    onChange={(e) => setEquipFormBrand(e.target.value)}
                    placeholder="Ex: Daikin, Carrier, Elgin, LG"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Modelo Comercial / Código</label>
                  <input
                    type="text"
                    value={equipFormModel}
                    onChange={(e) => setEquipFormModel(e.target.value)}
                    placeholder="Ex: 42XQL060515LC / FTKC12Q5VL"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Capacidade / Potência *</label>
                  <input
                    type="text"
                    required
                    value={equipFormCapacity}
                    onChange={(e) => setEquipFormCapacity(e.target.value)}
                    placeholder="Ex: 12.000 BTU, 36.000 BTU ou 5 HP"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gás Refrigerante</label>
                  <input
                    type="text"
                    value={equipFormGasType}
                    onChange={(e) => setEquipFormGasType(e.target.value)}
                    placeholder="R-410A / R-32 / R-22"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Corrente Nominal (A)</label>
                  <input
                    type="text"
                    value={equipFormNominalCurrent}
                    onChange={(e) => setEquipFormNominalCurrent(e.target.value)}
                    placeholder="Ex: 12.8 A (FLA)"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tensão / Alimentação</label>
                  <input
                    type="text"
                    value={equipFormVoltage}
                    onChange={(e) => setEquipFormVoltage(e.target.value)}
                    placeholder="220V 1F 60Hz"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Localização no Imóvel *</label>
                <input
                  type="text"
                  required
                  value={equipFormLocation}
                  onChange={(e) => setEquipFormLocation(e.target.value)}
                  placeholder="Ex: Sala de Reunião 2º andar / Varanda técnica dos quartos"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Número de Série</label>
                  <input
                    type="text"
                    value={equipFormSerial}
                    onChange={(e) => setEquipFormSerial(e.target.value)}
                    placeholder="SN-12345678"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Operacional</label>
                  <select
                    value={equipFormStatus}
                    onChange={(e) => setEquipFormStatus(e.target.value as EquipmentStatus)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                  >
                    <option value="Operando Normal">Operando Normal</option>
                    <option value="Atenção / Manutenção Pendente">Atenção / Manutenção Pendente</option>
                    <option value="Parado / Necessita Reparo">Parado / Necessita Reparo</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Próxima Preventiva</label>
                  <input
                    type="date"
                    value={equipFormNextDate}
                    onChange={(e) => setEquipFormNextDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                  />
                </div>
              </div>

              {/* ========================================================= */}
              {/* Uploader com Auto-Compressão: 3 Opções de Foto             */}
              {/* ========================================================= */}
              <EquipmentPhotoUploader
                labelPhoto={{
                  url: equipFormLabelPhotoUrl,
                  date: equipFormLabelPhotoDate
                }}
                installationPhoto={{
                  url: equipFormInstallPhotoUrl,
                  date: equipFormInstallPhotoDate
                }}
                condenserPhoto={{
                  url: equipFormCondenserPhotoUrl,
                  date: equipFormCondenserPhotoDate
                }}
                onChangeLabelPhoto={(url, date) => {
                  setEquipFormLabelPhotoUrl(url);
                  setEquipFormLabelPhotoDate(date);
                }}
                onChangeInstallationPhoto={(url, date) => {
                  setEquipFormInstallPhotoUrl(url);
                  setEquipFormInstallPhotoDate(date);
                }}
                onChangeCondenserPhoto={(url, date) => {
                  setEquipFormCondenserPhotoUrl(url);
                  setEquipFormCondenserPhotoDate(date);
                }}
                onPreviewPhoto={(type) => {
                  // Temporary preview in lightbox
                  const tempEquip: Equipment = {
                    id: editingEquipment ? editingEquipment.id : 'preview',
                    clientId: equipFormClientId,
                    clientName: clients.find(c => c.id === equipFormClientId)?.name || 'Cliente',
                    type: equipFormType,
                    brand: equipFormBrand,
                    model: equipFormModel,
                    capacity: equipFormCapacity,
                    gasType: equipFormGasType,
                    serialNumber: equipFormSerial,
                    nominalCurrent: equipFormNominalCurrent,
                    voltage: equipFormVoltage,
                    locationDescription: equipFormLocation,
                    status: equipFormStatus,
                    labelPhotoUrl: equipFormLabelPhotoUrl,
                    labelPhotoDate: equipFormLabelPhotoDate,
                    installationPhotoUrl: equipFormInstallPhotoUrl,
                    installationPhotoDate: equipFormInstallPhotoDate,
                    condenserPhotoUrl: equipFormCondenserPhotoUrl,
                    condenserPhotoDate: equipFormCondenserPhotoDate
                  };
                  openLightbox(tempEquip, type);
                }}
              />

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEquipmentModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-sm transition-colors"
                >
                  Salvar Equipamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* Visualizador em Tela Cheia (Lightbox) com Zoom e Download */}
      {/* ========================================================= */}
      <EquipmentPhotoLightbox
        equipment={lightboxEquipment}
        initialType={lightboxPhotoType}
        isOpen={isLightboxOpen}
        onClose={() => {
          setIsLightboxOpen(false);
          setLightboxEquipment(null);
        }}
      />

      {/* ========================================================= */}
      {/* Modal Seguro de Confirmação de Exclusão (Substitui confirm) */}
      {/* ========================================================= */}
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
