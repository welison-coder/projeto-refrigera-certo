import React from 'react';
import {
  CalendarDays,
  FileText,
  Wrench,
  Users,
  LayoutDashboard,
  Building2,
  Download,
  PlusCircle,
  LogOut,
  UserCheck
} from 'lucide-react';
import { CompanySettings } from '../types';
import { BrandLogo } from './BrandLogo';
import { useAuth } from '../contexts/AuthContext';

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
  const { userProfile, currentUser, logout } = useAuth();

  const displayName = userProfile?.name || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Técnico';
  const displayRole = userProfile?.role === 'admin' ? 'Administrador' : 'Técnico';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('') || 'TC';

  return (
    <header className="sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800 shadow-md no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Official Logo & Brand */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setActiveTab('dashboard')}
            title="Ir para o Painel Principal - Refrigera Certo"
          >
            <div className="bg-white px-3 py-1.5 rounded-xl shadow-xs border border-white/20 flex items-center gap-2 group-hover:bg-sky-50 transition-colors">
              <BrandLogo size="sm" theme="light" />
              <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-200 hidden sm:inline-block">
                Pro
              </span>
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

            {/* User Profile & Logout */}
            <div className="h-6 w-px bg-slate-800 mx-1 hidden sm:block" />

            <div className="flex items-center gap-2 pl-1">
              <div
                className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-800/80 border border-slate-700/60"
                title={`${displayName} - ${displayRole}`}
              >
                <div className="w-7 h-7 rounded-lg bg-sky-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                  {initials}
                </div>
                <div className="hidden xl:block text-left leading-tight">
                  <p className="text-xs font-semibold text-slate-200 max-w-[120px] truncate">
                    {displayName}
                  </p>
                  <p className="text-[10px] text-sky-400 font-medium">
                    {displayRole}
                  </p>
                </div>
              </div>

              <button
                id="btn-logout"
                onClick={() => logout()}
                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                title="Sair do Sistema (Logout)"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
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
          <button
            onClick={() => logout()}
            className="px-2.5 py-1.5 rounded-md text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-slate-800 whitespace-nowrap flex items-center gap-1 cursor-pointer"
            title="Sair do Sistema"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
};
