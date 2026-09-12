import React, { useState, useEffect, useRef } from 'react';
import {
  Client,
  Equipment,
  TechnicalVisit,
  Quote,
  MaintenanceLog,
  CompanySettings
} from './types';
import { storage } from './utils/storage';
import { syncService } from './services/syncService';
import { Navbar, ActiveTab } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { VisitsView } from './components/VisitsView';
import { QuotesView } from './components/QuotesView';
import { MaintenanceHistoryView } from './components/MaintenanceHistoryView';
import { ClientsEquipmentView } from './components/ClientsEquipmentView';
import { CompanyModal } from './components/CompanyModal';
import { ReminderModal } from './components/ReminderModal';
import { BrandLogo } from './components/BrandLogo';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function MainApp() {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Core state from storage
  const [clients, setClients] = useState<Client[]>(() => storage.getClients());
  const [equipment, setEquipment] = useState<Equipment[]>(() => storage.getEquipment());
  const [visits, setVisits] = useState<TechnicalVisit[]>(() => storage.getVisits());
  const [quotes, setQuotes] = useState<Quote[]>(() => storage.getQuotes());
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>(() => storage.getMaintenanceLogs());
  const [companySettings, setCompanySettings] = useState<CompanySettings>(() => storage.getCompanySettings());

  // Company settings modal
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState<boolean>(false);

  // Reminder modal state
  const [reminderModalData, setReminderModalData] = useState<{ visit: TechnicalVisit; autoTriggered?: boolean } | null>(null);

  // Cross-view selection state
  const [selectedQuoteForPreview, setSelectedQuoteForPreview] = useState<Quote | null>(null);
  const [selectedEquipmentForMaintenance, setSelectedEquipmentForMaintenance] = useState<string | undefined>(undefined);

  // Synchronization references
  const isInitialMount = useRef(true);
  const isSyncingFromRemote = useRef(false);

  // 1. Initial Cloud Sync and Remote Event Listener
  useEffect(() => {
    syncService.initializeSync({
      clients,
      equipment,
      visits,
      quotes,
      maintenanceLogs,
      companySettings,
    }).then(merged => {
      if (merged) {
        isSyncingFromRemote.current = true;
        setClients(merged.clients);
        setEquipment(merged.equipment);
        setVisits(merged.visits);
        setQuotes(merged.quotes);
        setMaintenanceLogs(merged.maintenanceLogs);
        if (merged.companySettings) {
          setCompanySettings(merged.companySettings);
        }
        setTimeout(() => {
          isSyncingFromRemote.current = false;
        }, 150);
      }
    });

    // Subscribe to real-time updates broadcast from other devices
    const unsubscribe = syncService.subscribeRemoteUpdates((remote) => {
      isSyncingFromRemote.current = true;
      setClients(remote.clients);
      setEquipment(remote.equipment);
      setVisits(remote.visits);
      setQuotes(remote.quotes);
      setMaintenanceLogs(remote.maintenanceLogs);
      if (remote.companySettings) {
        setCompanySettings(remote.companySettings);
      }
      setTimeout(() => {
        isSyncingFromRemote.current = false;
      }, 150);
    });

    return () => unsubscribe();
  }, []);

  // Sync to localStorage
  useEffect(() => {
    storage.saveClients(clients);
  }, [clients]);

  useEffect(() => {
    storage.saveEquipment(equipment);
  }, [equipment]);

  useEffect(() => {
    storage.saveVisits(visits);
  }, [visits]);

  useEffect(() => {
    storage.saveQuotes(quotes);
  }, [quotes]);

  useEffect(() => {
    storage.saveMaintenanceLogs(maintenanceLogs);
  }, [maintenanceLogs]);

  useEffect(() => {
    storage.saveCompanySettings(companySettings);
  }, [companySettings]);

  // 2. Automatically save any change to the cloud for all devices (No export needed!)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (isSyncingFromRemote.current) {
      return;
    }

    syncService.queuePush({
      clients,
      equipment,
      visits,
      quotes,
      maintenanceLogs,
      companySettings,
    });
  }, [clients, equipment, visits, quotes, maintenanceLogs, companySettings]);

  // Reload all data
  const handleReloadAllData = () => {
    setClients(storage.getClients());
    setEquipment(storage.getEquipment());
    setVisits(storage.getVisits());
    setQuotes(storage.getQuotes());
    setMaintenanceLogs(storage.getMaintenanceLogs());
    setCompanySettings(storage.getCompanySettings());
  };

  // Visit handlers
  const handleSaveVisit = (visit: TechnicalVisit) => {
    setVisits(prev => {
      const idx = prev.findIndex(v => v.id === visit.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = visit;
        return updated;
      }
      return [visit, ...prev];
    });
  };

  const handleDeleteVisit = (visitId: string) => {
    setVisits(prev => prev.filter(v => v.id !== visitId));
  };

  const handleQuickUpdateVisitStatus = (visitId: string, status: TechnicalVisit['status']) => {
    setVisits(prev =>
      prev.map(v => (v.id === visitId ? { ...v, status } : v))
    );
  };

  // Quote handlers
  const handleSaveQuote = (quote: Quote) => {
    setQuotes(prev => {
      const idx = prev.findIndex(q => q.id === quote.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = quote;
        return updated;
      }
      return [quote, ...prev];
    });
  };

  const handleDeleteQuote = (quoteId: string) => {
    setQuotes(prev => prev.filter(q => q.id !== quoteId));
  };

  // Maintenance handlers
  const handleSaveLog = (log: MaintenanceLog) => {
    setMaintenanceLogs(prev => {
      const idx = prev.findIndex(l => l.id === log.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = log;
        return updated;
      }
      return [log, ...prev];
    });

    // Update equipment last maintenance date & next maintenance date
    setEquipment(prev =>
      prev.map(eq => {
        if (eq.id === log.equipmentId) {
          return {
            ...eq,
            lastMaintenanceDate: log.date,
            nextMaintenanceDate: log.nextMaintenanceRecommendedDate || eq.nextMaintenanceDate,
            status: 'Operando Normal'
          };
        }
        return eq;
      })
    );
  };

  const handleDeleteLog = (logId: string) => {
    setMaintenanceLogs(prev => prev.filter(l => l.id !== logId));
  };

  // Client handlers
  const handleSaveClient = (client: Client) => {
    setClients(prev => {
      const idx = prev.findIndex(c => c.id === client.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = client;
        return updated;
      }
      return [client, ...prev];
    });
  };

  const handleDeleteClient = (clientId: string) => {
    setClients(prev => prev.filter(c => c.id !== clientId));
    setEquipment(prev => prev.filter(eq => eq.clientId !== clientId));
  };

  // Equipment handlers
  const handleSaveEquipment = (equip: Equipment) => {
    setEquipment(prev => {
      const idx = prev.findIndex(e => e.id === equip.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = equip;
        return updated;
      }
      return [equip, ...prev];
    });
  };

  const handleDeleteEquipment = (equipmentId: string) => {
    setEquipment(prev => prev.filter(e => e.id !== equipmentId));
  };

  // Cross flow navigation actions
  const handleOpenVisitDetails = (_visit: TechnicalVisit) => {
    setActiveTab('visits');
  };

  const handleOpenQuoteDetails = (quote: Quote) => {
    setSelectedQuoteForPreview(quote);
    setActiveTab('quotes');
  };

  const handleCreateQuoteFromVisit = (visit: TechnicalVisit) => {
    setActiveTab('quotes');
  };

  const handleCreateMaintenanceFromVisit = (visit: TechnicalVisit) => {
    const equip = equipment.find(e => (visit.equipmentIds && visit.equipmentIds.includes(e.id)) || e.clientId === visit.clientId);
    if (equip) {
      setSelectedEquipmentForMaintenance(equip.id);
    }
    setActiveTab('maintenance');
  };

  const handleScheduleVisitForClient = (client: Client, equipmentId?: string) => {
    setActiveTab('visits');
  };

  const handleNewQuoteForClient = (client: Client) => {
    setActiveTab('quotes');
  };

  const handleViewEquipmentHistory = (equipmentId: string) => {
    setSelectedEquipmentForMaintenance(equipmentId);
    setActiveTab('maintenance');
  };

  const handleScheduleVisitFromQuote = (quote: Quote) => {
    const newVisit: TechnicalVisit = {
      id: `vis-${Date.now()}`,
      code: `VIS-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      clientId: quote.clientId,
      clientName: quote.clientName,
      clientPhone: quote.clientPhone,
      clientAddress: quote.clientAddress,
      equipmentIds: [],
      date: new Date().toISOString().slice(0, 10),
      timeWindow: '08:30 - 10:30',
      technicianName: companySettings.technicianResponsible || 'Wellisson Medeiros',
      serviceType: 'Execução de Orçamento Aprovado',
      reportedIssue: `Execução dos itens do orçamento ${quote.number} (${quote.equipmentDescription})`,
      status: 'Agendada',
      quoteId: quote.id
    };
    handleSaveVisit(newVisit);
    setReminderModalData({ visit: newVisit, autoTriggered: true });
    setActiveTab('visits');
  };

  const handleOpenReminderModal = (visit: TechnicalVisit, autoTriggered: boolean = false) => {
    setReminderModalData({ visit, autoTriggered });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-sky-500 selection:text-white">
      
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        companySettings={companySettings}
        onOpenCompanySettings={() => setIsCompanyModalOpen(true)}
        onNewVisit={() => setActiveTab('visits')}
        onNewQuote={() => setActiveTab('quotes')}
        onExportBackup={() => storage.exportAllData()}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            visits={visits}
            quotes={quotes}
            equipment={equipment}
            maintenanceLogs={maintenanceLogs}
            companySettings={companySettings}
            onNavigate={setActiveTab}
            onScheduleVisit={() => setActiveTab('visits')}
            onNewQuote={() => setActiveTab('quotes')}
            onOpenQuoteDetails={handleOpenQuoteDetails}
            onOpenVisitDetails={handleOpenVisitDetails}
            onQuickUpdateVisitStatus={handleQuickUpdateVisitStatus}
            onOpenReminderModal={handleOpenReminderModal}
          />
        )}

        {activeTab === 'visits' && (
          <VisitsView
            visits={visits}
            clients={clients}
            equipment={equipment}
            companySettings={companySettings}
            onSaveVisit={handleSaveVisit}
            onDeleteVisit={handleDeleteVisit}
            onOpenCreateQuoteFromVisit={handleCreateQuoteFromVisit}
            onOpenCreateMaintenanceFromVisit={handleCreateMaintenanceFromVisit}
            onOpenReminderModal={handleOpenReminderModal}
          />
        )}

        {activeTab === 'quotes' && (
          <QuotesView
            quotes={quotes}
            clients={clients}
            companySettings={companySettings}
            onSaveQuote={handleSaveQuote}
            onDeleteQuote={handleDeleteQuote}
            onScheduleVisitFromQuote={handleScheduleVisitFromQuote}
            initialSelectedQuote={selectedQuoteForPreview}
          />
        )}

        {activeTab === 'maintenance' && (
          <MaintenanceHistoryView
            maintenanceLogs={maintenanceLogs}
            equipment={equipment}
            clients={clients}
            companySettings={companySettings}
            onSaveLog={handleSaveLog}
            onDeleteLog={handleDeleteLog}
            selectedEquipmentId={selectedEquipmentForMaintenance}
          />
        )}

        {activeTab === 'clients' && (
          <ClientsEquipmentView
            clients={clients}
            equipment={equipment}
            onSaveClient={handleSaveClient}
            onDeleteClient={handleDeleteClient}
            onSaveEquipment={handleSaveEquipment}
            onDeleteEquipment={handleDeleteEquipment}
            onScheduleVisitForClient={handleScheduleVisitForClient}
            onNewQuoteForClient={handleNewQuoteForClient}
            onViewEquipmentHistory={handleViewEquipmentHistory}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="no-print border-t border-slate-200 bg-white py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <BrandLogo size="xs" theme="light" />
            <span className="text-slate-300 hidden sm:inline">•</span>
            <p>
              © {new Date().getFullYear()} <strong>{companySettings.tradeName || 'Refrigera Certo'}</strong> — Climatização Especializada
            </p>
          </div>
          <p className="text-[11px] text-slate-400">
            Responsável Técnico: <strong className="text-slate-600">{companySettings.technicianResponsible}</strong>
          </p>
        </div>
      </footer>

      {/* Company Settings and Backup Modal */}
      <CompanyModal
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
        companySettings={companySettings}
        onSaveCompanySettings={setCompanySettings}
        onReloadAllData={handleReloadAllData}
      />

      {/* Mobile Reminder & Calendar Integration Modal */}
      <ReminderModal
        isOpen={Boolean(reminderModalData)}
        onClose={() => setReminderModalData(null)}
        visit={reminderModalData?.visit || null}
        companySettings={companySettings}
        autoTriggered={reminderModalData?.autoTriggered}
      />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

