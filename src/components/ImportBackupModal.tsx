import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
  Users,
  Wind,
  Calendar,
  FileSpreadsheet,
  Wrench,
  Building2,
  ArrowRight,
  RotateCcw,
  Loader2,
  X
} from 'lucide-react';
import { storage } from '../utils/storage';

interface ImportBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ImportBackupModal: React.FC<ImportBackupModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [validationResult, setValidationResult] = useState<ReturnType<typeof storage.validateBackup> | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleResetState = () => {
    setSelectedFile(null);
    setFileContent('');
    setValidationResult(null);
    setIsProcessing(false);
    setStatusMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCloseModal = () => {
    handleResetState();
    onClose();
  };

  const processFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.json')) {
      setStatusMessage({
        type: 'error',
        text: 'Formato inválido. Por favor selecione um arquivo de backup com extensão .json.'
      });
      return;
    }

    setSelectedFile(file);
    setStatusMessage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setFileContent(content);
      const validation = storage.validateBackup(content);
      setValidationResult(validation);

      if (!validation.isValid) {
        setStatusMessage({
          type: 'error',
          text: validation.errorMessage || 'Arquivo de backup inválido ou incompatível.'
        });
      }
    };
    reader.onerror = () => {
      setStatusMessage({
        type: 'error',
        text: 'Falha ao ler o arquivo selecionado no seu dispositivo.'
      });
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleConfirmImport = async () => {
    if (!validationResult?.isValid || !validationResult.parsedData) {
      return;
    }

    setIsProcessing(true);
    setStatusMessage(null);

    try {
      // Simula um breve momento para feedback visual de processamento seguro
      await new Promise((resolve) => setTimeout(resolve, 350));

      const success = storage.importData(validationResult.parsedData);

      if (success) {
        setStatusMessage({
          type: 'success',
          text: 'Backup restaurado com sucesso! Seus dados foram recarregados e sincronizados.'
        });
        // Atualiza os estados no App.tsx e na nuvem
        onSuccess();

        setTimeout(() => {
          handleCloseModal();
        }, 1400);
      } else {
        setStatusMessage({
          type: 'error',
          text: 'Ocorreu um erro ao gravar os dados do backup no armazenamento.'
        });
        setIsProcessing(false);
      }
    } catch (err) {
      console.error('Erro na importação:', err);
      setStatusMessage({
        type: 'error',
        text: 'Ocorreu uma falha inesperada durante a importação.'
      });
      setIsProcessing(false);
    }
  };

  const stats = validationResult?.stats;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Importar Backup do Sistema
              </h2>
              <p className="text-xs text-slate-500">
                Ar Soluções Climatização • Restauração de Dados
              </p>
            </div>
          </div>
          <button
            onClick={handleCloseModal}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-6 overflow-y-auto space-y-4 text-slate-700">
          
          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl border text-xs font-semibold flex items-start gap-2.5 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">{statusMessage.text}</span>
            </div>
          )}

          {/* Área de Seleção ou Drag and Drop */}
          {!validationResult?.isValid ? (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-sky-500 bg-sky-50/60 scale-[1.01]'
                  : 'border-slate-300 hover:border-sky-400 bg-slate-50/50 hover:bg-sky-50/20'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center shadow-xs">
                <Upload className="w-7 h-7" />
              </div>

              <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1">
                Escolha o arquivo de backup (.json)
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                Arraste e solte o arquivo aqui, ou clique para navegar e selecionar uma cópia exportada do Ar Soluções.
              </p>

              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 text-white font-semibold text-xs shadow-sm hover:bg-sky-500 transition-colors pointer-events-none"
              >
                <FileText className="w-4 h-4" />
                <span>Selecionar Arquivo</span>
              </button>

              <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-center gap-3 text-[11px] text-slate-400 font-mono">
                <span>Extensão permitida: .json</span>
                <span>•</span>
                <span>Compatível com backups Ar Soluções</span>
              </div>
            </div>
          ) : (
            /* Pré-visualização do Conteúdo do Backup */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-sky-600" />
                    <span className="font-semibold text-xs text-slate-900 truncate max-w-xs sm:max-w-sm">
                      {selectedFile?.name || 'backup.json'}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-mono">
                      {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : ''}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetState}
                    disabled={isProcessing}
                    className="text-xs text-sky-600 hover:text-sky-700 font-semibold underline"
                  >
                    Trocar arquivo
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200/70">
                    <span className="text-[10px] text-slate-400 font-medium block">Empresa Identificada</span>
                    <span className="font-bold text-slate-800 truncate block">
                      {stats?.companyName || 'Ar Soluções Climatização'}
                    </span>
                    <span className="text-[10px] text-sky-600 font-medium">
                      Fundação: {stats?.foundingYear || 2013}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white border border-slate-200/70">
                    <span className="text-[10px] text-slate-400 font-medium block">Data de Exportação</span>
                    <span className="font-semibold text-slate-800 block text-[11px] truncate">
                      {stats?.exportedAt
                        ? new Date(stats.exportedAt).toLocaleString('pt-BR')
                        : 'Não informada'}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-semibold">
                      Arquivo verificado e íntegro
                    </span>
                  </div>
                </div>
              </div>

              {/* Estatísticas detalhadas dos itens a restaurar */}
              <div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                  Conteúdo Detectado no Arquivo
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-base font-extrabold text-slate-900 block leading-tight">
                        {stats?.clientsCount || 0}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">Clientes</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-sky-50 text-sky-600">
                      <Wind className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-base font-extrabold text-slate-900 block leading-tight">
                        {stats?.equipmentCount || 0}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">Aparelhos</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-base font-extrabold text-slate-900 block leading-tight">
                        {stats?.visitsCount || 0}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">Visitas</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-base font-extrabold text-slate-900 block leading-tight">
                        {stats?.quotesCount || 0}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">Orçamentos</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                      <Wrench className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-base font-extrabold text-slate-900 block leading-tight">
                        {stats?.maintenanceLogsCount || 0}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">Laudos PMOC</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-base font-extrabold text-slate-900 block leading-tight">
                        {stats?.hasLogo ? 'Sim' : 'Padrão'}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">Logomarca</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Aviso de Confirmação e Segurança */}
              <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold block">Atenção ao restaurar:</span>
                  <p className="leading-relaxed text-[11px] text-amber-800">
                    Ao confirmar, os dados do sistema serão atualizados com as informações deste arquivo de backup e propagados para a nuvem.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Rodapé do Modal */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleCloseModal}
            disabled={isProcessing}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium text-xs transition-colors"
          >
            Cancelar
          </button>

          {validationResult?.isValid && (
            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={isProcessing}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Restaurando Dados...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmar e Restaurar Backup</span>
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
