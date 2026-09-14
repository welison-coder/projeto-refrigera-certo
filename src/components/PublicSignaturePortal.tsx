import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  ShieldCheck,
  CheckCircle2,
  PenTool,
  Printer,
  RotateCcw,
  Lock,
  Calendar,
  DollarSign,
  Wrench,
  Copy,
  Check,
  MapPin,
  Clock,
  AlertCircle
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { Quote, MaintenanceLog, CompanySettings, ClientSignature } from '../types';
import { storage } from '../utils/storage';

interface PublicSignaturePortalProps {
  docId: string;
  docTypeParam?: 'quote' | 'maintenance' | null;
  onClosePortal?: () => void;
}

export const PublicSignaturePortal: React.FC<PublicSignaturePortalProps> = ({
  docId,
  docTypeParam,
  onClosePortal
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [docType, setDocType] = useState<'quote' | 'maintenance'>('quote');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [maintenanceLog, setMaintenanceLog] = useState<MaintenanceLog | null>(null);
  const [companySettings, setCompanySettings] = useState<CompanySettings>(() => storage.getCompanySettings());

  // Signature Form State
  const [signMode, setSignMode] = useState<'draw' | 'type'>('draw');
  const [signerName, setSignerName] = useState<string>('');
  const [signerDocument, setSignerDocument] = useState<string>('');
  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(false);
  const [hasDrawn, setHasDrawn] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [signedSuccess, setSignedSuccess] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Canvas drawing refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // 1. Fetch document from server or local storage
  useEffect(() => {
    async function loadDocument() {
      setLoading(true);
      setError(null);

      try {
        // Try server API first
        const res = await fetch(`/api/public/document/${encodeURIComponent(docId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.found) {
            setDocType(data.type);
            if (data.type === 'quote') {
              setQuote(data.document);
              setSignerName(data.document.clientName || '');
              setSignerDocument(data.document.clientDocument || '');
              if (data.document.signature) {
                setSignedSuccess(true);
              }
            } else {
              setMaintenanceLog(data.document);
              setSignerName(data.document.clientName || '');
              if (data.document.signature) {
                setSignedSuccess(true);
              }
            }
            if (data.companySettings) {
              setCompanySettings(data.companySettings);
            }
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.warn('API indisponível, tentando storage local:', e);
      }

      // Fallback to local storage (for preview/offline situations)
      const localQuotes = storage.getQuotes();
      const foundQuote = localQuotes.find(
        (q) => q.id === docId || q.number?.toLowerCase() === docId.toLowerCase()
      );

      if (foundQuote) {
        setDocType('quote');
        setQuote(foundQuote);
        setSignerName(foundQuote.clientName || '');
        setSignerDocument(foundQuote.clientDocument || '');
        if (foundQuote.signature) {
          setSignedSuccess(true);
        }
        setLoading(false);
        return;
      }

      const localLogs = storage.getMaintenanceLogs();
      const foundLog = localLogs.find(
        (l) => l.id === docId || l.code?.toLowerCase() === docId.toLowerCase()
      );

      if (foundLog) {
        setDocType('maintenance');
        setMaintenanceLog(foundLog);
        setSignerName(foundLog.clientName || '');
        if (foundLog.signature) {
          setSignedSuccess(true);
        }
        setLoading(false);
        return;
      }

      setError('Documento não localizado ou o link informado está incorreto.');
      setLoading(false);
    }

    loadDocument();
  }, [docId]);

  // Set up Canvas scaling
  useEffect(() => {
    if (signMode === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#0F172A'; // Slate 900
        ctx.lineWidth = 2.5;
      }
    }
  }, [signMode, loading, signedSuccess]);

  // Canvas drawing handlers
  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    isDrawingRef.current = true;
    lastPointRef.current = getCoordinates(e);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawingRef.current || !canvasRef.current || !lastPointRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentPoint = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(currentPoint.x, currentPoint.y);
    ctx.stroke();

    lastPointRef.current = currentPoint;
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasDrawn(false);
    }
  };

  // Generate image from typed signature if mode is 'type'
  const generateTypedSignatureDataUrl = (text: string): string => {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 600;
    tempCanvas.height = 160;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return '';

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    ctx.font = 'italic bold 38px "Space Grotesk", "Caveat", cursive, sans-serif';
    ctx.fillStyle = '#0F172A';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text.trim(), 300, 80);

    // Subtle signature underline
    ctx.beginPath();
    ctx.strokeStyle = '#2563EB';
    ctx.lineWidth = 2;
    ctx.moveTo(100, 115);
    ctx.bezierCurveTo(200, 125, 400, 105, 500, 120);
    ctx.stroke();

    return tempCanvas.toDataURL('image/png');
  };

  // Submit Signature
  const handleConfirmSignature = async () => {
    if (!signerName.trim()) {
      alert('Por favor, informe seu Nome Completo para formalizar a assinatura.');
      return;
    }

    if (signMode === 'draw' && !hasDrawn) {
      alert('Por favor, desenhe sua assinatura no quadro antes de confirmar.');
      return;
    }

    if (!acceptedTerms) {
      alert('É necessário marcar a caixa de concordância com os termos do documento.');
      return;
    }

    setIsSubmitting(true);

    try {
      let signatureDataUrl = '';
      if (signMode === 'draw' && canvasRef.current) {
        signatureDataUrl = canvasRef.current.toDataURL('image/png');
      } else {
        signatureDataUrl = generateTypedSignatureDataUrl(signerName);
      }

      const signaturePayload: ClientSignature = {
        signedBy: signerName.trim(),
        documentNumber: signerDocument.trim() || undefined,
        signedAt: new Date().toISOString(),
        signatureDataUrl,
        signType: signMode,
      };

      // 1. Post to server
      try {
        const res = await fetch(`/api/public/document/${encodeURIComponent(docId)}/sign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            signedBy: signaturePayload.signedBy,
            documentNumber: signaturePayload.documentNumber,
            signatureDataUrl: signaturePayload.signatureDataUrl,
            signType: signaturePayload.signType,
          }),
        });

        if (res.ok) {
          const result = await res.json();
          if (result.type === 'quote' && result.document) {
            setQuote(result.document);
          } else if (result.type === 'maintenance' && result.document) {
            setMaintenanceLog(result.document);
          }
        }
      } catch (apiErr) {
        console.warn('Erro na chamada da API /sign, gravando local:', apiErr);
      }

      // 2. Also update local storage if available
      if (docType === 'quote' && quote) {
        const updatedQuotes = storage.getQuotes().map((q) => {
          if (q.id === quote.id || q.number === quote.number) {
            return {
              ...q,
              status: 'Aprovado' as const,
              approvedAt: signaturePayload.signedAt,
              signature: signaturePayload,
            };
          }
          return q;
        });
        storage.saveQuotes(updatedQuotes);

        setQuote({
          ...quote,
          status: 'Aprovado',
          approvedAt: signaturePayload.signedAt,
          signature: signaturePayload,
        });
      } else if (docType === 'maintenance' && maintenanceLog) {
        const updatedLogs = storage.getMaintenanceLogs().map((l) => {
          if (l.id === maintenanceLog.id || l.code === maintenanceLog.code) {
            return {
              ...l,
              status: 'Concluído' as const,
              signature: signaturePayload,
            };
          }
          return l;
        });
        storage.saveMaintenanceLogs(updatedLogs);

        setMaintenanceLog({
          ...maintenanceLog,
          status: 'Concluído',
          signature: signaturePayload,
        });
      }

      setSignedSuccess(true);
    } catch (err: any) {
      alert(`Não foi possível salvar a assinatura: ${err?.message || 'Erro inesperado'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const activeDoc = docType === 'quote' ? quote : maintenanceLog;
  const currentSignature = activeDoc?.signature;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full text-center space-y-4 border border-slate-200">
          <div className="w-12 h-12 border-4 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="text-lg font-bold text-slate-800">Carregando Documento...</h2>
          <p className="text-xs text-slate-500">Conectando ao ambiente de assinatura online da Ar Soluções Climatização.</p>
        </div>
      </div>
    );
  }

  if (error || !activeDoc) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center space-y-4 border border-rose-200">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Documento Não Encontrado</h2>
          <p className="text-sm text-slate-600">
            {error || 'Não foi possível encontrar o documento com o código informado. Verifique o link ou contate a equipe técnica.'}
          </p>
          <div className="pt-4 border-t border-slate-100 text-xs text-slate-500">
            <strong>Ar Soluções Climatização</strong> • Suporte: {companySettings.phone}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 py-6 sm:py-10 px-3 sm:px-6">
      
      {/* Container Principal do Documento */}
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Top Header com Identidade da Ar Soluções e Segurança */}
        <header className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 sm:p-6 no-print">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <BrandLogo size="md" />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Lock className="w-3.5 h-3.5" />
                <span>Ambiente Seguro • Portal do Cliente</span>
              </span>

              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                title="Copiar link desta página"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link'}</span>
              </button>

              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir / PDF</span>
              </button>
            </div>
          </div>
        </header>

        {/* Status Banner */}
        {signedSuccess || currentSignature ? (
          <div className="bg-emerald-500 text-white p-5 rounded-2xl shadow-md flex items-start gap-4 no-print">
            <div className="p-2 bg-white/20 rounded-xl shrink-0">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Documento Formalizado e Assinado com Sucesso!</h3>
              <p className="text-emerald-50 text-xs sm:text-sm mt-0.5">
                Seu aceite digital foi registrado com validade jurídica junto à Ar Soluções Climatização.
                Você pode salvar uma cópia impressa ou PDF a qualquer momento.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-sky-50 border border-sky-200 p-4 rounded-2xl flex items-center justify-between gap-3 text-sky-900 text-xs sm:text-sm no-print">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                <PenTool className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold">Aguardando sua Assinatura Digital</p>
                <p className="text-sky-700 text-xs">
                  Revise os itens e valores abaixo. Em seguida, confirme sua assinatura no final da página.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            DOCUMENTO OFICIAL (Imprimível e visualmente fidedigno)
        ======================================================== */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden print:shadow-none print:border-none">
          
          {/* Cabeçalho do Documento */}
          <div className="p-6 sm:p-8 border-b border-slate-200 bg-slate-50/50">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <BrandLogo size="md" />
                <div className="mt-3 text-xs text-slate-600 space-y-0.5">
                  <p className="font-bold text-slate-900">{companySettings.companyName}</p>
                  <p>CNPJ: {companySettings.cnpj}</p>
                  <p>{companySettings.address}</p>
                  <p>Telefone / WhatsApp: {companySettings.phone} • E-mail: {companySettings.email}</p>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="inline-block px-3 py-1 rounded-lg bg-rose-50 text-rose-700 font-mono font-bold text-sm border border-rose-200">
                  {docType === 'quote' ? (quote?.number || 'ORÇAMENTO') : (maintenanceLog?.code || 'ORDEM DE SERVIÇO')}
                </span>
                <p className="text-xs text-slate-500 mt-2">
                  Data de Emissão: <strong>{new Date(activeDoc.createdAt || (activeDoc as any).date).toLocaleDateString('pt-BR')}</strong>
                </p>
                {docType === 'quote' && quote?.validityDays && (
                  <p className="text-xs text-slate-500">
                    Validade da Proposta: <strong>{quote.validityDays} dias</strong>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Dados do Cliente e Equipamento */}
          <div className="p-6 sm:p-8 border-b border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white">
            <div className="space-y-1 text-xs">
              <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider block mb-1">
                Dados do Cliente
              </span>
              <p className="text-sm font-bold text-slate-900">{activeDoc.clientName}</p>
              {docType === 'quote' && quote?.clientDocument && (
                <p className="text-slate-600">CPF / CNPJ: {quote.clientDocument}</p>
              )}
              {docType === 'quote' && quote?.clientPhone && (
                <p className="text-slate-600">Contato: {quote.clientPhone}</p>
              )}
              {docType === 'quote' && quote?.clientAddress && (
                <p className="text-slate-600 flex items-start gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{quote.clientAddress}</span>
                </p>
              )}
            </div>

            <div className="space-y-1 text-xs">
              <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider block mb-1">
                Equipamento / Instalação Atendida
              </span>
              <p className="text-sm font-semibold text-slate-800">
                {docType === 'quote' ? quote?.equipmentDescription : maintenanceLog?.equipmentName}
              </p>
              <p className="text-slate-500">
                Responsável Técnico: <strong>{companySettings.technicianResponsible}</strong>
              </p>
            </div>
          </div>

          {/* Conteúdo do Orçamento (Itens e Valores) */}
          {docType === 'quote' && quote && (
            <div className="p-6 sm:p-8 border-b border-slate-200">
              <h4 className="font-bold text-sm text-slate-800 mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-600" />
                <span>Discriminação dos Serviços e Peças</span>
              </h4>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px]">
                      <th className="pb-2">Tipo</th>
                      <th className="pb-2">Descrição</th>
                      <th className="pb-2 text-center">Qtd</th>
                      <th className="pb-2 text-right">Unitário</th>
                      <th className="pb-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {quote.items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 font-medium text-slate-600">{item.type}</td>
                        <td className="py-2.5 font-medium text-slate-800">{item.description}</td>
                        <td className="py-2.5 text-center text-slate-600">{item.quantity} {item.unit}</td>
                        <td className="py-2.5 text-right font-mono text-slate-600">
                          {item.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                        <td className="py-2.5 text-right font-mono font-semibold text-slate-900">
                          {item.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Resumo Financeiro */}
              <div className="mt-6 pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-4 rounded-xl">
                <div className="text-xs text-slate-600 space-y-1">
                  <p><strong>Condições de Pagamento:</strong> {quote.paymentTerms}</p>
                  {companySettings.pixKey && (
                    <p className="text-slate-500">Chave PIX: <strong className="font-mono">{companySettings.pixKey}</strong></p>
                  )}
                </div>

                <div className="text-right w-full sm:w-auto">
                  <span className="text-xs text-slate-500 block">Investimento Total</span>
                  <span className="text-2xl font-black text-rose-600 font-mono">
                    {quote.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              </div>

              {/* Termo de Garantia */}
              <div className="mt-4 p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs text-emerald-950 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Termo de Garantia:</strong>
                  <span>{quote.warrantyTerms}</span>
                </div>
              </div>
            </div>
          )}

          {/* Conteúdo da Ordem de Serviço / Manutenção */}
          {docType === 'maintenance' && maintenanceLog && (
            <div className="p-6 sm:p-8 border-b border-slate-200 space-y-4">
              <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-sky-600" />
                <span>Serviços e Procedimentos Executados</span>
              </h4>

              <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-700 space-y-2">
                <p><strong>Tipo de Manutenção:</strong> {maintenanceLog.type}</p>
                <p><strong>Descrição:</strong> {maintenanceLog.description}</p>
              </div>

              {maintenanceLog.workPerformed && maintenanceLog.workPerformed.length > 0 && (
                <div>
                  <h5 className="font-semibold text-xs text-slate-700 mb-2">Checklist de Atividades:</h5>
                  <ul className="list-disc list-inside text-xs text-slate-600 space-y-1">
                    {maintenanceLog.workPerformed.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {maintenanceLog.observations && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                  <strong>Observações Técnicas:</strong> {maintenanceLog.observations}
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              ÁREA DE ASSINATURA NO DOCUMENTO (Visual e Certificado)
          ======================================================== */}
          <div className="p-6 sm:p-8 bg-slate-50/30">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-center text-xs">
              
              {/* Assinatura do Técnico / Empresa */}
              <div className="border-t border-slate-300 pt-3 flex flex-col items-center">
                <div className="h-14 flex items-center justify-center">
                  <span className="font-serif italic text-base text-slate-600">
                    {companySettings.technicianResponsible}
                  </span>
                </div>
                <p className="font-bold text-slate-900">{companySettings.technicianResponsible}</p>
                <p className="text-slate-500 text-[11px]">{companySettings.tradeName} • Responsável Técnico</p>
              </div>

              {/* Assinatura do Cliente */}
              <div className="border-t border-slate-300 pt-3 flex flex-col items-center">
                
                {/* Se já estiver assinado, exibe o carimbo e a assinatura */}
                {currentSignature ? (
                  <div className="flex flex-col items-center w-full">
                    <div className="h-14 flex items-center justify-center">
                      {currentSignature.signatureDataUrl ? (
                        <img
                          src={currentSignature.signatureDataUrl}
                          alt="Assinatura do Cliente"
                          className="max-h-12 max-w-full object-contain"
                        />
                      ) : (
                        <span className="font-serif italic text-lg font-bold text-sky-900">
                          {currentSignature.signedBy}
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-slate-900">{currentSignature.signedBy}</p>
                    {currentSignature.documentNumber && (
                      <p className="text-slate-500 text-[11px]">Doc: {currentSignature.documentNumber}</p>
                    )}
                    <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Assinado em {new Date(currentSignature.signedAt).toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="h-14 flex items-center justify-center text-slate-400 italic text-xs">
                      [Aguardando formalização eletrônica abaixo]
                    </div>
                    <p className="font-bold text-slate-800">{activeDoc.clientName}</p>
                    <p className="text-slate-500 text-[11px]">De acordo do Cliente (Assinatura Eletrônica)</p>
                  </div>
                )}

              </div>

            </div>

          </div>

        </div>

        {/* ========================================================
            SEÇÃO INTERATIVA DE ASSINATURA DIGITAL (Quando pendente)
        ======================================================== */}
        {!currentSignature && !signedSuccess && (
          <div className="bg-white rounded-2xl shadow-xl border-2 border-rose-500/80 p-6 sm:p-8 space-y-6 no-print">
            
            <div className="border-b border-slate-100 pb-4">
              <div className="inline-flex items-center gap-2 text-rose-600 font-bold text-sm mb-1">
                <PenTool className="w-4 h-4" />
                <span>Assinatura Digital do Cliente</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                Formalize sua aprovação online
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Utilize a ponta do dedo na tela do celular ou o mouse no computador para assinar.
              </p>
            </div>

            {/* Alternador de Modo: Desenhar ou Digitar */}
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl w-fit">
              <button
                type="button"
                onClick={() => setSignMode('draw')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  signMode === 'draw'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ✏️ Desenhar Assinatura (Touch/Mouse)
              </button>
              <button
                type="button"
                onClick={() => setSignMode('type')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  signMode === 'type'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ⌨️ Digitar Nome Completo
              </button>
            </div>

            {/* Dados do Assinante */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome Completo do Assinante / Responsável *
                </label>
                <input
                  type="text"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  CPF ou RG (Opcional)
                </label>
                <input
                  type="text"
                  value={signerDocument}
                  onChange={(e) => setSignerDocument(e.target.value)}
                  placeholder="000.000.000-00"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Quadro de Assinatura (Canvas) */}
            {signMode === 'draw' ? (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-700">
                    Assine dentro da área delimitada abaixo:
                  </span>
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-semibold"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Limpar Quadro</span>
                  </button>
                </div>

                <div className="border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 relative overflow-hidden touch-none h-44 sm:h-52 cursor-crosshair">
                  <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-full block"
                  />
                  {!hasDrawn && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs italic">
                      ✍️ Toque ou clique e arraste para desenhar sua assinatura
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-2">
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block">
                  Prévia da Assinatura Caligráfica
                </span>
                <p className="font-serif italic text-2xl sm:text-3xl text-slate-900 font-bold py-3">
                  {signerName.trim() || 'Digite seu nome acima'}
                </p>
                <p className="text-[11px] text-slate-400">
                  Será gerada uma chancela digital formal com seu nome e horário exato de registro.
                </p>
              </div>
            )}

            {/* Termos de Aceite */}
            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 cursor-pointer"
              />
              <span className="text-xs text-slate-700 leading-relaxed">
                Declaro que li e concordo com os serviços, peças, valores e termos de garantia discriminados neste documento emitido por <strong>{companySettings.tradeName}</strong>.
              </span>
            </label>

            {/* Botão de Confirmação */}
            <button
              type="button"
              onClick={handleConfirmSignature}
              disabled={isSubmitting}
              className="w-full py-4 px-6 rounded-xl font-bold text-base bg-rose-600 hover:bg-rose-700 text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Validando e Registrando Assinatura...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Confirmar e Assinar Documento Online</span>
                </>
              )}
            </button>

          </div>
        )}

        {/* Rodapé institucional com CNPJ e Endereço atualizados */}
        <footer className="text-center text-xs text-slate-500 py-4 no-print space-y-1">
          <p className="font-bold text-slate-700">
            {companySettings.tradeName} • CNPJ: {companySettings.cnpj}
          </p>
          <p>
            {companySettings.address} • Tel: {companySettings.phone}
          </p>
          <p className="text-[11px] text-slate-400 pt-2">
            Ambiente de assinatura digital seguro desenvolvido para clientes da Ar Soluções Climatização.
          </p>
        </footer>

      </div>

    </div>
  );
};
