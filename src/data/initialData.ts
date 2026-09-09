import { Client, Equipment, TechnicalVisit, Quote, MaintenanceLog, CompanySettings } from '../types';

export const initialCompanySettings: CompanySettings = {
  companyName: 'Refrigera Certo - Soluções em Climatização',
  tradeName: 'Refrigera Certo',
  cnpj: '45.892.114/0001-92',
  phone: '(11) 98451-2290',
  email: 'atendimento@refrigeracerto.com.br',
  address: 'Rua Barão de Jundiaí, 780 - Lapa, São Paulo - SP',
  technicianResponsible: 'Wellisson Medeiros',
  pixKey: '45.892.114/0001-92',
  defaultWarranty: 'Garantia legal de 90 dias para mão de obra e peças substituídas conforme termo técnico.'
};

export const initialClients: Client[] = [
  {
    id: 'cli-1',
    name: 'Padaria & Empório Pão Dourado Ltda',
    document: '28.114.908/0001-35',
    phone: '(11) 97123-4567',
    email: 'gerencia@paodourado.com.br',
    address: {
      street: 'Av. Brigadeiro Faria Lima',
      number: '1240',
      neighborhood: 'Pinheiros',
      city: 'São Paulo - SP',
      complement: 'Loja Térrea',
      zipCode: '01451-001'
    },
    notes: 'Acesso para manutenção preferencialmente antes das 08:30 ou após as 14:00.',
    createdAt: '2026-01-15'
  },
  {
    id: 'cli-2',
    name: 'Dra. Camila Vasconcelos (Clínica Odonto)',
    document: '312.845.918-04',
    phone: '(11) 98844-3321',
    email: 'camila.odonto@clinica.com.br',
    address: {
      street: 'Rua Pamplona',
      number: '550',
      neighborhood: 'Jardins',
      city: 'São Paulo - SP',
      complement: 'Conjunto 82',
      zipCode: '01405-000'
    },
    notes: 'Exige laudo de higienização semestral e controle de ruído nas salas de atendimento.',
    createdAt: '2026-02-01'
  },
  {
    id: 'cli-3',
    name: 'Supermercado Central da Vila',
    document: '19.452.782/0001-60',
    phone: '(11) 99182-7744',
    email: 'compras@centraldavila.com.br',
    address: {
      street: 'Rua Tito',
      number: '430',
      neighborhood: 'Vila Romana',
      city: 'São Paulo - SP',
      zipCode: '05051-000'
    },
    notes: 'Contrato de manutenção preventiva e higienização periódica para condicionadores de ar.',
    createdAt: '2026-02-10'
  },
  {
    id: 'cli-4',
    name: 'Eduardo Martins (Residencial)',
    document: '298.112.348-11',
    phone: '(11) 97331-9022',
    email: 'edu.martins@gmail.com',
    address: {
      street: 'Rua Desembargador do Vale',
      number: '890',
      neighborhood: 'Perdizes',
      city: 'São Paulo - SP',
      complement: 'Apto 114 Torre B',
      zipCode: '05010-040'
    },
    notes: 'Condomínio exige agendamento prévio com a portaria e uso de sapatilhas protetoras.',
    createdAt: '2026-02-18'
  }
];

export const initialEquipment: Equipment[] = [
  {
    id: 'eq-1',
    clientId: 'cli-1',
    clientName: 'Padaria & Empório Pão Dourado Ltda',
    type: 'Split Piso Teto Inverter',
    brand: 'Carrier',
    model: '42XQL060515LC',
    capacity: '60.000 BTU',
    gasType: 'R-410A',
    serialNumber: 'CAR-2023-8812',
    locationDescription: 'Salão de vendas e buffet de pães',
    installationDate: '2023-05-12',
    lastMaintenanceDate: '2026-08-10',
    nextMaintenanceDate: '2026-11-10',
    status: 'Operando Normal'
  },
  {
    id: 'eq-2',
    clientId: 'cli-1',
    clientName: 'Padaria & Empório Pão Dourado Ltda',
    type: 'Split Cassete',
    brand: 'Carrier',
    model: '40KWQA36C5',
    capacity: '36.000 BTU',
    gasType: 'R-410A',
    serialNumber: 'CAR-36K-901',
    locationDescription: 'Salão principal de atendimento ao cliente',
    installationDate: '2024-01-20',
    lastMaintenanceDate: '2026-06-15',
    nextMaintenanceDate: '2026-09-15',
    status: 'Atenção / Manutenção Pendente'
  },
  {
    id: 'eq-3',
    clientId: 'cli-2',
    clientName: 'Dra. Camila Vasconcelos (Clínica Odonto)',
    type: 'Split Inverter Hi-Wall',
    brand: 'Daikin',
    model: 'FTKC12Q5VL',
    capacity: '12.000 BTU',
    gasType: 'R-32',
    serialNumber: 'DKN-2024-411',
    locationDescription: 'Consultório Principal 01',
    installationDate: '2024-04-10',
    lastMaintenanceDate: '2026-07-20',
    nextMaintenanceDate: '2026-10-20',
    status: 'Operando Normal'
  },
  {
    id: 'eq-4',
    clientId: 'cli-3',
    clientName: 'Supermercado Central da Vila',
    type: 'Split Cassete Inverter',
    brand: 'Daikin',
    model: 'FCNQ48MV2L',
    capacity: '48.000 BTU',
    gasType: 'R-410A',
    serialNumber: 'DKN-9921-C',
    locationDescription: 'Setor de caixas e atendimento principal',
    installationDate: '2022-11-05',
    lastMaintenanceDate: '2026-08-01',
    nextMaintenanceDate: '2026-09-05',
    status: 'Atenção / Manutenção Pendente'
  },
  {
    id: 'eq-5',
    clientId: 'cli-4',
    clientName: 'Eduardo Martins (Residencial)',
    type: 'Multi-Split Inverter',
    brand: 'Fujitsu',
    model: 'AOBG24LAT3',
    capacity: '24.000 BTU (3x9.000)',
    gasType: 'R-410A',
    serialNumber: 'FUJ-7712-A',
    locationDescription: 'Área técnica varanda / Dormitórios',
    installationDate: '2024-08-12',
    lastMaintenanceDate: '2026-02-15',
    nextMaintenanceDate: '2026-08-15',
    status: 'Atenção / Manutenção Pendente'
  }
];

export const initialVisits: TechnicalVisit[] = [
  {
    id: 'vis-1',
    code: 'VIS-2026-041',
    clientId: 'cli-1',
    clientName: 'Padaria & Empório Pão Dourado Ltda',
    clientPhone: '(11) 97123-4567',
    clientAddress: 'Av. Brigadeiro Faria Lima, 1240 - Pinheiros, São Paulo - SP',
    clientCep: '01451-001',
    equipmentIds: ['eq-2'],
    date: '2026-09-03',
    timeWindow: '08:30 - 10:30',
    technicianName: 'Wellisson Medeiros',
    serviceType: 'Higienização e Limpeza Química',
    reportedIssue: 'Aparelho pingando água pela bandeja de condensado e vazão de ar reduzida.',
    status: 'Agendada',
    notes: 'Levar bomba de pressurização para limpeza de serpentina e bactericida hospitalar.'
  },
  {
    id: 'vis-2',
    code: 'VIS-2026-042',
    clientId: 'cli-3',
    clientName: 'Supermercado Central da Vila',
    clientPhone: '(11) 99182-7744',
    clientAddress: 'Rua Tito, 430 - Vila Romana, São Paulo - SP',
    clientCep: '05051-000',
    equipmentIds: ['eq-4'],
    date: '2026-09-03',
    timeWindow: '13:30 - 15:30',
    technicianName: 'Carlos Silva',
    serviceType: 'Diagnóstico Técnico & Rendimento',
    reportedIssue: 'Baixo rendimento térmico no salão de vendas e alarme no display da condensadora.',
    status: 'Agendada',
    notes: 'Verificar serpentina da unidade externa, pressões e capacitor do motor ventilador.'
  },
  {
    id: 'vis-3',
    code: 'VIS-2026-039',
    clientId: 'cli-2',
    clientName: 'Dra. Camila Vasconcelos (Clínica Odonto)',
    clientPhone: '(11) 98844-3321',
    clientAddress: 'Rua Pamplona, 550 Conj 82 - Jardins, São Paulo - SP',
    clientCep: '01405-000',
    equipmentIds: ['eq-3'],
    date: '2026-09-02',
    timeWindow: '10:00 - 12:00',
    technicianName: 'Carlos Silva',
    serviceType: 'Manutenção Preventiva / Higienização',
    reportedIssue: 'Manutenção periódica preventiva e aferição de temperatura.',
    status: 'Concluída',
    notes: 'Higienização com bactericida concluída com sucesso. Medição de delta T = 12°C perfeito.',
    completedAt: '2026-09-02 11:45'
  },
  {
    id: 'vis-4',
    code: 'VIS-2026-044',
    clientId: 'cli-4',
    clientName: 'Eduardo Martins (Residencial)',
    clientPhone: '(11) 97331-9022',
    clientAddress: 'Rua Desembargador do Vale, 890 Apto 114 - Perdizes, São Paulo - SP',
    clientCep: '05010-040',
    equipmentIds: ['eq-5'],
    date: '2026-09-04',
    timeWindow: '15:30 - 17:30',
    technicianName: 'Wellisson Medeiros',
    serviceType: 'Carga de Gás / Detecção de Vazamento',
    reportedIssue: 'Evaporadora do quarto master sopra ar morno e acusa erro de sensor.',
    status: 'Agendada',
    notes: 'Levar detector eletrônico de vazamento e manifold digital para R-410A.'
  }
];

export const initialQuotes: Quote[] = [
  {
    id: 'orc-101',
    number: 'ORC-2026-101',
    clientId: 'cli-1',
    clientName: 'Padaria & Empório Pão Dourado Ltda',
    clientPhone: '(11) 97123-4567',
    clientEmail: 'gerencia@paodourado.com.br',
    clientAddress: 'Av. Brigadeiro Faria Lima, 1240 - Pinheiros, São Paulo - SP',
    clientDocument: '28.114.908/0001-35',
    equipmentDescription: 'Split Cassete Carrier 36.000 BTU - Salão Principal',
    items: [
      {
        id: 'item-1',
        type: 'Serviço',
        description: 'Higienização química profunda com desmontagem de carenagem, bandeja e turbina',
        quantity: 1,
        unit: 'serviço',
        unitPrice: 420.00,
        total: 420.00
      },
      {
        id: 'item-2',
        type: 'Serviço',
        description: 'Desobstrução e teste de estanqueidade da linha de drenagem por gravidade',
        quantity: 1,
        unit: 'serviço',
        unitPrice: 180.00,
        total: 180.00
      },
      {
        id: 'item-3',
        type: 'Peça / Material',
        description: 'Bactericida e sanitizante hospitalar homologado Anvisa (Air Shield)',
        quantity: 1,
        unit: 'un',
        unitPrice: 85.00,
        total: 85.00
      }
    ],
    subtotal: 685.00,
    discount: 35.00,
    total: 650.00,
    paymentTerms: 'À vista no PIX com 5% de desconto ou em 3x sem juros no cartão de crédito',
    validityDays: 15,
    warrantyTerms: 'Garantia de 90 dias sobre a mão de obra e materiais aplicados.',
    technicianObservations: 'Recomendamos higienização preventiva trimestral devido ao fluxo constante de clientes e manipulação de alimentos.',
    status: 'Aprovado',
    createdAt: '2026-09-01',
    approvedAt: '2026-09-02'
  },
  {
    id: 'orc-102',
    number: 'ORC-2026-102',
    clientId: 'cli-3',
    clientName: 'Supermercado Central da Vila',
    clientPhone: '(11) 99182-7744',
    clientEmail: 'compras@centraldavila.com.br',
    clientAddress: 'Rua Tito, 430 - Vila Romana, São Paulo - SP',
    clientDocument: '19.452.782/0001-60',
    equipmentDescription: 'Split Cassete Inverter Daikin 48.000 BTU - Setor de Caixas',
    items: [
      {
        id: 'item-201',
        type: 'Serviço',
        description: 'Substituição de motor ventilador da unidade condensadora externa',
        quantity: 1,
        unit: 'serviço',
        unitPrice: 380.00,
        total: 380.00
      },
      {
        id: 'item-202',
        type: 'Peça / Material',
        description: 'Motor Ventilador DC Inverter original Daikin/Carrier',
        quantity: 1,
        unit: 'un',
        unitPrice: 590.00,
        total: 590.00
      },
      {
        id: 'item-203',
        type: 'Serviço',
        description: 'Descontaminação química e lavagem profunda de serpentinas com bactericida',
        quantity: 1,
        unit: 'serviço',
        unitPrice: 420.00,
        total: 420.00
      },
      {
        id: 'item-204',
        type: 'Peça / Material',
        description: 'Carga de complemento de fluido ecológico R-410A com teste de estanqueidade',
        quantity: 1,
        unit: 'un',
        unitPrice: 390.00,
        total: 390.00
      }
    ],
    subtotal: 1780.00,
    discount: 80.00,
    total: 1700.00,
    paymentTerms: 'Faturado para 15/30 dias no boleto bancário mediante aprovação cadastral',
    validityDays: 10,
    warrantyTerms: 'Garantia de 90 dias em serviços e garantia de 1 ano do fabricante das peças.',
    technicianObservations: 'Recomendamos agendamento prévio no início da manhã para menor impacto no salão de vendas.',
    status: 'Enviado',
    createdAt: '2026-09-02'
  },
  {
    id: 'orc-103',
    number: 'ORC-2026-103',
    clientId: 'cli-4',
    clientName: 'Eduardo Martins (Residencial)',
    clientPhone: '(11) 97331-9022',
    clientEmail: 'edu.martins@gmail.com',
    clientAddress: 'Rua Desembargador do Vale, 890 Apto 114 - Perdizes, São Paulo - SP',
    clientDocument: '298.112.348-11',
    equipmentDescription: 'Multi-Split Inverter Fujitsu 24.000 BTU',
    items: [
      {
        id: 'item-301',
        type: 'Serviço',
        description: 'Localização de microvazamento com contraste UV e pressurização com N2',
        quantity: 1,
        unit: 'serviço',
        unitPrice: 350.00,
        total: 350.00
      },
      {
        id: 'item-302',
        type: 'Serviço',
        description: 'Refazimento de flanges e vácuo profundo abaixo de 500 microns',
        quantity: 1,
        unit: 'serviço',
        unitPrice: 280.00,
        total: 280.00
      },
      {
        id: 'item-303',
        type: 'Peça / Material',
        description: 'Carga completa de fluido ecológico R-410A por balança de precisão',
        quantity: 1,
        unit: 'serviço',
        unitPrice: 380.00,
        total: 380.00
      }
    ],
    subtotal: 1010.00,
    discount: 30.00,
    total: 980.00,
    paymentTerms: 'PIX ou até 4x no cartão de crédito',
    validityDays: 15,
    warrantyTerms: 'Garantia de 90 dias de estanqueidade e funcionamento.',
    technicianObservations: 'Inclui aferição de superaquecimento e teste elétrico de compressor.',
    status: 'Rascunho',
    createdAt: '2026-09-02'
  }
];

export const initialMaintenanceLogs: MaintenanceLog[] = [
  {
    id: 'man-1',
    code: 'OS-2026-031',
    equipmentId: 'eq-1',
    equipmentName: 'Split Piso Teto Inverter Carrier 60.000 BTU (Padaria Pão Dourado)',
    clientId: 'cli-1',
    clientName: 'Padaria & Empório Pão Dourado Ltda',
    date: '2026-08-10',
    technicianName: 'Wellisson Medeiros',
    type: 'Preventiva',
    description: 'Manutenção preventiva periódica e limpeza do condensador a ar aletado e evaporador.',
    workPerformed: [
      'Lavagem química e escovação das aletas do condensador',
      'Verificação do isolamento térmico das linhas de sucção',
      'Aperto de bornes do quadro elétrico e comando de controle',
      'Limpeza da calha e desobstrução da linha de dreno de condensado',
      'Aferição das pressões de trabalho e temperatura de insuflamento (+12.5°C)'
    ],
    replacedParts: [],
    readings: {
      suctionPressurePsi: 118,
      dischargePressurePsi: 340,
      superheatC: 6.8,
      subcoolingC: 4.8,
      ambientTempC: 24,
      supplyAirTempC: 12.5,
      operatingCurrentAmp: 14.2,
      voltageV: 220,
      gasType: 'R-410A'
    },
    observations: 'Equipamento operando perfeitamente. Nível de ruído e delta T de 11.5°C dentro dos padrões de eficiência.',
    nextMaintenanceRecommendedDate: '2026-11-10',
    status: 'Concluído'
  },
  {
    id: 'man-2',
    code: 'OS-2026-024',
    equipmentId: 'eq-3',
    equipmentName: 'Split Inverter Daikin 12.000 BTU R-32 (Clínica Odonto)',
    clientId: 'cli-2',
    clientName: 'Dra. Camila Vasconcelos (Clínica Odonto)',
    date: '2026-07-20',
    technicianName: 'Carlos Silva',
    type: 'Higienização e PMOC',
    description: 'Higienização semestral antibacteriana e antifúngica de acordo com o plano PMOC.',
    workPerformed: [
      'Descontaminação da serpentina com produto homologado pela Anvisa',
      'Desinfecção dos filtros de ar e bandeja coletora de água',
      'Aplicação de pastilha bioestática no dreno contra limo',
      'Inspeção do rotor da turbina e rolamentos'
    ],
    replacedParts: [
      { name: 'Pastilha bactericida Air Guard para dreno', quantity: 2, unitPrice: 25.00 }
    ],
    readings: {
      suctionPressurePsi: 115,
      superheatC: 5.8,
      ambientTempC: 23,
      supplyAirTempC: 11.2,
      operatingCurrentAmp: 3.9,
      voltageV: 220,
      gasType: 'R-32'
    },
    observations: 'Delta T medido em 11.8°C (excelente rendimento térmico). Equipamento silencioso.',
    nextMaintenanceRecommendedDate: '2026-10-20',
    status: 'Concluído'
  }
];
