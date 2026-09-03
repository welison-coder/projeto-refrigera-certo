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
  CLIENTS: 'refrigera_certo_clients',
  EQUIPMENT: 'refrigera_certo_equipment',
  VISITS: 'refrigera_certo_visits',
  QUOTES: 'refrigera_certo_quotes',
  MAINTENANCE_LOGS: 'refrigera_certo_maintenance',
  COMPANY_SETTINGS: 'refrigera_certo_company'
};

function getStoredItem<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
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
  getClients: (): Client[] => getStoredItem(STORAGE_KEYS.CLIENTS, initialClients),
  saveClients: (clients: Client[]) => setStoredItem(STORAGE_KEYS.CLIENTS, clients),

  getEquipment: (): Equipment[] => getStoredItem(STORAGE_KEYS.EQUIPMENT, initialEquipment),
  saveEquipment: (equipment: Equipment[]) => setStoredItem(STORAGE_KEYS.EQUIPMENT, equipment),

  getVisits: (): TechnicalVisit[] => getStoredItem(STORAGE_KEYS.VISITS, initialVisits),
  saveVisits: (visits: TechnicalVisit[]) => setStoredItem(STORAGE_KEYS.VISITS, visits),

  getQuotes: (): Quote[] => getStoredItem(STORAGE_KEYS.QUOTES, initialQuotes),
  saveQuotes: (quotes: Quote[]) => setStoredItem(STORAGE_KEYS.QUOTES, quotes),

  getMaintenanceLogs: (): MaintenanceLog[] => getStoredItem(STORAGE_KEYS.MAINTENANCE_LOGS, initialMaintenanceLogs),
  saveMaintenanceLogs: (logs: MaintenanceLog[]) => setStoredItem(STORAGE_KEYS.MAINTENANCE_LOGS, logs),

  getCompanySettings: (): CompanySettings => getStoredItem(STORAGE_KEYS.COMPANY_SETTINGS, initialCompanySettings),
  saveCompanySettings: (settings: CompanySettings) => setStoredItem(STORAGE_KEYS.COMPANY_SETTINGS, settings),

  resetToDefault: () => {
    localStorage.removeItem(STORAGE_KEYS.CLIENTS);
    localStorage.removeItem(STORAGE_KEYS.EQUIPMENT);
    localStorage.removeItem(STORAGE_KEYS.VISITS);
    localStorage.removeItem(STORAGE_KEYS.QUOTES);
    localStorage.removeItem(STORAGE_KEYS.MAINTENANCE_LOGS);
    localStorage.removeItem(STORAGE_KEYS.COMPANY_SETTINGS);
  },

  exportAllData: () => {
    const data = {
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
    a.download = `refrigera-certo-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importData: (jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.clients) storage.saveClients(parsed.clients);
      if (parsed.equipment) storage.saveEquipment(parsed.equipment);
      if (parsed.visits) storage.saveVisits(parsed.visits);
      if (parsed.quotes) storage.saveQuotes(parsed.quotes);
      if (parsed.maintenanceLogs) storage.saveMaintenanceLogs(parsed.maintenanceLogs);
      if (parsed.companySettings) storage.saveCompanySettings(parsed.companySettings);
      return true;
    } catch (e) {
      console.error('Erro ao importar backup:', e);
      return false;
    }
  }
};
