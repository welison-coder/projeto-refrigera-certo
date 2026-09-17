import React, { useState, useRef, useEffect } from 'react';
import { Building2, Save, Download, Upload, RotateCcw, ShieldCheck, Search, Loader2, CheckCircle2, AlertCircle, MapPin, Image as ImageIcon, Trash2 } from 'lucide-react';
import { CompanySettings } from '../types';
import { storage } from '../utils/storage';
import { BrandLogo } from './BrandLogo';
import { cleanCEP, formatCEP, fetchAddressByCEP } from '../utils/cep';
import { processLogoUpload, notifyLogoUpdated } from '../utils/logoManager';

interface CompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  companySettings: CompanySettings;
  onSaveCompanySettings: (settings: CompanySettings) => void;
  onReloadAllData: () => void;
}

export const CompanyModal: React.FC<CompanyModalProps> = ({
  isOpen,
  onClose,
  companySettings,
  onSaveCompanySettings,
  onReloadAllData
}) => {
  const [formData, setFormData] = useState<CompanySettings>({ ...companySettings });
  const [importStatus, setImportStatus] = useState<string>('');
  const [isSearchingCep, setIsSearchingCep] = useState<boolean>(false);
  const [cepStatus, setCepStatus] = useState<{
    type: 'idle' | 'loading' | 'success' | 'error';
    message?: string;
  }>({ type: 'idle' });

  // Estados de gestão da Logomarca
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [isProcessingLogo, setIsProcessingLogo] = useState<boolean>(false);
  const [isDraggingLogo, setIsDraggingLogo] = useState<boolean>(false);
  const [logoFeedback, setLogoFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Sincronizar formData sempre que as props mudarem ao abrir o modal
  useEffect(() => {
    if (isOpen) {
      setFormData({ ...companySettings });
      setLogoFeedback(null);
    }
  }, [isOpen, companySettings]);

  if (!isOpen) return null;

  const handleChange = (field: keyof CompanySettings, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  // Processamento do arquivo de imagem da logo carregado
  const handleProcessLogoFile = async (file: File) => {
    setIsProcessingLogo(true);
    setLogoFeedback(null);
    try {
      const dataUrl = await processLogoUpload(file);
      setFormData((prev) => ({ ...prev, logoUrl: dataUrl }));
      setLogoFeedback({
        type: 'success',
        message: 'Logomarca carregada com sucesso! Clique em "Salvar Dados da Empresa" para aplicar em todo o sistema.'
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Falha ao processar arquivo de imagem.';
      setLogoFeedback({
        type: 'error',
        message: errorMsg
      });
    } finally {
      setIsProcessingLogo(false);
      if (logoInputRef.current) {
        logoInputRef.current.value = '';
      }
    }
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessLogoFile(file);
    }
  };

  const handleLogoDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingLogo(true);
  };

  const handleLogoDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingLogo(false);
  };

  const handleLogoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingLogo(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessLogoFile(file);
    }
  };

  const handleResetToDefaultLogo = () => {
    setFormData((prev) => {
      const updated = { ...prev };
      delete updated.logoUrl;
      return updated;
    });
    setLogoFeedback({
      type: 'success',
      message: 'Logomarca restaurada para o padrão oficial da empresa. Clique em Salvar para confirmar.'
    });
  };

  const performCompanyCepLookup = async (digitsToSearch?: string) => {
    const rawValue = digitsToSearch !== undefined ? digitsToSearch : (formData.cep || '');
    const digits = cleanCEP(rawValue);
    if (digits.length !== 8) {
      setCepStatus({ type: 'error', message: 'Digite 8 dígitos para consultar o CEP.' });
      return;
    }

    setIsSearchingCep(true);
    setCepStatus({ type: 'loading', message: 'Buscando endereço pelo CEP...' });

    try {
      const res = await fetchAddressByCEP(digits);
      if (res && (res.street || res.neighborhood || res.city)) {
        const parts = [
          res.street,
          res.neighborhood ? `Bairro ${res.neighborhood}` : '',
          res.cityState
        ].filter(Boolean);
        const formattedAddress = parts.join(', ');

        setFormData(prev => ({
          ...prev,
          cep: res.cep,
          address: formattedAddress ? `${formattedAddress} - CEP ${res.cep}` : prev.address
        }));
        setCepStatus({
          type: 'success',
          message: `Endereço preenchido: ${res.street || ''} (${res.neighborhood || ''})`
        });
      } else {
        setCepStatus({
          type: 'error',
          message: 'CEP não encontrado.'
        });
      }
    } catch {
      setCepStatus({
        type: 'error',
        message: 'Não foi possível consultar o CEP.'
      });
    } finally {
      setIsSearchingCep(false);
    }
  };

  const handleCepChange = (value: string) => {
    const formatted = formatCEP(value);
    handleChange('cep', formatted);
    const digits = cleanCEP(value);
    if (digits.length === 8) {
      performCompanyCepLookup(digits);
    } else {
      setCepStatus({ type: 'idle' });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveCompanySettings(formData);
    notifyLogoUpdated(formData.logoUrl || null);
    onClose();
  };

  const handleExport = () => {
    storage.exportAllData();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = storage.importData(content);
        if (success) {
          setImportStatus('Backup restaurado com sucesso!');
          onReloadAllData();
          setTimeout(() => setImportStatus(''), 3000);
        } else {
          setImportStatus('Erro ao ler arquivo de backup.');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (confirm('Deseja restaurar os dados de demonstração padrão da Refrigera Certo?')) {
      storage.resetToDefault();
      onReloadAllData();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-900">
            <Building2 className="w-5 h-5 text-sky-600" />
            <h2 className="text-lg font-bold">Dados da Empresa & Sistema</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold p-1"
          >
            ✕
          </button>
        </div>

        {/* Gestão Dinâmica da Logomarca */}
        <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200/90 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[11px] uppercase font-bold tracking-wide text-slate-700 block">
                Logotipo da Empresa no Sistema
              </span>
              <p className="text-[11px] text-slate-500">
                Usado automaticamente no cabeçalho do menu, orçamentos, laudos de PMOC e PDFs.
              </p>
            </div>
            {formData.logoUrl ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
                <CheckCircle2 className="w-3 h-3" />
                Logo Personalizada Ativa
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200 self-start sm:self-auto">
                <ShieldCheck className="w-3 h-3" />
                Logo Padrão Ativa
              </span>
            )}
          </div>

          {/* Área de Visualização e Carregamento */}
          <div 
            onDragOver={handleLogoDragOver}
            onDragLeave={handleLogoDragLeave}
            onDrop={handleLogoDrop}
            className={`p-4 bg-white rounded-xl border-2 border-dashed transition-all flex flex-col sm:flex-row items-center justify-between gap-4 ${
              isDraggingLogo ? 'border-sky-500 bg-sky-50/50 scale-[0.99]' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            {/* Visualização da Logo atual */}
            <div className="flex items-center justify-center p-3 bg-slate-50/70 rounded-lg border border-slate-100 min-w-[160px] max-w-[240px] min-h-[56px]">
              <BrandLogo size="md" theme="light" customLogoUrl={formData.logoUrl} />
            </div>

            {/* Ações de Upload */}
            <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="file"
                  ref={logoInputRef}
                  onChange={handleLogoFileChange}
                  accept="image/png, image/jpeg, image/webp, image/svg+xml"
                  className="hidden"
                />
                
                <button
                  type="button"
                  id="btn-upload-logo-file"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={isProcessingLogo}
                  className="px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isProcessingLogo ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Processando...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Carregar dos Arquivos</span>
                    </>
                  )}
                </button>

                {formData.logoUrl && (
                  <button
                    type="button"
                    id="btn-restore-default-logo"
                    onClick={handleResetToDefaultLogo}
                    className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 font-semibold text-xs border border-slate-200 hover:border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Restaurar a logomarca padrão"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restaurar Padrão</span>
                  </button>
                )}
              </div>

              <span className="text-[10px] text-slate-400 text-center sm:text-right">
                Arraste um arquivo ou clique para selecionar (PNG transparente, SVG, JPG, WebP)
              </span>
            </div>
          </div>

          {logoFeedback && (
            <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
              logoFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {logoFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{logoFeedback.message}</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nome Fantasia</label>
              <input
                type="text"
                required
                value={formData.tradeName}
                onChange={(e) => handleChange('tradeName', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Razão Social Completa</label>
              <input
                type="text"
                required
                value={formData.companyName}
                onChange={(e) => handleChange('companyName', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">CNPJ</label>
              <input
                type="text"
                value={formData.cnpj}
                onChange={(e) => handleChange('cnpj', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Telefone / WhatsApp Comercial</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">E-mail de Contato</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Chave PIX (para orçamentos)</label>
              <input
                type="text"
                value={formData.pixKey || ''}
                onChange={(e) => handleChange('pixKey', e.target.value)}
                placeholder="CNPJ, Celular ou Chave aleatória"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono"
              />
            </div>
          </div>

          {/* Address & CEP Block */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-sky-600" />
                Endereço da Empresa
              </label>
              <span className="text-[11px] text-sky-700">Busca Automática via CEP</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">CEP da Empresa</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={formData.cep || ''}
                  onChange={(e) => handleCepChange(e.target.value)}
                  placeholder="Ex: 01451-001"
                  maxLength={9}
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono bg-white focus:ring-2 focus:ring-sky-500"
                />
                <button
                  type="button"
                  disabled={isSearchingCep}
                  onClick={() => performCompanyCepLookup()}
                  className="px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:bg-slate-300 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Buscar endereço pelo CEP"
                >
                  {isSearchingCep ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Buscando...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-3.5 h-3.5" />
                      <span>Buscar CEP</span>
                    </>
                  )}
                </button>
              </div>

              {cepStatus.message && (
                <div className={`mt-1.5 flex items-center gap-1.5 text-xs ${
                  cepStatus.type === 'success'
                    ? 'text-emerald-700 font-medium'
                    : cepStatus.type === 'error'
                    ? 'text-rose-600'
                    : 'text-sky-700'
                }`}>
                  {cepStatus.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                  {cepStatus.type === 'error' && <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
                  {cepStatus.type === 'loading' && <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600 shrink-0" />}
                  <span>{cepStatus.message}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Endereço Completo</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Rua, número, complemento, bairro, cidade - UF"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Responsável Técnico</label>
            <input
              type="text"
              value={formData.technicianResponsible}
              onChange={(e) => handleChange('technicianResponsible', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              placeholder="Nome do técnico responsável"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Termo Padrão de Garantia Legal</label>
            <textarea
              rows={2}
              value={formData.defaultWarranty}
              onChange={(e) => handleChange('defaultWarranty', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>

          {/* Backup and Restore Controls */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-slate-800 uppercase tracking-wider block text-[11px]">
              Gerenciamento de Dados & Backup Local
            </span>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Todos os seus clientes, visitas, orçamentos e históricos de manutenção ficam salvos com segurança no seu navegador. Você pode baixar uma cópia de segurança a qualquer momento.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleExport}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-sky-600" />
                <span>Exportar Backup (JSON)</span>
              </button>

              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-2xs cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-sky-600" />
                <span>Restaurar Backup</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 text-xs transition-colors ml-auto"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restaurar Padrão</span>
              </button>
            </div>

            {importStatus && (
              <p className="text-xs text-emerald-600 font-semibold pt-1">
                {importStatus}
              </p>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium"
            >
              Fechar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Salvar Dados da Empresa</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
