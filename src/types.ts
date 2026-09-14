export type VisitStatus = 'Agendada' | 'A Caminho' | 'Em Andamento' | 'Concluída' | 'Cancelada';

export type QuoteStatus = 'Rascunho' | 'Enviado' | 'Aprovado' | 'Recusado' | 'Faturado';

export type MaintenanceType = 'Preventiva' | 'Corretiva' | 'Higienização e PMOC' | 'Instalação / Comissionamento';

export type EquipmentStatus = 'Operando Normal' | 'Atenção / Manutenção Pendente' | 'Inoperante / Em Manutenção';

export interface Client {
  id: string;
  name: string;
  document: string; // CPF or CNPJ
  phone: string;
  email: string;
  address: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    complement?: string;
    zipCode?: string;
    locationUrl?: string; // Link direto do Google Maps, Waze ou coordenadas
  };
  locationUrl?: string; // Link de localização / rota GPS
  notes?: string;
  createdAt: string;
}

export interface Equipment {
  id: string;
  clientId: string;
  clientName: string;
  type: string; // 'Split Hi-Wall', 'Split Inverter', 'Multi-Split', 'Split Cassete', 'Piso Teto', 'VRF / VRV', 'Chiller / Fan Coil', etc.
  brand: string; // Daikin, Fujitsu, LG, Carrier, Gree, Elgin, etc.
  model: string;
  capacity: string; // '9.000 BTU', '12.000 BTU', '18.000 BTU', '36.000 BTU', '60.000 BTU', etc.
  gasType: string; // 'R-410A', 'R-32', 'R-22', 'R-134a'
  serialNumber?: string;
  locationDescription: string; // 'Sala Reunião Diretoria', 'Auditório Principal', 'Recepção'
  installationDate?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  status: EquipmentStatus;
}

export interface TechnicalVisit {
  id: string;
  code: string; // e.g. VIS-2026-001
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientAddress: string;
  clientCep?: string; // CEP for pinpoint GPS navigation & routing
  clientLocationUrl?: string; // Link direto de rota / GPS (Google Maps, Waze, etc.)
  equipmentIds: string[];
  date: string; // YYYY-MM-DD
  timeWindow: string; // '08:00 - 10:00', '10:00 - 12:00', '13:30 - 15:30', '15:30 - 18:00'
  technicianName: string;
  serviceType: string; // 'Instalação', 'Higienização e Limpeza Química', 'Carga de Gás / Detecção de Vazamento', 'Diagnóstico Técnico', 'Manutenção Corretiva'
  reportedIssue: string;
  status: VisitStatus;
  notes?: string;
  quoteId?: string;
  maintenanceLogId?: string;
  completedAt?: string;
}

export interface QuoteItem {
  id: string;
  type: 'Serviço' | 'Peça / Material';
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

export interface ClientSignature {
  signedBy: string;
  documentNumber?: string;
  signedAt: string;
  signatureDataUrl?: string;
  ipAddress?: string;
  signType: 'drawn' | 'typed';
}

export interface Quote {
  id: string;
  number: string; // e.g. ORC-1085
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  clientAddress: string;
  clientCep?: string;
  clientLocationUrl?: string; // Link direto de rota / GPS do cliente
  clientDocument: string;
  equipmentDescription: string;
  items: QuoteItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentTerms: string;
  validityDays: number;
  warrantyTerms: string;
  technicianObservations?: string;
  status: QuoteStatus;
  createdAt: string;
  approvedAt?: string;
  signature?: ClientSignature;
}

export interface MaintenanceLog {
  id: string;
  code: string; // e.g. OS-2026-089
  equipmentId: string;
  equipmentName: string;
  clientId: string;
  clientName: string;
  date: string;
  technicianName: string;
  type: MaintenanceType;
  description: string;
  workPerformed: string[];
  replacedParts: { name: string; quantity: number; unitPrice?: number }[];
  readings?: {
    suctionPressurePsi?: number; // Pressão de baixa
    dischargePressurePsi?: number; // Pressão de alta
    superheatC?: number; // Superaquecimento °C
    subcoolingC?: number; // Sub-resfriamento °C
    ambientTempC?: number; // Temperatura ambiente °C
    supplyAirTempC?: number; // Temperatura de insuflamento °C
    operatingCurrentAmp?: number; // Corrente do compressor A
    voltageV?: number; // Tensão elétrica V
    gasType?: string;
  };
  observations: string;
  nextMaintenanceRecommendedDate: string;
  status: 'Concluído' | 'Pendente Retorno';
  signature?: ClientSignature;
}

export interface CompanySettings {
  companyName: string;
  tradeName: string;
  cnpj: string;
  phone: string;
  email: string;
  address: string;
  cep?: string;
  technicianResponsible: string;
  technicalRegistration?: string;
  pixKey?: string;
  defaultWarranty: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'tecnico' | 'gerente';
  phone?: string;
  createdAt: string;
}

