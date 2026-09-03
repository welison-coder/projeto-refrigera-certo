import React, { useState } from 'react';
import {
  Wrench,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Calendar,
  Gauge,
  Zap,
  Thermometer,
  ShieldAlert,
  Edit2,
  Trash2,
  FileCheck
} from 'lucide-react';
import { MaintenanceLog, Equipment, Client, CompanySettings, MaintenanceType } from '../types';
import { formatDateBR } from '../utils/formatters';

interface MaintenanceHistoryViewProps {
  maintenanceLogs: MaintenanceLog[];
  equipment: Equipment[];
  clients: Client[];
  companySettings: CompanySettings;
  onSaveLog: (log: MaintenanceLog) => void;
  onDeleteLog: (logId: string) => void;
  selectedEquipmentId?: string;
}

export const MaintenanceHistoryView: React.FC<MaintenanceHistoryViewProps> = ({
  maintenanceLogs,
  equipment,
  clients,
  companySettings,
  onSaveLog,
  onDeleteLog,
  selectedEquipmentId
}) => {
  const [filterEquipmentId, setFilterEquipmentId] = useState<string>(selectedEquipmentId || 'all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingLog, setEditingLog] = useState<MaintenanceLog | null>(null);
  const [previewLog, setPreviewLog] = useState<MaintenanceLog | null>(null);

  // Form states
  const [formEquipmentId, setFormEquipmentId] = useState<string>('');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [formTechnicianName, setFormTechnicianName] = useState<string>(companySettings.technicianResponsible || 'Marcos Vinícius Barbosa');
  const [formType, setFormType] = useState<MaintenanceType>('Preventiva');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formWorkPerformed, setFormWorkPerformed] = useState<string[]>([
    'Higienização de serpentina e filtros de ar',
    'Aferição das pressões de sucção e descarga',
    'Limpeza de bandeja e desobstrução de dreno'
  ]);
  const [customWorkItem, setCustomWorkItem] = useState<string>('');
  const [formParts, setFormParts] = useState<{ name: string; quantity: number }[]>([]);
  const [partNameInput, setPartNameInput] = useState<string>('');
  const [partQtyInput, setPartQtyInput] = useState<number>(1);

  // Technical readings
  const [formSuctionPsi, setFormSuctionPsi] = useState<string>('');
  const [formDischargePsi, setFormDischargePsi] = useState<string>('');
  const [formSuperheat, setFormSuperheat] = useState<string>('');
  const [formSubcooling, setFormSubcooling] = useState<string>('');
  const [formAmbientTemp, setFormAmbientTemp] = useState<string>('24');
  const [formSupplyTemp, setFormSupplyTemp] = useState<string>('12');
  const [formCurrentAmp, setFormCurrentAmp] = useState<string>('');
  const [formVoltage, setFormVoltage] = useState<string>('220');
  const [formGasType, setFormGasType] = useState<string>('R-410A');

  const [formObservations, setFormObservations] = useState<string>('');
  const [formNextMaintenanceDate, setFormNextMaintenanceDate] = useState<string>('');

  const openNewLogModal = (preselectedEquipId?: string) => {
    setEditingLog(null);
    const equip = equipment.find(e => e.id === (preselectedEquipId || (equipment[0]?.id)));
    setFormEquipmentId(equip?.id || '');
    setFormGasType(equip?.gasType || 'R-410A');
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormTechnicianName(companySettings.technicianResponsible || 'Marcos Vinícius Barbosa');
    setFormType('Preventiva');
    setFormDescription('Manutenção preventiva periódica e revisão operacional');
    setFormWorkPerformed([
      'Higienização química de serpentina e filtros com bactericida',
      'Desobstrução e teste de estanqueidade da bandeja de dreno',
      'Aferição de pressões de trabalho e temperatura de insuflamento',
      'Aperto de conexões elétricas e verificação de contatores'
    ]);
    setFormParts([]);
    setFormSuctionPsi('');
    setFormDischargePsi('');
    setFormSuperheat('');
    setFormSubcooling('');
    setFormAmbientTemp('24');
    setFormSupplyTemp('12');
    setFormCurrentAmp('');
    setFormVoltage('220');
    setFormObservations('Equipamento operando dentro dos parâmetros de fábrica.');

    // Calculate 90 days from now as default next maintenance
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 90);
    setFormNextMaintenanceDate(nextDate.toISOString().slice(0, 10));

    setIsModalOpen(true);
  };

  const openEditLogModal = (log: MaintenanceLog) => {
    setEditingLog(log);
    setFormEquipmentId(log.equipmentId);
    setFormDate(log.date);
    setFormTechnicianName(log.technicianName);
    setFormType(log.type);
    setFormDescription(log.description);
    setFormWorkPerformed(log.workPerformed || []);
    setFormParts(log.replacedParts || []);
    setFormSuctionPsi(log.readings?.suctionPressurePsi?.toString() || '');
    setFormDischargePsi(log.readings?.dischargePressurePsi?.toString() || '');
    setFormSuperheat(log.readings?.superheatC?.toString() || '');
    setFormSubcooling(log.readings?.subcoolingC?.toString() || '');
    setFormAmbientTemp(log.readings?.ambientTempC?.toString() || '24');
    setFormSupplyTemp(log.readings?.supplyAirTempC?.toString() || '12');
    setFormCurrentAmp(log.readings?.operatingCurrentAmp?.toString() || '');
    setFormVoltage(log.readings?.voltageV?.toString() || '220');
    setFormGasType(log.readings?.gasType || 'R-410A');
    setFormObservations(log.observations || '');
    setFormNextMaintenanceDate(log.nextMaintenanceRecommendedDate || '');
    setIsModalOpen(true);
  };

  const handleAddWorkItem = () => {
    if (!customWorkItem.trim()) return;
    setFormWorkPerformed([...formWorkPerformed, customWorkItem.trim()]);
    setCustomWorkItem('');
  };

  const handleRemoveWorkItem = (index: number) => {
    setFormWorkPerformed(formWorkPerformed.filter((_, i) => i !== index));
  };

  const handleAddPart = () => {
    if (!partNameInput.trim()) return;
    setFormParts([...formParts, { name: partNameInput.trim(), quantity: partQtyInput }]);
    setPartNameInput('');
    setPartQtyInput(1);
  };

  const handleRemovePart = (index: number) => {
    setFormParts(formParts.filter((_, i) => i !== index));
  };

  const handleSubmitLog = (e: React.FormEvent) => {
    e.preventDefault();
    const equip = equipment.find(e => e.id === formEquipmentId);
    if (!equip) {
      alert('Selecione o equipamento que recebeu a manutenção.');
      return;
    }

    const logToSave: MaintenanceLog = {
      id: editingLog ? editingLog.id : `man-${Date.now()}`,
      code: editingLog ? editingLog.code : `OS-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      equipmentId: equip.id,
      equipmentName: `${equip.type} ${equip.brand} ${equip.capacity} (${equip.locationDescription})`,
      clientId: equip.clientId,
      clientName: equip.clientName,
      date: formDate,
      technicianName: formTechnicianName,
      type: formType,
      description: formDescription,
      workPerformed: formWorkPerformed,
      replacedParts: formParts,
      readings: {
        suctionPressurePsi: formSuctionPsi ? parseFloat(formSuctionPsi) : undefined,
        dischargePressurePsi: formDischargePsi ? parseFloat(formDischargePsi) : undefined,
        superheatC: formSuperheat ? parseFloat(formSuperheat) : undefined,
        subcoolingC: formSubcooling ? parseFloat(formSubcooling) : undefined,
        ambientTempC: formAmbientTemp ? parseFloat(formAmbientTemp) : undefined,
        supplyAirTempC: formSupplyTemp ? parseFloat(formSupplyTemp) : undefined,
        operatingCurrentAmp: formCurrentAmp ? parseFloat(formCurrentAmp) : undefined,
        voltageV: formVoltage ? parseFloat(formVoltage) : undefined,
        gasType: formGasType
      },
      observations: formObservations,
      nextMaintenanceRecommendedDate: formNextMaintenanceDate,
      status: 'Concluído'
    };

    onSaveLog(logToSave);
    setIsModalOpen(false);
  };

  // Filtered maintenance logs
  const filteredLogs = maintenanceLogs.filter(log => {
    const matchesEquip = filterEquipmentId === 'all' || log.equipmentId === filterEquipmentId;
    const matchesType = filterType === 'all' || log.type === filterType;
    const matchesSearch =
      log.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.equipmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.technicianName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesEquip && matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Histórico de Manutenções & PMOC</h1>
          <p className="text-slate-500 text-sm">
            Prontuário técnico de cada equipamento com registros de aferições termodinâmicas e conformidade técnica.
          </p>
        </div>

        <button
          id="btn-add-maintenance"
          onClick={() => openNewLogModal()}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Manutenção</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por cliente, equipamento, técnico..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm bg-slate-50/50"
          />
        </div>

        {/* Equipment Selector Filter */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <select
            value={filterEquipmentId}
            onChange={(e) => setFilterEquipmentId(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium bg-white text-slate-700"
          >
            <option value="all">Todas as Máquinas Cadastradas</option>
            {equipment.map(eq => (
              <option key={eq.id} value={eq.id}>
                {eq.clientName} - {eq.brand} {eq.capacity}
              </option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium bg-white text-slate-700"
          >
            <option value="all">Todos os Tipos</option>
            <option value="Preventiva">Preventiva</option>
            <option value="Corretiva">Corretiva</option>
            <option value="Higienização e PMOC">Higienização e PMOC</option>
            <option value="Instalação / Comissionamento">Instalação</option>
          </select>
        </div>
      </div>

      {/* Logs List */}
      {filteredLogs.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
          <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-semibold text-base">Nenhum registro de manutenção encontrado</p>
          <p className="text-slate-400 text-xs mt-1">Clique em "Registrar Manutenção" para abrir a primeira ordem de serviço.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="bg-white rounded-xl border border-slate-200/90 shadow-xs hover:border-sky-300 transition-all p-5"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded border border-sky-200">
                      {log.code}
                    </span>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                      log.type === 'Preventiva'
                        ? 'bg-blue-100 text-blue-800'
                        : log.type === 'Higienização e PMOC'
                        ? 'bg-emerald-100 text-emerald-800'
                        : log.type === 'Corretiva'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {log.type}
                    </span>
                    <span className="text-xs text-slate-400">
                      Realizada em: <strong className="text-slate-700">{formatDateBR(log.date)}</strong>
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 mt-1">
                    {log.equipmentName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cliente: <strong className="text-slate-700">{log.clientName}</strong> • Técnico: {log.technicianName}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreviewLog(log)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Ficha da OS</span>
                  </button>
                  <button
                    onClick={() => openEditLogModal(log)}
                    className="p-1.5 text-slate-400 hover:text-sky-600 rounded-lg"
                    title="Editar Registro"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Deseja excluir o registro ${log.code}?`)) {
                        onDeleteLog(log.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                    title="Excluir Registro"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Description & Work Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs">
                
                {/* Left: Work Performed */}
                <div className="space-y-2">
                  <p className="font-semibold text-slate-700">Serviços e Procedimentos Executados:</p>
                  <ul className="space-y-1 text-slate-600">
                    {log.workPerformed.map((wp, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{wp}</span>
                      </li>
                    ))}
                  </ul>

                  {log.replacedParts && log.replacedParts.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-slate-100">
                      <p className="font-semibold text-slate-700">Peças e Materiais Substituídos:</p>
                      <ul className="list-disc list-inside text-slate-600 mt-1">
                        {log.replacedParts.map((p, idx) => (
                          <li key={idx}>
                            {p.quantity}x {p.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Right: Technical Measurements & Next Date */}
                <div className="space-y-3">
                  {log.readings && (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2">
                      <div className="flex items-center gap-1 font-semibold text-slate-800 text-xs">
                        <Gauge className="w-3.5 h-3.5 text-sky-600" />
                        <span>Parâmetros Técnicos Medidos:</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                        {log.readings.suctionPressurePsi !== undefined && (
                          <div className="bg-white p-2 rounded border border-slate-200">
                            <span className="text-slate-400 block">P. Sucção (Baixa)</span>
                            <span className="font-mono font-bold text-slate-800">{log.readings.suctionPressurePsi} PSI</span>
                          </div>
                        )}
                        {log.readings.dischargePressurePsi !== undefined && (
                          <div className="bg-white p-2 rounded border border-slate-200">
                            <span className="text-slate-400 block">P. Descarga (Alta)</span>
                            <span className="font-mono font-bold text-slate-800">{log.readings.dischargePressurePsi} PSI</span>
                          </div>
                        )}
                        {log.readings.operatingCurrentAmp !== undefined && (
                          <div className="bg-white p-2 rounded border border-slate-200">
                            <span className="text-slate-400 block">Corrente</span>
                            <span className="font-mono font-bold text-slate-800">{log.readings.operatingCurrentAmp} A</span>
                          </div>
                        )}
                        {log.readings.supplyAirTempC !== undefined && (
                          <div className="bg-white p-2 rounded border border-slate-200">
                            <span className="text-slate-400 block">Insuflamento</span>
                            <span className="font-mono font-bold text-slate-800">{log.readings.supplyAirTempC} °C</span>
                          </div>
                        )}
                        {log.readings.ambientTempC !== undefined && (
                          <div className="bg-white p-2 rounded border border-slate-200">
                            <span className="text-slate-400 block">Ambiente</span>
                            <span className="font-mono font-bold text-slate-800">{log.readings.ambientTempC} °C</span>
                          </div>
                        )}
                        {log.readings.gasType && (
                          <div className="bg-white p-2 rounded border border-slate-200">
                            <span className="text-slate-400 block">Fluido</span>
                            <span className="font-mono font-bold text-sky-700">{log.readings.gasType}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Next maintenance date pill */}
                  {log.nextMaintenanceRecommendedDate && (
                    <div className="flex items-center gap-2 text-xs bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-amber-900">
                      <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
                      <div>
                        <span className="font-bold">Próxima Preventiva Recomendada: </span>
                        <span>{formatDateBR(log.nextMaintenanceRecommendedDate)}</span>
                      </div>
                    </div>
                  )}

                  {log.observations && (
                    <p className="text-xs text-slate-500 italic bg-white p-2 rounded border border-slate-100">
                      Nota: {log.observations}
                    </p>
                  )}
                </div>

              </div>

            </div>
          ))}
        </div>
      )}

      {/* Modal: Add/Edit Maintenance Log */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">
                {editingLog ? `Editar Ordem de Manutenção ${editingLog.code}` : 'Registrar Manutenção Técnica / OS'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitLog} className="mt-4 space-y-4">
              
              {/* Equipment & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Equipamento Atendido *
                  </label>
                  <select
                    required
                    value={formEquipmentId}
                    onChange={(e) => {
                      setFormEquipmentId(e.target.value);
                      const eq = equipment.find(x => x.id === e.target.value);
                      if (eq) setFormGasType(eq.gasType);
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                  >
                    <option value="">-- Selecione o Equipamento --</option>
                    {equipment.map(eq => (
                      <option key={eq.id} value={eq.id}>
                        {eq.clientName} - {eq.brand} {eq.capacity} ({eq.locationDescription})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data da Execução *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                  />
                </div>
              </div>

              {/* Type and Technician */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tipo de Manutenção
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as MaintenanceType)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                  >
                    <option value="Preventiva">Preventiva Periódica</option>
                    <option value="Higienização e PMOC">Higienização e PMOC</option>
                    <option value="Corretiva">Corretiva / Reparo Emergencial</option>
                    <option value="Instalação / Comissionamento">Instalação / Comissionamento</option>
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
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
              </div>

              {/* General Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Resumo do Atendimento *
                </label>
                <input
                  type="text"
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Ex: Manutenção semestral com higienização química de serpentina e recarga de gás."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>

              {/* Work Performed checklist */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Checklist de Procedimentos Executados
                </label>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Adicionar procedimento (ex: Teste de acionamento do relé)..."
                    value={customWorkItem}
                    onChange={(e) => setCustomWorkItem(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddWorkItem}
                    className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold"
                  >
                    Adicionar
                  </button>
                </div>

                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {formWorkPerformed.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs bg-white p-2 rounded border border-slate-200">
                      <span className="text-slate-800">✓ {item}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveWorkItem(idx)}
                        className="text-slate-400 hover:text-rose-600 text-xs font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Replaced Parts */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Peças Substituídas / Materiais Aplicados
                </label>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nome da peça (ex: Capacitor 45uF, Sensor de degelo)..."
                    value={partNameInput}
                    onChange={(e) => setPartNameInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                  />
                  <input
                    type="number"
                    min="1"
                    value={partQtyInput}
                    onChange={(e) => setPartQtyInput(parseInt(e.target.value) || 1)}
                    className="w-16 px-2 py-1.5 rounded-lg border border-slate-300 text-xs text-center bg-white"
                    placeholder="Qtd"
                  />
                  <button
                    type="button"
                    onClick={handleAddPart}
                    className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold"
                  >
                    Incluir
                  </button>
                </div>

                {formParts.length > 0 && (
                  <div className="space-y-1">
                    {formParts.map((p, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs bg-white p-2 rounded border border-slate-200">
                        <span>{p.quantity}x {p.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemovePart(idx)}
                          className="text-slate-400 hover:text-rose-600 text-xs font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Technical readings */}
              <div className="bg-sky-50/50 p-3 rounded-xl border border-sky-100 space-y-2">
                <label className="block text-xs font-bold text-sky-900 uppercase tracking-wider">
                  Aferições Técnicas de Campo
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">P. Sucção (PSI)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formSuctionPsi}
                      onChange={(e) => setFormSuctionPsi(e.target.value)}
                      placeholder="Ex: 118"
                      className="w-full px-2 py-1.5 rounded border border-slate-300 text-xs bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">P. Descarga (PSI)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formDischargePsi}
                      onChange={(e) => setFormDischargePsi(e.target.value)}
                      placeholder="Ex: 380"
                      className="w-full px-2 py-1.5 rounded border border-slate-300 text-xs bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">Corrente (Ampère)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formCurrentAmp}
                      onChange={(e) => setFormCurrentAmp(e.target.value)}
                      placeholder="Ex: 5.2"
                      className="w-full px-2 py-1.5 rounded border border-slate-300 text-xs bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">Tensão (V)</label>
                    <input
                      type="number"
                      value={formVoltage}
                      onChange={(e) => setFormVoltage(e.target.value)}
                      placeholder="Ex: 220"
                      className="w-full px-2 py-1.5 rounded border border-slate-300 text-xs bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">Temp. Ambiente (°C)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formAmbientTemp}
                      onChange={(e) => setFormAmbientTemp(e.target.value)}
                      className="w-full px-2 py-1.5 rounded border border-slate-300 text-xs bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">Temp. Insuflamento (°C)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formSupplyTemp}
                      onChange={(e) => setFormSupplyTemp(e.target.value)}
                      className="w-full px-2 py-1.5 rounded border border-slate-300 text-xs bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">Superaquec. (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formSuperheat}
                      onChange={(e) => setFormSuperheat(e.target.value)}
                      placeholder="Ex: 6.5"
                      className="w-full px-2 py-1.5 rounded border border-slate-300 text-xs bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">Gás Refrigerante</label>
                    <input
                      type="text"
                      value={formGasType}
                      onChange={(e) => setFormGasType(e.target.value)}
                      placeholder="R-410A / R-32"
                      className="w-full px-2 py-1.5 rounded border border-slate-300 text-xs bg-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Next maintenance date and notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Próxima Manutenção Preventiva Recomendada
                  </label>
                  <input
                    type="date"
                    value={formNextMaintenanceDate}
                    onChange={(e) => setFormNextMaintenanceDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Observações e Recomendações
                  </label>
                  <input
                    type="text"
                    value={formObservations}
                    onChange={(e) => setFormObservations(e.target.value)}
                    placeholder="Ex: Orientado o cliente sobre troca mensal de pré-filtros..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm shadow-sm"
                >
                  {editingLog ? 'Salvar Registro' : 'Gravar Ordem de Manutenção'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Printable Maintenance Logbook Modal / OS Sheet */}
      {previewLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[96vh] overflow-y-auto shadow-2xl border border-slate-300 p-6 sm:p-8 my-auto">
            
            <div className="no-print flex items-center justify-between pb-4 mb-6 border-b border-slate-200">
              <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2 py-1 rounded border border-sky-200">
                {previewLog.code}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir / Salvar PDF</span>
                </button>

                <button
                  onClick={() => setPreviewLog(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Sheet */}
            <div className="print-card space-y-5 text-slate-900 text-xs">
              
              {/* Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900">{companySettings.companyName}</h2>
                  <p className="text-slate-600">CNPJ: {companySettings.cnpj} • {companySettings.phone}</p>
                  <p className="text-slate-600">{companySettings.address}</p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold uppercase text-slate-400 block">Laudo de Manutenção</span>
                  <span className="text-xl font-mono font-bold text-slate-900">{previewLog.code}</span>
                  <p className="text-slate-500">Data: {formatDateBR(previewLog.date)}</p>
                </div>
              </div>

              {/* Client & Equipment info */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Cliente</span>
                  <p className="font-bold text-slate-800 text-sm">{previewLog.clientName}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Equipamento</span>
                  <p className="font-bold text-slate-800">{previewLog.equipmentName}</p>
                  <p className="text-slate-500">Tipo: {previewLog.type}</p>
                </div>
              </div>

              {/* Work Done */}
              <div>
                <p className="font-bold text-slate-800 mb-1">Procedimentos e Testes Realizados:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-700 bg-white p-3 rounded border border-slate-200">
                  {previewLog.workPerformed.map((wp, i) => (
                    <li key={i}>{wp}</li>
                  ))}
                </ul>
              </div>

              {/* Parts */}
              {previewLog.replacedParts && previewLog.replacedParts.length > 0 && (
                <div>
                  <p className="font-bold text-slate-800 mb-1">Peças e Insumos Utilizados:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-700 bg-white p-2.5 rounded border border-slate-200">
                    {previewLog.replacedParts.map((p, i) => (
                      <li key={i}>{p.quantity}x {p.name}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Technical Measurements */}
              {previewLog.readings && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <p className="font-bold text-slate-800 mb-2">Medições Termodinâmicas & Elétricas:</p>
                  <div className="grid grid-cols-3 gap-2 font-mono">
                    <p>Sucção: <strong>{previewLog.readings.suctionPressurePsi ?? '-'} PSI</strong></p>
                    <p>Descarga: <strong>{previewLog.readings.dischargePressurePsi ?? '-'} PSI</strong></p>
                    <p>Corrente: <strong>{previewLog.readings.operatingCurrentAmp ?? '-'} A</strong></p>
                    <p>Insuflamento: <strong>{previewLog.readings.supplyAirTempC ?? '-'} °C</strong></p>
                    <p>Ambiente: <strong>{previewLog.readings.ambientTempC ?? '-'} °C</strong></p>
                    <p>Fluido: <strong>{previewLog.readings.gasType ?? '-'}</strong></p>
                  </div>
                </div>
              )}

              {/* Recommended Next Date */}
              {previewLog.nextMaintenanceRecommendedDate && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <strong className="text-amber-900">Próxima Manutenção Preventiva Recomendada: </strong>
                  <span>{formatDateBR(previewLog.nextMaintenanceRecommendedDate)}</span>
                </div>
              )}

              {/* Signatures */}
              <div className="pt-10 grid grid-cols-2 gap-8 text-center">
                <div className="border-t border-slate-400 pt-1">
                  <p className="font-bold">{previewLog.technicianName}</p>
                  <p className="text-slate-500 text-[11px]">Técnico de Campo • Refrigera Certo</p>
                </div>
                <div className="border-t border-slate-400 pt-1">
                  <p className="font-bold">{previewLog.clientName}</p>
                  <p className="text-slate-500 text-[11px]">Assinatura do Responsável no Local</p>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
