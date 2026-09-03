import React from 'react';
import {
  CalendarDays,
  FileText,
  Wrench,
  Users,
  LayoutDashboard,
  Building2,
  Download,
  PlusCircle
} from 'lucide-react';
import { CompanySettings } from '../types';

export type ActiveTab = 'dashboard' | 'visits' | 'quotes' | 'maintenance' | 'clients';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  companySettings: CompanySettings;
  onOpenCompanySettings: () => void;
  onNewVisit: () => void;
  onNewQuote: () => void;
  onExportBackup: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  companySettings,
  onOpenCompanySettings,
  onNewVisit,
  onNewQuote,
  onExportBackup
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800 shadow-md no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white shadow-sm ring-2 ring-sky-400/30">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                {/* Custom Snowflake + Thermometer refrigeration icon */}
                <path d="M12 2v20" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                <path d="m4.93 4.93 4.24 4.24" />
                <path d="m14.83 14.83 4.24 4.24" />
                <path d="m14.83 9.17 4.24-4.24" />
                <path d="m4.93 19.07 4.24-4.24" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white font-sans">
                  {companySettings.tradeName || 'Refrigera Certo'}
                </span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  Pro
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Climatização & Refrigeração
              </p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              id="nav-tab-dashboard"
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Painel</span>
            </button>

            <button
              id="nav-tab-visits"
              onClick={() => setActiveTab('visits')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'visits'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              <span>Visitas Técnicas</span>
            </button>

            <button
              id="nav-tab-quotes"
              onClick={() => setActiveTab('quotes')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'quotes'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Orçamentos</span>
            </button>

            <button
              id="nav-tab-maintenance"
              onClick={() => setActiveTab('maintenance')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'maintenance'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Wrench className="w-4 h-4" />
              <span>Manutenções & PMOC</span>
            </button>

            <button
              id="nav-tab-clients"
              onClick={() => setActiveTab('clients')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'clients'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Clientes & Máquinas</span>
            </button>
          </nav>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              id="btn-quick-new-visit"
              onClick={onNewVisit}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white transition-all shadow-sm"
              title="Agendar nova visita técnica"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Agendar Visita</span>
            </button>

            <button
              id="btn-quick-new-quote"
              onClick={onNewQuote}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 hover:border-sky-500/50 transition-all"
              title="Criar novo orçamento"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Emitir Orçamento</span>
            </button>

            <button
              id="btn-open-settings"
              onClick={onOpenCompanySettings}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Dados da Empresa Refrigera Certo"
            >
              <Building2 className="w-5 h-5" />
            </button>

            <button
              id="btn-backup"
              onClick={onExportBackup}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Baixar Backup dos Dados"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>

        </div>

        {/* Mobile Navigation Row */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-800 overflow-x-auto gap-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
              activeTab === 'dashboard' ? 'bg-sky-600 text-white' : 'text-slate-300'
            }`}
          >
            Painel
          </button>
          <button
            onClick={() => setActiveTab('visits')}
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
              activeTab === 'visits' ? 'bg-sky-600 text-white' : 'text-slate-300'
            }`}
          >
            Visitas
          </button>
          <button
            onClick={() => setActiveTab('quotes')}
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
              activeTab === 'quotes' ? 'bg-sky-600 text-white' : 'text-slate-300'
            }`}
          >
            Orçamentos
          </button>
          <button
            onClick={() => setActiveTab('maintenance')}
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
              activeTab === 'maintenance' ? 'bg-sky-600 text-white' : 'text-slate-300'
            }`}
          >
            Histórico
          </button>
          <button
            onClick={() => setActiveTab('clients')}
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
              activeTab === 'clients' ? 'bg-sky-600 text-white' : 'text-slate-300'
            }`}
          >
            Clientes
          </button>
        </div>
      </div>
    </header>
  );
};
