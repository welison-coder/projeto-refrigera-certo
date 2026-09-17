import {
  Client,
  Equipment,
  TechnicalVisit,
  Quote,
  MaintenanceLog,
  CompanySettings
} from '../types';
import {
  initialClients,
  initialEquipment,
  initialVisits,
  initialQuotes,
  initialMaintenanceLogs,
  initialCompanySettings
} from '../data/initialData';

const STORAGE_KEYS = {
  CLIENTS: 'ar_solucoes_clients',
  EQUIPMENT: 'ar_solucoes_equipment',
  VISITS: 'ar_solucoes_visits',
  QUOTES: 'ar_solucoes_quotes',
  MAINTENANCE_LOGS: 'ar_solucoes_maintenance',
  COMPANY_SETTINGS: 'ar_solucoes_company'
};

const LEGACY_STORAGE_KEYS = {
  CLIENTS: 'refrigera_certo_clients',
  EQUIPMENT: 'refrigera_certo_equipment',
  VISITS: 'refrigera_certo_visits',
  QUOTES: 'refrigera_certo_quotes',
  MAINTENANCE_LOGS: 'refrigera_certo_maintenance',
  COMPANY_SETTINGS: 'refrigera_certo_company'
};

function getStoredItem<T>(key: string, fallback: T): T {
  try {
    let item = localStorage.getItem(key);
    // Migração transparente de chaves legadas se existirem
    if (!item) {
      const legacyKey = Object.entries(STORAGE_KEYS).find(([, v]) => v === key)?.[0];
      if (legacyKey && LEGACY_STORAGE_KEYS[legacyKey as keyof typeof LEGACY_STORAGE_KEYS]) {
        const legacyVal = localStorage.getItem(LEGACY_STORAGE_KEYS[legacyKey as keyof typeof LEGACY_STORAGE_KEYS]);
        if (legacyVal) {
          item = legacyVal;
          localStorage.setItem(key, legacyVal);
          localStorage.removeItem(LEGACY_STORAGE_KEYS[legacyKey as keyof typeof LEGACY_STORAGE_KEYS]);
        }
      }
    }
    if (!item) return fallback;
    return JSON.parse(item);
  } catch (error) {
    console.error(`Erro ao carregar dados da chave ${key}:`, error);
    return fallback;
  }
}

function setStoredItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Erro ao salvar dados na chave ${key}:`, error);
  }
}

export const storage = {
  getClients: (): Client[] => {
    const clients = getStoredItem(STORAGE_KEYS.CLIENTS, initialClients);
    let modified = false;
    const updated = clients.map(c => {
      if (c.notes && c.notes.includes('câmaras frigoríficas')) {
        modified = true;
        return {
          ...c,
          notes: 'Contrato de manutenção preventiva e higienização periódica para condicionadores de ar.'
        };
      }
      return c;
    });
    if (modified) setStoredItem(STORAGE_KEYS.CLIENTS, updated);
    return updated;
  },
  saveClients: (clients: Client[]) => setStoredItem(STORAGE_KEYS.CLIENTS, clients),

  getEquipment: (): Equipment[] => {
    const equipment = getStoredItem(STORAGE_KEYS.EQUIPMENT, initialEquipment);
    let modified = false;
    const updated = equipment.map(eq => {
      let itemModified = false;
      let newEq = { ...eq };

      if (eq.type.includes('Câmara Fria') || eq.type.includes('Balcão Frigorífico')) {
        itemModified = true;
        const isFreezer = eq.type.includes('Congelados');
        newEq = {
          ...newEq,
          type: isFreezer ? 'Split Cassete Inverter' : 'Split Piso Teto Inverter',
          brand: isFreezer ? 'Daikin' : 'Carrier',
          model: isFreezer ? 'FCNQ48MV2L' : '42XQL060515LC',
          capacity: isFreezer ? '48.000 BTU' : '60.000 BTU',
          gasType: 'R-410A',
          locationDescription: isFreezer ? 'Setor de caixas e atendimento principal' : 'Salão de vendas e buffet de pães'
        };
      }

      // Populate sample photos from initial data if not yet present
      const initialMatch = initialEquipment.find(ie => ie.id === eq.id);
      if (initialMatch && (!newEq.labelPhotoUrl || !newEq.installationPhotoUrl)) {
        itemModified = true;
        newEq = {
          ...newEq,
          labelPhotoUrl: newEq.labelPhotoUrl || initialMatch.labelPhotoUrl,
          labelPhotoDate: newEq.labelPhotoDate || initialMatch.labelPhotoDate,
          installationPhotoUrl: newEq.installationPhotoUrl || initialMatch.installationPhotoUrl,
          installationPhotoDate: newEq.installationPhotoDate || initialMatch.installationPhotoDate,
          nominalCurrent: newEq.nominalCurrent || initialMatch.nominalCurrent,
          voltage: newEq.voltage || initialMatch.voltage
        };
      }

      if (itemModified) modified = true;
      return newEq;
    });
    if (modified) setStoredItem(STORAGE_KEYS.EQUIPMENT, updated);
    return updated;
  },
  saveEquipment: (equipment: Equipment[]) => setStoredItem(STORAGE_KEYS.EQUIPMENT, equipment),

  getVisits: (): TechnicalVisit[] => {
    const visits = getStoredItem(STORAGE_KEYS.VISITS, initialVisits);
    let modified = false;
    const updated = visits.map(v => {
      let visitMod = false;
      let newName = v.technicianName;
      let newReported = v.reportedIssue;
      let newServiceType = v.serviceType;

      if (v.technicianName === 'Marcos Vinícius Barbosa') {
        newName = 'Wellisson Medeiros';
        visitMod = true;
      }
      if (v.reportedIssue && v.reportedIssue.includes('degelo elétrico')) {
        newReported = 'Baixo rendimento térmico no salão de vendas e alarme no display da condensadora.';
        newServiceType = 'Diagnóstico Técnico & Rendimento';
        visitMod = true;
      }
      if (visitMod) {
        modified = true;
        return {
          ...v,
          technicianName: newName,
          reportedIssue: newReported,
          serviceType: newServiceType
        };
      }
      return v;
    });
    if (modified) setStoredItem(STORAGE_KEYS.VISITS, updated);
    return updated;
  },
  saveVisits: (visits: TechnicalVisit[]) => setStoredItem(STORAGE_KEYS.VISITS, visits),

  getQuotes: (): Quote[] => {
    const quotes = getStoredItem(STORAGE_KEYS.QUOTES, initialQuotes);
    let modified = false;
    const updated = quotes.map(q => {
      if (q.equipmentDescription && (q.equipmentDescription.includes('Câmara Fria') || q.equipmentDescription.includes('Balcão'))) {
        modified = true;
        return {
          ...q,
          equipmentDescription: 'Split Cassete Inverter Daikin 48.000 BTU - Setor de Caixas'
        };
      }
      return q;
    });
    if (modified) setStoredItem(STORAGE_KEYS.QUOTES, updated);
    return updated;
  },
  saveQuotes: (quotes: Quote[]) => setStoredItem(STORAGE_KEYS.QUOTES, quotes),

  getMaintenanceLogs: (): MaintenanceLog[] => {
    const logs = getStoredItem(STORAGE_KEYS.MAINTENANCE_LOGS, initialMaintenanceLogs);
    let modified = false;
    const updated = logs.map(l => {
      let logMod = false;
      let newTech = l.technicianName;
      let newEquipName = l.equipmentName;

      if (l.technicianName === 'Marcos Vinícius Barbosa') {
        newTech = 'Wellisson Medeiros';
        logMod = true;
      }
      if (l.equipmentName && (l.equipmentName.includes('Câmara Fria') || l.equipmentName.includes('Balcão'))) {
        newEquipName = 'Split Piso Teto Inverter Carrier 60.000 BTU (Padaria Pão Dourado)';
        logMod = true;
      }
      if (logMod) {
        modified = true;
        return {
          ...l,
          technicianName: newTech,
          equipmentName: newEquipName
        };
      }
      return l;
    });
    if (modified) setStoredItem(STORAGE_KEYS.MAINTENANCE_LOGS, updated);
    return updated;
  },
  saveMaintenanceLogs: (logs: MaintenanceLog[]) => setStoredItem(STORAGE_KEYS.MAINTENANCE_LOGS, logs),

  getCompanySettings: (): CompanySettings => {
    const settings = getStoredItem(STORAGE_KEYS.COMPANY_SETTINGS, initialCompanySettings);
    if (settings) {
      let changed = false;
      if (settings.technicianResponsible === 'Marcos Vinícius Barbosa' || !settings.technicianResponsible) {
        settings.technicianResponsible = 'Wellisson Medeiros';
        changed = true;
      }
      if (settings.technicalRegistration) {
        delete settings.technicalRegistration;
        changed = true;
      }
      if (!settings.cnpj || settings.cnpj === '45.892.114/0001-92') {
        settings.cnpj = '60.768.974/0001-41';
        changed = true;
      }
      if (!settings.address || settings.address.includes('Rua Barão de Jundiaí')) {
        settings.address = '710 Asa Norte, Brasília - DF';
        changed = true;
      }
      if (settings.pixKey === '45.892.114/0001-92') {
        settings.pixKey = '60.768.974/0001-41';
        changed = true;
      }
      if (!settings.foundingYear || settings.foundingYear !== 2013) {
        settings.foundingYear = 2013;
        changed = true;
      }
      if (settings.companyName && (settings.companyName.includes('Refrigera Certo') || settings.companyName.includes('Refrigeração'))) {
        settings.companyName = 'Ar Soluções - Climatização Especializada';
        settings.tradeName = 'Ar Soluções Climatização';
        changed = true;
      }
      if (!settings.phone || settings.phone.includes('98451-2290')) {
        settings.phone = '(61) 992848993';
        changed = true;
      }
      if (!settings.email || settings.email.includes('refrigeracerto') || settings.email === 'atendimento@arsolucoes.com.br') {
        settings.email = 'arsolucoesdf@gmail.com';
        changed = true;
      }
      if (changed) {
        setStoredItem(STORAGE_KEYS.COMPANY_SETTINGS, settings);
      }
    }
    return settings;
  },
  saveCompanySettings: (settings: CompanySettings) => setStoredItem(STORAGE_KEYS.COMPANY_SETTINGS, settings),

  resetToDefault: () => {
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
    Object.values(LEGACY_STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
  },

  exportAllData: () => {
    const data = {
      system: 'Ar Soluções',
      foundingYear: 2013,
      clients: storage.getClients(),
      equipment: storage.getEquipment(),
      visits: storage.getVisits(),
      quotes: storage.getQuotes(),
      maintenanceLogs: storage.getMaintenanceLogs(),
      companySettings: storage.getCompanySettings(),
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ar-solucoes-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  validateBackup: (content: string): {
    isValid: boolean;
    errorMessage?: string;
    stats?: {
      clientsCount: number;
      equipmentCount: number;
      visitsCount: number;
      quotesCount: number;
      maintenanceLogsCount: number;
      companyName?: string;
      foundingYear?: number;
      hasLogo?: boolean;
      exportedAt?: string;
    };
    parsedData?: any;
  } => {
    try {
      if (!content || typeof content !== 'string') {
        return { isValid: false, errorMessage: 'Arquivo vazio ou formato inválido.' };
      }
      const raw = JSON.parse(content);
      const parsed = raw.data && typeof raw.data === 'object' ? raw.data : raw;

      const hasClients = Array.isArray(parsed.clients);
      const hasEquipment = Array.isArray(parsed.equipment);
      const hasVisits = Array.isArray(parsed.visits);
      const hasQuotes = Array.isArray(parsed.quotes);
      const hasLogs = Array.isArray(parsed.maintenanceLogs);
      const hasCompany = Boolean(parsed.companySettings && typeof parsed.companySettings === 'object');

      if (!hasClients && !hasEquipment && !hasVisits && !hasQuotes && !hasLogs && !hasCompany) {
        return {
          isValid: false,
          errorMessage: 'O arquivo JSON selecionado não contém dados de backup válidos do Ar Soluções.'
        };
      }

      return {
        isValid: true,
        stats: {
          clientsCount: hasClients ? parsed.clients.length : 0,
          equipmentCount: hasEquipment ? parsed.equipment.length : 0,
          visitsCount: hasVisits ? parsed.visits.length : 0,
          quotesCount: hasQuotes ? parsed.quotes.length : 0,
          maintenanceLogsCount: hasLogs ? parsed.maintenanceLogs.length : 0,
          companyName: parsed.companySettings?.tradeName || parsed.companySettings?.companyName || 'Ar Soluções Climatização',
          foundingYear: parsed.companySettings?.foundingYear || 2013,
          hasLogo: Boolean(parsed.companySettings?.logoUrl),
          exportedAt: parsed.exportedAt || undefined
        },
        parsedData: parsed
      };
    } catch {
      return {
        isValid: false,
        errorMessage: 'Não foi possível interpretar o arquivo. Certifique-se de que é um arquivo .json íntegro.'
      };
    }
  },

  importData: (jsonData: string | any): boolean => {
    try {
      let parsed: any;
      if (typeof jsonData === 'string') {
        const raw = JSON.parse(jsonData);
        parsed = raw.data && typeof raw.data === 'object' ? raw.data : raw;
      } else {
        parsed = jsonData.data && typeof jsonData.data === 'object' ? jsonData.data : jsonData;
      }

      if (!parsed || typeof parsed !== 'object') {
        return false;
      }

      if (Array.isArray(parsed.clients)) {
        storage.saveClients(parsed.clients);
      }
      if (Array.isArray(parsed.equipment)) {
        storage.saveEquipment(parsed.equipment);
      }
      if (Array.isArray(parsed.visits)) {
        storage.saveVisits(parsed.visits);
      }
      if (Array.isArray(parsed.quotes)) {
        storage.saveQuotes(parsed.quotes);
      }
      if (Array.isArray(parsed.maintenanceLogs)) {
        storage.saveMaintenanceLogs(parsed.maintenanceLogs);
      }
      if (parsed.companySettings && typeof parsed.companySettings === 'object') {
        const settings = { ...parsed.companySettings };
        if (settings.companyName && (settings.companyName.includes('Refrigera Certo') || settings.companyName.includes('Refrigeração'))) {
          settings.companyName = 'Ar Soluções - Climatização Especializada';
          settings.tradeName = 'Ar Soluções Climatização';
        }
        if (!settings.foundingYear || settings.foundingYear !== 2013) {
          settings.foundingYear = 2013;
        }
        if (!settings.email || settings.email.includes('refrigeracerto')) {
          settings.email = 'arsolucoesdf@gmail.com';
        }
        storage.saveCompanySettings(settings);
      }
      return true;
    } catch (e) {
      console.error('Erro ao importar backup:', e);
      return false;
    }
  }
};
