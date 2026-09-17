import React, { useState, useRef, useEffect } from 'react';
import {
  CalendarDays,
  FileText,
  Wrench,
  Users,
  LayoutDashboard,
  Building2,
  Download,
  Upload,
  PlusCircle,
  ShieldCheck,
  ChevronDown,
  Tag,
  Plus,
  LogOut,
  Sparkles,
  Cloud,
  CheckCircle2,
  Briefcase
} from 'lucide-react';
import { CompanySettings } from '../types';
import { BrandLogo } from './BrandLogo';
import { useAuth } from '../contexts/AuthContext';
import { SyncIndicator } from './SyncIndicator';

export type ActiveTab = 'dashboard' | 'visits' | 'quotes' | 'maintenance' | 'clients';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  companySettings: CompanySettings;
  onOpenCompanySettings: () => void;
  onNewVisit: () => void;
  onNewQuote: () => void;
  onExportBackup: () => void;
  onImportBackup: () => void;
  onNavigateToEquipment?: () => void;
  onNavigateToClients?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  companySettings,
  onOpenCompanySettings,
  onNewVisit,
  onNewQuote,
  onExportBackup,
  onImportBackup,
  onNavigateToEquipment,
  onNavigateToClients
}) => {
  const { userProfile, logout } = useAuth();
  const [openDropdown, setOpenDropdown] = useState<'atendimentos' | 'cadastros' | 'gestao' | 'novo' | 'user' | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  const displayName = userProfile?.name || 'Administrador';
  const displayEmail = userProfile?.email || 'admin@arsolucoes.com.br';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('') || 'AR';

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const toggleDropdown = (menu: 'atendimentos' | 'cadastros' | 'gestao' | 'novo' | 'user') => {
    setOpenDropdown((prev) => (prev === menu ? null : menu));
  };

  const closeMenu = () => setOpenDropdown(null);

  const isAtendimentosActive = ['visits', 'quotes', 'maintenance'].includes(activeTab);
  const isCadastrosActive = activeTab === 'clients';

  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800/90 shadow-md no-print" ref={navRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo oficial da marca - Proporção e tamanho preservados */}
          <div
            className="flex items-center cursor-pointer group shrink-0"
            onClick={() => {
              setActiveTab('dashboard');
              closeMenu();
            }}
            title="Ar Soluções Climatização - Ir para o Painel Principal"
          >
            <div className="bg-white px-3 py-1.5 rounded-xl shadow-xs border border-white/25 flex items-center group-hover:bg-slate-50 transition-all duration-200">
              <BrandLogo size="sm" />
            </div>
          </div>

          {/* Menus e Submenus Principais para Computador */}
          <nav className="hidden lg:flex items-center gap-1.5 text-sm">
            
            {/* 1. Painel Direto */}
            <button
              id="nav-tab-dashboard"
              onClick={() => {
                setActiveTab('dashboard');
                closeMenu();
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Painel</span>
            </button>

            {/* 2. Menu Atendimentos & Serviços com Submenu */}
            <div className="relative">
              <button
                id="menu-btn-atendimentos"
                type="button"
                onClick={() => toggleDropdown('atendimentos')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-all ${
                  isAtendimentosActive || openDropdown === 'atendimentos'
                    ? 'bg-sky-600/90 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
                aria-expanded={openDropdown === 'atendimentos'}
              >
                <CalendarDays className="w-4 h-4 text-sky-400" />
                <span>Atendimentos</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 opacity-70 transition-transform duration-200 ${
                    openDropdown === 'atendimentos' ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Submenu de Atendimentos */}
              {openDropdown === 'atendimentos' && (
                <div className="absolute left-0 mt-2 w-72 bg-slate-850 bg-slate-900 border border-slate-750 border-slate-700/80 rounded-xl shadow-2xl p-1.5 z-50 backdrop-blur-md animate-in fade-in-50 slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    Serviços & Operações
                  </div>

                  <button
                    id="submenu-visitas"
                    onClick={() => {
                      setActiveTab('visits');
                      closeMenu();
                    }}
                    className={`w-full flex items-start gap-3 p-2.5 rounded-lg text-left transition-colors ${
                      activeTab === 'visits' ? 'bg-sky-600 text-white' : 'hover:bg-slate-800 text-slate-200'
                    }`}
                  >
                    <div className="p-1.5 rounded-md bg-sky-500/20 text-sky-400 mt-0.5">
                      <CalendarDays className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-xs">Visitas Técnicas</div>
                      <div className="text-[11px] text-slate-400 leading-tight">Agenda, rotas no mapa e status</div>
                    </div>
                  </button>

                  <button
                    id="submenu-orcamentos"
                    onClick={() => {
                      setActiveTab('quotes');
                      closeMenu();
                    }}
                    className={`w-full flex items-start gap-3 p-2.5 rounded-lg text-left transition-colors ${
                      activeTab === 'quotes' ? 'bg-sky-600 text-white' : 'hover:bg-slate-800 text-slate-200'
                    }`}
                  >
                    <div className="p-1.5 rounded-md bg-emerald-500/20 text-emerald-400 mt-0.5">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-xs">Orçamentos & Propostas</div>
                      <div className="text-[11px] text-slate-400 leading-tight">Valores, itens e aprovações</div>
                    </div>
                  </button>

                  <button
                    id="submenu-manutencoes"
                    onClick={() => {
                      setActiveTab('maintenance');
                      closeMenu();
                    }}
                    className={`w-full flex items-start gap-3 p-2.5 rounded-lg text-left transition-colors ${
                      activeTab === 'maintenance' ? 'bg-sky-600 text-white' : 'hover:bg-slate-800 text-slate-200'
                    }`}
                  >
                    <div className="p-1.5 rounded-md bg-amber-500/20 text-amber-400 mt-0.5">
                      <Wrench className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-xs">Manutenções & PMOC</div>
                      <div className="text-[11px] text-slate-400 leading-tight">Histórico, OS e laudos técnicos</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* 3. Menu Cadastros com Submenu */}
            <div className="relative">
              <button
                id="menu-btn-cadastros"
                type="button"
                onClick={() => toggleDropdown('cadastros')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-all ${
                  isCadastrosActive || openDropdown === 'cadastros'
                    ? 'bg-sky-600/90 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
                aria-expanded={openDropdown === 'cadastros'}
              >
                <Users className="w-4 h-4 text-cyan-400" />
                <span>Cadastros</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 opacity-70 transition-transform duration-200 ${
                    openDropdown === 'cadastros' ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Submenu de Cadastros */}
              {openDropdown === 'cadastros' && (
                <div className="absolute left-0 mt-2 w-72 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl p-1.5 z-50 backdrop-blur-md animate-in fade-in-50 slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    Base de Ativos
                  </div>

                  <button
                    id="submenu-clientes"
                    onClick={() => {
                      if (onNavigateToClients) {
                        onNavigateToClients();
                      } else {
                        setActiveTab('clients');
                      }
                      closeMenu();
                    }}
                    className="w-full flex items-start gap-3 p-2.5 rounded-lg text-left hover:bg-slate-800 text-slate-200 transition-colors"
                  >
                    <div className="p-1.5 rounded-md bg-cyan-500/20 text-cyan-400 mt-0.5">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-xs">Clientes</div>
                      <div className="text-[11px] text-slate-400 leading-tight">Contatos, endereços e rotas</div>
                    </div>
                  </button>

                  <button
                    id="submenu-equipamentos"
                    onClick={() => {
                      if (onNavigateToEquipment) {
                        onNavigateToEquipment();
                      } else {
                        setActiveTab('clients');
                      }
                      closeMenu();
                    }}
                    className="w-full flex items-start gap-3 p-2.5 rounded-lg text-left hover:bg-slate-800 text-slate-200 transition-colors"
                  >
                    <div className="p-1.5 rounded-md bg-indigo-500/20 text-indigo-400 mt-0.5">
                      <Tag className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-xs">Equipamentos & Máquinas</div>
                      <div className="text-[11px] text-slate-400 leading-tight">Fotos de placas, tipo de gás e BTUs</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* 4. Menu Gestão com Submenu */}
            <div className="relative">
              <button
                id="menu-btn-gestao"
                type="button"
                onClick={() => toggleDropdown('gestao')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-all ${
                  openDropdown === 'gestao'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
                aria-expanded={openDropdown === 'gestao'}
              >
                <Briefcase className="w-4 h-4 text-emerald-400" />
                <span>Gestão</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 opacity-70 transition-transform duration-200 ${
                    openDropdown === 'gestao' ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Submenu de Gestão */}
              {openDropdown === 'gestao' && (
                <div className="absolute left-0 mt-2 w-72 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl p-1.5 z-50 backdrop-blur-md animate-in fade-in-50 slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    Administração do Sistema
                  </div>

                  <button
                    id="submenu-empresa"
                    onClick={() => {
                      onOpenCompanySettings();
                      closeMenu();
                    }}
                    className="w-full flex items-start gap-3 p-2.5 rounded-lg text-left hover:bg-slate-800 text-slate-200 transition-colors"
                  >
                    <div className="p-1.5 rounded-md bg-slate-700/50 text-slate-300 mt-0.5">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-xs">Dados da Empresa</div>
                      <div className="text-[11px] text-slate-400 leading-tight">CNPJ, logo oficial e técnico</div>
                    </div>
                  </button>

                  <button
                    id="submenu-backup"
                    onClick={() => {
                      onExportBackup();
                      closeMenu();
                    }}
                    className="w-full flex items-start gap-3 p-2.5 rounded-lg text-left hover:bg-slate-800 text-slate-200 transition-colors"
                  >
                    <div className="p-1.5 rounded-md bg-emerald-500/20 text-emerald-400 mt-0.5">
                      <Download className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs">Exportar Backup</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                          18h Auto
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 leading-tight">Cópia em JSON • Baixa todo dia às 18h</div>
                    </div>
                  </button>

                  <button
                    id="submenu-import-backup"
                    onClick={() => {
                      onImportBackup();
                      closeMenu();
                    }}
                    className="w-full flex items-start gap-3 p-2.5 rounded-lg text-left hover:bg-slate-800 text-slate-200 transition-colors"
                  >
                    <div className="p-1.5 rounded-md bg-sky-500/20 text-sky-400 mt-0.5">
                      <Upload className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-xs">Importar Backup</div>
                      <div className="text-[11px] text-slate-400 leading-tight">Restaurar dados de arquivo JSON</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </nav>

          {/* Lado Direito: Ações Diretas, Voz, Nuvem e Perfil */}
          <div className="flex items-center gap-2.5">
            
            {/* Submenu de Ação Rápida "+ Novo" */}
            <div className="relative hidden md:block">
              <button
                id="btn-quick-create"
                type="button"
                onClick={() => toggleDropdown('novo')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white transition-all shadow-xs"
                title="Cadastrar rapidamente"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Criar</span>
                <ChevronDown className="w-3 h-3 opacity-80" />
              </button>

              {openDropdown === 'novo' && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl p-1.5 z-50 backdrop-blur-md">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    Novo Registro
                  </div>
                  <button
                    onClick={() => {
                      onNewVisit();
                      closeMenu();
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-xs font-medium hover:bg-slate-800 text-slate-200 transition-colors"
                  >
                    <CalendarDays className="w-4 h-4 text-sky-400" />
                    <span>Nova Visita Técnica</span>
                  </button>
                  <button
                    onClick={() => {
                      onNewQuote();
                      closeMenu();
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-xs font-medium hover:bg-slate-800 text-slate-200 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <span>Novo Orçamento</span>
                  </button>
                  <button
                    onClick={() => {
                      if (onNavigateToClients) {
                        onNavigateToClients();
                      } else {
                        setActiveTab('clients');
                      }
                      closeMenu();
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-xs font-medium hover:bg-slate-800 text-slate-200 transition-colors"
                  >
                    <Users className="w-4 h-4 text-cyan-400" />
                    <span>Novo Cliente</span>
                  </button>
                </div>
              )}
            </div>

            {/* Indicador de Nuvem Multi-dispositivo */}
            <SyncIndicator />

            {/* Separador sutil */}
            <div className="h-6 w-px bg-slate-800 mx-0.5 hidden sm:block" />

            {/* Menu Dropdown do Usuário / Administrador */}
            <div className="relative">
              <button
                id="btn-user-profile-menu"
                type="button"
                onClick={() => toggleDropdown('user')}
                className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition-all text-left"
                title="Opções de conta e sistema"
                aria-expanded={openDropdown === 'user'}
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                  {initials}
                </div>
                <div className="hidden xl:block leading-tight">
                  <p className="text-xs font-semibold text-slate-100 max-w-[110px] truncate">
                    {displayName}
                  </p>
                  <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Admin
                  </p>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {/* Submenu do Perfil */}
              {openDropdown === 'user' && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl p-2 z-50 backdrop-blur-md">
                  <div className="px-3 py-2 border-b border-slate-800">
                    <p className="text-xs font-bold text-white truncate">{displayName}</p>
                    <p className="text-[11px] text-slate-400 truncate">{displayEmail}</p>
                    <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-500/40 text-[10px] text-emerald-300 font-medium">
                      <ShieldCheck className="w-3 h-3" />
                      Acesso Administrativo Total
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        onOpenCompanySettings();
                        closeMenu();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <span>Dados da Empresa</span>
                    </button>

                    <button
                      onClick={() => {
                        onExportBackup();
                        closeMenu();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      <Download className="w-4 h-4 text-slate-400" />
                      <span>Fazer Backup dos Dados</span>
                    </button>

                    <button
                      onClick={() => {
                        onImportBackup();
                        closeMenu();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      <Upload className="w-4 h-4 text-slate-400" />
                      <span>Importar Backup dos Dados</span>
                    </button>
                  </div>

                  <div className="pt-1 border-t border-slate-800">
                    <button
                      onClick={() => {
                        closeMenu();
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sair do Sistema</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Linha de Navegação Secundária Mobile */}
        <div className="flex lg:hidden items-center justify-between py-2 border-t border-slate-800/80 overflow-x-auto gap-1 text-xs">
          <button
            onClick={() => {
              setActiveTab('dashboard');
              closeMenu();
            }}
            className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors ${
              activeTab === 'dashboard' ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            Painel
          </button>
          <button
            onClick={() => {
              setActiveTab('visits');
              closeMenu();
            }}
            className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors ${
              activeTab === 'visits' ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            Visitas
          </button>
          <button
            onClick={() => {
              setActiveTab('quotes');
              closeMenu();
            }}
            className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors ${
              activeTab === 'quotes' ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            Orçamentos
          </button>
          <button
            onClick={() => {
              setActiveTab('maintenance');
              closeMenu();
            }}
            className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors ${
              activeTab === 'maintenance' ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            Manutenções
          </button>
          <button
            onClick={() => {
              setActiveTab('clients');
              closeMenu();
            }}
            className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors ${
              activeTab === 'clients' ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            Cadastros
          </button>
          <button
            id="mobile-btn-empresa"
            onClick={() => {
              onOpenCompanySettings();
              closeMenu();
            }}
            className="px-3 py-1.5 rounded-md font-medium whitespace-nowrap text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
            title="Dados e Configurações da Empresa"
          >
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Empresa</span>
          </button>
        </div>

      </div>
    </header>
  );
};
