import React, { useState } from 'react';
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
  Clock
} from 'lucide-react';
import { Client, Equipment, EquipmentStatus } from '../types';
import { formatDateBR } from '../utils/formatters';

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
  onViewEquipmentHistory
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'clients' | 'equipment'>('clients');

  // Client modal
  const [isClientModalOpen, setIsClientModalOpen] = useState<boolean>(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientFormName, setClientFormName] = useState<string>('');
  const [clientFormDoc, setClientFormDoc] = useState<string>('');
  const [clientFormPhone, setClientFormPhone] = useState<string>('');
  const [clientFormEmail, setClientFormEmail] = useState<string>('');
  const [clientFormStreet, setClientFormStreet] = useState<string>('');
  const [clientFormNumber, setClientFormNumber] = useState<string>('');
  const [clientFormNeighborhood, setClientFormNeighborhood] = useState<string>('');
  const [clientFormCity, setClientFormCity] = useState<string>('São Paulo - SP');
  const [clientFormNotes, setClientFormNotes] = useState<string>('');

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
  const [equipFormLocation, setEquipFormLocation] = useState<string>('');
  const [equipFormStatus, setEquipFormStatus] = useState<EquipmentStatus>('Operando Normal');
  const [equipFormNextDate, setEquipFormNextDate] = useState<string>('');

  const openNewClientModal = () => {
    setEditingClient(null);
    setClientFormName('');
    setClientFormDoc('');
    setClientFormPhone('');
    setClientFormEmail('');
    setClientFormStreet('');
    setClientFormNumber('');
    setClientFormNeighborhood('');
    setClientFormCity('São Paulo - SP');
    setClientFormNotes('');
    setIsClientModalOpen(true);
  };

  const openEditClientModal = (c: Client) => {
    setEditingClient(c);
    setClientFormName(c.name);
    setClientFormDoc(c.document);
    setClientFormPhone(c.phone);
    setClientFormEmail(c.email);
    setClientFormStreet(c.address.street);
    setClientFormNumber(c.address.number);
    setClientFormNeighborhood(c.address.neighborhood);
    setClientFormCity(c.address.city);
    setClientFormNotes(c.notes || '');
    setIsClientModalOpen(true);
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
        city: clientFormCity
      },
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
    setEquipFormLocation('Sala Principal');
    setEquipFormStatus('Operando Normal');
    
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
    setEquipFormLocation(eq.locationDescription);
    setEquipFormStatus(eq.status);
    setEquipFormNextDate(eq.nextMaintenanceDate || '');
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
      serialNumber: equipFormSerial,
      locationDescription: equipFormLocation,
      status: equipFormStatus,
      nextMaintenanceDate: equipFormNextDate,
      lastMaintenanceDate: editingEquipment?.lastMaintenanceDate
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
                        onClick={() => {
                          if (confirm(`Deseja excluir o cliente ${client.name}?`)) {
                            onDeleteClient(client.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
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
                    <p className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{client.address.street}, {client.address.number} - {client.address.neighborhood}</span>
                    </p>
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
                          <div key={eq.id} className="flex items-center justify-between text-[11px] bg-white p-1.5 rounded border border-slate-200">
                            <span className="truncate">{eq.brand} {eq.capacity} ({eq.locationDescription})</span>
                            <span className="text-slate-400 font-mono text-[10px] shrink-0 ml-1">{eq.gasType}</span>
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
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onScheduleVisitForClient(client)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-semibold transition-colors"
                  >
                    <CalendarDays className="w-3.5 h-3.5" />
                    <span>Agendar Visita</span>
                  </button>

                  <button
                    onClick={() => onNewQuoteForClient(client)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Novo Orçamento</span>
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
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Deseja excluir a máquina ${eq.brand} ${eq.capacity}?`)) {
                          onDeleteEquipment(eq.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
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
                  <div className="flex justify-between">
                    <span className="text-slate-400">Gás Refrigerante:</span>
                    <span className="font-mono font-bold text-sky-700">{eq.gasType}</span>
                  </div>
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

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Rua / Logradouro</label>
                  <input
                    type="text"
                    value={clientFormStreet}
                    onChange={(e) => setClientFormStreet(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Número</label>
                  <input
                    type="text"
                    value={clientFormNumber}
                    onChange={(e) => setClientFormNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bairro</label>
                  <input
                    type="text"
                    value={clientFormNeighborhood}
                    onChange={(e) => setClientFormNeighborhood(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cidade - UF</label>
                  <input
                    type="text"
                    value={clientFormCity}
                    onChange={(e) => setClientFormCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
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
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4">
              {editingEquipment ? 'Editar Equipamento' : 'Cadastrar Novo Equipamento'}
            </h2>
            <form onSubmit={handleSaveEquipmentSubmit} className="space-y-3 text-xs">
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

              <div className="grid grid-cols-2 gap-2">
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
                    <option value="Câmara Fria Resfriados">Câmara Fria Resfriados</option>
                    <option value="Câmara Fria Congelados">Câmara Fria Congelados</option>
                    <option value="Balcão Frigorífico">Balcão Frigorífico</option>
                    <option value="Chiller">Chiller</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Marca do Fabricante *</label>
                  <input
                    type="text"
                    required
                    value={equipFormBrand}
                    onChange={(e) => setEquipFormBrand(e.target.value)}
                    placeholder="Ex: Daikin, Carrier, Elgin"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Capacidade / Potência *</label>
                  <input
                    type="text"
                    required
                    value={equipFormCapacity}
                    onChange={(e) => setEquipFormCapacity(e.target.value)}
                    placeholder="Ex: 12.000 BTU ou 3.5 HP"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gás Refrigerante</label>
                  <input
                    type="text"
                    value={equipFormGasType}
                    onChange={(e) => setEquipFormGasType(e.target.value)}
                    placeholder="R-410A / R-32 / R-404A"
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
                  placeholder="Ex: Sala de Reunião 2º andar / Fundos da Cozinha"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Número de Série</label>
                  <input
                    type="text"
                    value={equipFormSerial}
                    onChange={(e) => setEquipFormSerial(e.target.value)}
                    placeholder="SN-123456"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
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

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEquipmentModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs"
                >
                  Salvar Equipamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
