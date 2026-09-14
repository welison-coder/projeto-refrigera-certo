import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  Printer,
  Phone,
  Trash2,
  Edit,
  CheckCircle,
  Copy,
  CalendarCheck,
  Building2,
  ShieldCheck,
  CreditCard,
  MapPin,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Navigation,
  PenTool,
  ExternalLink,
  Check
} from 'lucide-react';
import { Quote, QuoteItem, QuoteStatus, Client, CompanySettings, TechnicalVisit } from '../types';
import { formatCurrency, formatDateBR, createWhatsAppLink, generateQuoteWhatsAppMessage } from '../utils/formatters';
import { getGoogleMapsRouteUrl } from '../utils/navigation';
import { BrandLogo } from './BrandLogo';
import { RouteButton } from './RouteButton';
import { cleanCEP, formatCEP, fetchAddressByCEP } from '../utils/cep';

interface QuotesViewProps {
  quotes: Quote[];
  clients: Client[];
  companySettings: CompanySettings;
  onSaveQuote: (quote: Quote) => void;
  onDeleteQuote: (quoteId: string) => void;
  onScheduleVisitFromQuote?: (quote: Quote) => void;
  initialSelectedQuote?: Quote | null;
}

export const QuotesView: React.FC<QuotesViewProps> = ({
  quotes,
  clients,
  companySettings,
  onSaveQuote,
  onDeleteQuote,
  onScheduleVisitFromQuote,
  initialSelectedQuote
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('Todos');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Editor Modal
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);

  // Print/Preview Modal
  const [previewQuote, setPreviewQuote] = useState<Quote | null>(initialSelectedQuote || null);
  const [copiedQuoteId, setCopiedQuoteId] = useState<string | null>(null);

  const handleCopySignatureLink = (quoteId: string) => {
    const link = `${window.location.origin}/?assinar=${quoteId}`;
    navigator.clipboard.writeText(link);
    setCopiedQuoteId(quoteId);
    setTimeout(() => setCopiedQuoteId(null), 2500);
  };

  // Form states
  const [formClientId, setFormClientId] = useState<string>('');
  const [formClientName, setFormClientName] = useState<string>('');
  const [formClientPhone, setFormClientPhone] = useState<string>('');
  const [formClientEmail, setFormClientEmail] = useState<string>('');
  const [formClientCep, setFormClientCep] = useState<string>('');
  const [formClientAddress, setFormClientAddress] = useState<string>('');
  const [formClientDocument, setFormClientDocument] = useState<string>('');
  const [formEquipmentDescription, setFormEquipmentDescription] = useState<string>('');
  const [formItems, setFormItems] = useState<QuoteItem[]>([]);
  const [formDiscount, setFormDiscount] = useState<number>(0);
  const [formPaymentTerms, setFormPaymentTerms] = useState<string>('À vista no PIX ou até 3x no cartão de crédito sem juros');
  const [formValidityDays, setFormValidityDays] = useState<number>(15);
  const [formWarrantyTerms, setFormWarrantyTerms] = useState<string>(companySettings.defaultWarranty || 'Garantia de 90 dias conforme CDC.');
  const [formTechnicianObservations, setFormTechnicianObservations] = useState<string>('');
  const [formStatus, setFormStatus] = useState<QuoteStatus>('Enviado');

  // CEP lookup states
  const [isSearchingCep, setIsSearchingCep] = useState<boolean>(false);
  const [cepStatus, setCepStatus] = useState<{
    type: 'idle' | 'loading' | 'success' | 'error';
    message?: string;
  }>({ type: 'idle' });

  const performQuoteCepLookup = async (digitsToSearch?: string) => {
    const rawValue = digitsToSearch !== undefined ? digitsToSearch : formClientCep;
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
        const formattedAddress = parts.join(' - ');
        
        setFormClientAddress(formattedAddress ? `${formattedAddress}, CEP ${res.cep}` : formClientAddress);
        setCepStatus({
          type: 'success',
          message: `Endereço localizado: ${res.street || ''} (${res.neighborhood || ''})`
        });
      } else {
        setCepStatus({
          type: 'error',
          message: 'CEP não localizado. Digite o endereço manualmente.'
        });
      }
    } catch {
      setCepStatus({
        type: 'error',
        message: 'Não foi possível consultar o CEP agora.'
      });
    } finally {
      setIsSearchingCep(false);
    }
  };

  const handleQuoteCepChange = (value: string) => {
    const formatted = formatCEP(value);
    setFormClientCep(formatted);
    const digits = cleanCEP(value);
    if (digits.length === 8) {
      performQuoteCepLookup(digits);
    } else {
      setCepStatus({ type: 'idle' });
    }
  };

  const openNewQuoteModal = () => {
    setEditingQuote(null);
    setCepStatus({ type: 'idle' });
    if (clients.length > 0) {
      const first = clients[0];
      setFormClientId(first.id);
      setFormClientName(first.name);
      setFormClientPhone(first.phone);
      setFormClientEmail(first.email);
      setFormClientCep(first.address.zipCode || '');
      setFormClientAddress(`${first.address.street}, ${first.address.number} - ${first.address.neighborhood}, ${first.address.city}${first.address.zipCode ? `, CEP ${first.address.zipCode}` : ''}`);
      setFormClientDocument(first.document);
    } else {
      setFormClientId('');
      setFormClientName('');
      setFormClientPhone('');
      setFormClientEmail('');
      setFormClientCep('');
      setFormClientAddress('');
      setFormClientDocument('');
    }
    setFormEquipmentDescription('Split Inverter 12.000 BTU');
    setFormItems([
      {
        id: `item-${Date.now()}-1`,
        type: 'Serviço',
        description: 'Higienização química profunda com bactericida homologado Anvisa',
        quantity: 1,
        unit: 'serviço',
        unitPrice: 280.00,
        total: 280.00
      },
      {
        id: `item-${Date.now()}-2`,
        type: 'Peça / Material',
        description: 'Pastilha antibacteriana para bandeja de condensado',
        quantity: 1,
        unit: 'un',
        unitPrice: 35.00,
        total: 35.00
      }
    ]);
    setFormDiscount(0);
    setFormPaymentTerms('À vista via PIX com 5% de desconto ou em até 3x no cartão de crédito');
    setFormValidityDays(15);
    setFormWarrantyTerms(companySettings.defaultWarranty || 'Garantia de 90 dias em serviços e peças originais.');
    setFormTechnicianObservations('Testes de estanqueidade e aferição de rendimento térmico inclusos.');
    setFormStatus('Enviado');
    setIsEditorOpen(true);
  };

  const openEditQuoteModal = (quote: Quote) => {
    setEditingQuote(quote);
    setCepStatus({ type: 'idle' });
    setFormClientId(quote.clientId);
    setFormClientName(quote.clientName);
    setFormClientPhone(quote.clientPhone);
    setFormClientEmail(quote.clientEmail);
    setFormClientCep(quote.clientCep || '');
    setFormClientAddress(quote.clientAddress);
    setFormClientDocument(quote.clientDocument);
    setFormEquipmentDescription(quote.equipmentDescription);
    setFormItems([...quote.items]);
    setFormDiscount(quote.discount || 0);
    setFormPaymentTerms(quote.paymentTerms);
    setFormValidityDays(quote.validityDays);
    setFormWarrantyTerms(quote.warrantyTerms);
    setFormTechnicianObservations(quote.technicianObservations || '');
    setFormStatus(quote.status);
    setIsEditorOpen(true);
  };

  const handleClientSelectChange = (clientId: string) => {
    setFormClientId(clientId);
    const selected = clients.find(c => c.id === clientId);
    if (selected) {
      setFormClientName(selected.name);
      setFormClientPhone(selected.phone);
      setFormClientEmail(selected.email);
      setFormClientCep(selected.address.zipCode || '');
      setFormClientAddress(`${selected.address.street}, ${selected.address.number} - ${selected.address.neighborhood}, ${selected.address.city}${selected.address.zipCode ? `, CEP ${selected.address.zipCode}` : ''}`);
      setFormClientDocument(selected.document);
    }
  };

  const handleAddItem = () => {
    const newItem: QuoteItem = {
      id: `item-${Date.now()}`,
      type: 'Serviço',
      description: '',
      quantity: 1,
      unit: 'serviço',
      unitPrice: 0,
      total: 0
    };
    setFormItems([...formItems, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    if (formItems.length === 1) {
      alert('O orçamento deve possuir ao menos 1 item discriminado.');
      return;
    }
    setFormItems(formItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof QuoteItem, value: any) => {
    const updated = [...formItems];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto calculate total
    if (field === 'quantity' || field === 'unitPrice') {
      const q = field === 'quantity' ? Number(value) : updated[index].quantity;
      const p = field === 'unitPrice' ? Number(value) : updated[index].unitPrice;
      updated[index].total = Math.max(0, q * p);
    }
    setFormItems(updated);
  };

  const calculateSubtotal = () => {
    return formItems.reduce((acc, item) => acc + (item.total || 0), 0);
  };

  const calculateTotal = () => {
    const sub = calculateSubtotal();
    return Math.max(0, sub - (formDiscount || 0));
  };

  const handleSubmitQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formClientName || formItems.length === 0) {
      alert('Preencha o cliente e inclua ao menos um item de serviço ou peça.');
      return;
    }

    const subtotal = calculateSubtotal();
    const total = calculateTotal();

    const quoteToSave: Quote = {
      id: editingQuote ? editingQuote.id : `orc-${Date.now()}`,
      number: editingQuote ? editingQuote.number : `ORC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      clientId: formClientId || `cli-${Date.now()}`,
      clientName: formClientName,
      clientPhone: formClientPhone,
      clientEmail: formClientEmail,
      clientAddress: formClientAddress,
      clientCep: formClientCep.trim() || undefined,
      clientDocument: formClientDocument,
      equipmentDescription: formEquipmentDescription,
      items: formItems,
      subtotal,
      discount: formDiscount,
      total,
      paymentTerms: formPaymentTerms,
      validityDays: formValidityDays,
      warrantyTerms: formWarrantyTerms,
      technicianObservations: formTechnicianObservations,
      status: formStatus,
      createdAt: editingQuote ? editingQuote.createdAt : new Date().toISOString().slice(0, 10),
      approvedAt: formStatus === 'Aprovado' ? (editingQuote?.approvedAt || new Date().toISOString().slice(0, 10)) : undefined
    };

    onSaveQuote(quoteToSave);
    setIsEditorOpen(false);
    setPreviewQuote(quoteToSave);
  };

  const handleUpdateStatus = (quote: Quote, newStatus: QuoteStatus) => {
    const updated: Quote = {
      ...quote,
      status: newStatus,
      approvedAt: newStatus === 'Aprovado' ? new Date().toISOString().slice(0, 10) : quote.approvedAt
    };
    onSaveQuote(updated);
    if (previewQuote && previewQuote.id === quote.id) {
      setPreviewQuote(updated);
    }
  };

  const filteredQuotes = quotes.filter(q => {
    const matchesStatus = statusFilter === 'Todos' || q.status === statusFilter;
    const matchesSearch =
      q.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.equipmentDescription.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Emissão de Orçamentos Comerciais</h1>
          <p className="text-slate-500 text-sm">
            Gere orçamentos discriminados para climatização e sistemas de ar condicionado com validade e garantia legal.
          </p>
        </div>

        <button
          id="btn-add-quote"
          onClick={openNewQuoteModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Emitir Novo Orçamento</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por cliente, nº do orçamento, equipamento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm bg-slate-50/50"
          />
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {['Todos', 'Rascunho', 'Enviado', 'Aprovado', 'Faturado', 'Recusado'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === status
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Quotes List */}
      {filteredQuotes.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-semibold text-base">Nenhum orçamento encontrado</p>
          <p className="text-slate-400 text-xs mt-1">Clique no botão acima para criar uma nova proposta comercial.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredQuotes.map((quote) => {
            const signatureLink = `${window.location.origin}/?assinar=${quote.id}`;
            const waText = generateQuoteWhatsAppMessage(
              companySettings.tradeName,
              quote.clientName,
              quote.number,
              quote.total,
              quote.paymentTerms,
              quote.equipmentDescription,
              signatureLink,
              companySettings.phone || '(61) 992848993',
              companySettings.email || 'arsolucoesdf@gmail.com'
            );
            const waLink = createWhatsAppLink(quote.clientPhone, waText);

            return (
              <div
                key={quote.id}
                className="bg-white rounded-xl border border-slate-200/90 shadow-xs hover:border-sky-400 transition-all p-5 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  
                  {/* Top: Number & Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                        {quote.number}
                      </span>
                      {quote.signature && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Assinado Online</span>
                        </span>
                      )}
                    </div>

                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                      quote.status === 'Aprovado' || quote.status === 'Faturado'
                        ? 'bg-emerald-100 text-emerald-800'
                        : quote.status === 'Enviado'
                        ? 'bg-amber-100 text-amber-800'
                        : quote.status === 'Recusado'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {quote.status}
                    </span>
                  </div>

                  {/* Client and Equipment */}
                  <div>
                    <h3 className="font-bold text-base text-slate-900 leading-snug line-clamp-1">
                      {quote.clientName}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium line-clamp-1 mt-0.5">
                      ❄️ {quote.equipmentDescription}
                    </p>
                    {quote.clientAddress && (
                      <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between gap-2">
                        <p className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-sky-600 shrink-0" />
                          <span className="truncate">{quote.clientAddress}</span>
                        </p>
                        <RouteButton
                          address={quote.clientAddress}
                          cep={quote.clientCep}
                          size="sm"
                          variant="outline"
                        />
                      </div>
                    )}
                  </div>

                  {/* Items summary */}
                  <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1">
                    <p className="font-semibold text-slate-700">{quote.items.length} item(ns) discriminado(s):</p>
                    <ul className="list-disc list-inside text-[11px] text-slate-500 space-y-0.5">
                      {quote.items.slice(0, 2).map((it, idx) => (
                        <li key={idx} className="truncate">
                          {it.description}
                        </li>
                      ))}
                      {quote.items.length > 2 && (
                        <li className="text-sky-600 font-medium list-none pl-1">
                          + {quote.items.length - 2} outros serviços/peças...
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* Total Value */}
                  <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
                    <span className="text-xs text-slate-500">Valor Total:</span>
                    <span className="text-xl font-extrabold text-slate-900 font-mono">
                      {formatCurrency(quote.total)}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    Emitido em: {formatDateBR(quote.createdAt)} • Validade: {quote.validityDays} dias
                  </p>

                </div>

                {/* Footer Buttons */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPreviewQuote(quote)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-semibold transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </button>

                    <button
                      onClick={() => handleCopySignatureLink(quote.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        copiedQuoteId === quote.id
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                      }`}
                      title="Copiar link para o cliente assinar online (sem login)"
                    >
                      {copiedQuoteId === quote.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Copiado!</span>
                        </>
                      ) : (
                        <>
                          <PenTool className="w-3.5 h-3.5" />
                          <span>Assinar</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                      title="Enviar resumo por WhatsApp"
                    >
                      <Phone className="w-4 h-4" />
                    </a>

                    <button
                      onClick={() => openEditQuoteModal(quote)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-slate-100 transition-colors"
                      title="Editar Orçamento"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Deseja excluir o orçamento ${quote.number}?`)) {
                          onDeleteQuote(quote.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Excluir Orçamento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create/Edit Quote */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">
                {editingQuote ? `Editar Orçamento ${editingQuote.number}` : 'Emitir Novo Orçamento Comercial'}
              </h2>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitQuote} className="mt-4 space-y-5">
              
              {/* Client Selection / Information */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  1. Dados do Cliente
                </h3>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Selecionar Cliente Cadastrado
                  </label>
                  <select
                    value={formClientId}
                    onChange={(e) => handleClientSelectChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value="">-- Cliente não cadastrado / Avulso --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.document})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Razão Social / Nome do Cliente *
                    </label>
                    <input
                      type="text"
                      required
                      value={formClientName}
                      onChange={(e) => setFormClientName(e.target.value)}
                      placeholder="Nome do cliente ou empresa"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      CNPJ / CPF
                    </label>
                    <input
                      type="text"
                      value={formClientDocument}
                      onChange={(e) => setFormClientDocument(e.target.value)}
                      placeholder="00.000.000/0001-00"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Telefone / WhatsApp
                    </label>
                    <input
                      type="text"
                      value={formClientPhone}
                      onChange={(e) => setFormClientPhone(e.target.value)}
                      placeholder="(11) 98765-4321"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      E-mail
                    </label>
                    <input
                      type="email"
                      value={formClientEmail}
                      onChange={(e) => setFormClientEmail(e.target.value)}
                      placeholder="financeiro@empresa.com.br"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                    />
                  </div>
                </div>

                {/* Address block with CEP search & auto-fill */}
                <div className="p-3 bg-slate-50/90 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-sky-600" />
                      Endereço de Instalação / Obra
                    </label>
                    {formClientAddress.trim() && (
                      <a
                        href={getGoogleMapsRouteUrl(formClientAddress, formClientCep)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
                        title="Testar rota no aplicativo de navegação"
                      >
                        <Navigation className="w-3 h-3" /> Testar GPS
                      </a>
                    )}
                  </div>

                  {/* CEP Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      CEP (digite os 8 dígitos para buscar o endereço automaticamente)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={formClientCep}
                        onChange={(e) => handleQuoteCepChange(e.target.value)}
                        placeholder="Ex: 01451-001"
                        maxLength={9}
                        className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono bg-white focus:ring-2 focus:ring-sky-500"
                      />
                      <button
                        type="button"
                        disabled={isSearchingCep}
                        onClick={() => performQuoteCepLookup()}
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
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Endereço Completo de Instalação / Local da Obra
                    </label>
                    <input
                      type="text"
                      value={formClientAddress}
                      onChange={(e) => setFormClientAddress(e.target.value)}
                      placeholder="Av. Paulista, 1000 - Bela Vista, São Paulo - SP"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>
              </div>

              {/* Equipment Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  2. Equipamento / Objeto da Proposta
                </label>
                <input
                  type="text"
                  required
                  value={formEquipmentDescription}
                  onChange={(e) => setFormEquipmentDescription(e.target.value)}
                  placeholder="Ex: 02x Split Cassete Carrier 36.000 BTU / 01x VRF Inverter 10 HP"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Items Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    3. Discriminação dos Serviços & Peças
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700 px-2 py-1 rounded bg-sky-50 hover:bg-sky-100 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Linha</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {formItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col md:flex-row gap-2 items-start md:items-center"
                    >
                      <div className="w-full md:w-32 shrink-0">
                        <select
                          value={item.type}
                          onChange={(e) => handleItemChange(index, 'type', e.target.value)}
                          className="w-full px-2 py-1.5 text-xs rounded border border-slate-300 bg-white font-medium"
                        >
                          <option value="Serviço">Serviço</option>
                          <option value="Peça / Material">Peça / Mat.</option>
                        </select>
                      </div>

                      <div className="w-full md:flex-1">
                        <input
                          type="text"
                          required
                          placeholder="Descrição detalhada do serviço ou peça aplicada..."
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 bg-white"
                        />
                      </div>

                      <div className="flex items-center gap-2 w-full md:w-auto">
                        <div className="w-16">
                          <input
                            type="number"
                            min="1"
                            step="0.1"
                            required
                            placeholder="Qtd"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 text-xs text-center rounded border border-slate-300 bg-white"
                          />
                        </div>

                        <div className="w-16">
                          <select
                            value={item.unit}
                            onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                            className="w-full px-1 py-1.5 text-xs text-center rounded border border-slate-300 bg-white"
                          >
                            <option value="un">un</option>
                            <option value="serviço">serv</option>
                            <option value="hr">hr</option>
                            <option value="kg">kg</option>
                            <option value="m">m</option>
                            <option value="pç">pç</option>
                          </select>
                        </div>

                        <div className="w-24">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            required
                            placeholder="R$ Unit"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 text-xs text-right rounded border border-slate-300 bg-white font-mono"
                          />
                        </div>

                        <div className="w-24 text-right font-mono font-bold text-xs text-slate-800">
                          {formatCurrency(item.total)}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          title="Remover Item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Subtotal, Discount, and Total Summary */}
                <div className="bg-slate-100 p-4 rounded-xl space-y-2 max-w-sm ml-auto">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono font-medium">{formatCurrency(calculateSubtotal())}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>Desconto Comercial (R$):</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formDiscount}
                      onChange={(e) => setFormDiscount(parseFloat(e.target.value) || 0)}
                      className="w-24 px-2 py-1 text-right text-xs rounded border border-slate-300 bg-white font-mono"
                    />
                  </div>

                  <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                    <span>VALOR TOTAL:</span>
                    <span className="font-mono text-sky-700">{formatCurrency(calculateTotal())}</span>
                  </div>
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Condições de Pagamento *
                  </label>
                  <input
                    type="text"
                    required
                    value={formPaymentTerms}
                    onChange={(e) => setFormPaymentTerms(e.target.value)}
                    placeholder="Ex: 50% de entrada + 50% na conclusão ou 3x sem juros"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Validade da Proposta (Dias)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formValidityDays}
                    onChange={(e) => setFormValidityDays(parseInt(e.target.value) || 15)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Termo de Garantia Técnica
                </label>
                <input
                  type="text"
                  value={formWarrantyTerms}
                  onChange={(e) => setFormWarrantyTerms(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observações Técnicas / Recomendações
                </label>
                <textarea
                  rows={2}
                  value={formTechnicianObservations}
                  onChange={(e) => setFormTechnicianObservations(e.target.value)}
                  placeholder="Ex: Ponto de força e disjuntor de proteção dedicado por conta do cliente..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status Inicial
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as QuoteStatus)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                >
                  <option value="Rascunho">Rascunho</option>
                  <option value="Enviado">Enviado ao Cliente</option>
                  <option value="Aprovado">Aprovado pelo Cliente</option>
                  <option value="Faturado">Faturado</option>
                  <option value="Recusado">Recusado</option>
                </select>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm shadow-sm transition-all"
                >
                  {editingQuote ? 'Salvar Proposta' : 'Gerar e Visualizar Orçamento'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Official Printable Quotation Modal / Sheet */}
      {previewQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[96vh] overflow-y-auto shadow-2xl border border-slate-300 p-6 sm:p-10 my-auto">
            
            {/* Top Bar for user controls (not printed) */}
            <div className="no-print flex items-center justify-between pb-4 mb-6 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded border border-sky-200">
                  {previewQuote.number}
                </span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  previewQuote.status === 'Aprovado' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  Status: {previewQuote.status}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {previewQuote.status !== 'Aprovado' && (
                  <button
                    onClick={() => handleUpdateStatus(previewQuote, 'Aprovado')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Marcar como Aprovado</span>
                  </button>
                )}

                {onScheduleVisitFromQuote && previewQuote.status === 'Aprovado' && (
                  <button
                    onClick={() => {
                      onScheduleVisitFromQuote(previewQuote);
                      setPreviewQuote(null);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-xs"
                  >
                    <CalendarCheck className="w-3.5 h-3.5" />
                    <span>Agendar Visita Técnica</span>
                  </button>
                )}

                <button
                  onClick={() => handleCopySignatureLink(previewQuote.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200"
                  title="Copiar link exclusivo de assinatura para o cliente"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>{copiedQuoteId === previewQuote.id ? 'Link Copiado!' : 'Copiar Link p/ Cliente Assinar'}</span>
                </button>

                <a
                  href={`/?assinar=${previewQuote.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                  title="Abrir a tela pública de assinatura online"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Portal do Cliente</span>
                </a>

                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir / PDF</span>
                </button>

                <button
                  onClick={() => setPreviewQuote(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Document Body */}
            <div className="print-card space-y-6 text-slate-900">
              
              {/* Document Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-slate-900 pb-6 gap-4">
                <div>
                  <div className="mb-2">
                    <BrandLogo size="lg" theme="light" showSubtitle={true} />
                  </div>
                  <h2 className="text-xs font-bold tracking-tight text-slate-800 uppercase">
                    {companySettings.companyName}
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    CNPJ: {companySettings.cnpj}
                  </p>
                  <p className="text-xs text-slate-600">
                    {companySettings.address}
                  </p>
                  <p className="text-xs text-slate-600">
                    Tel / WhatsApp: {companySettings.phone} • E-mail: {companySettings.email}
                  </p>
                </div>

                <div className="sm:text-right">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400 block">Proposta Comercial</span>
                  <span className="text-2xl font-mono font-black text-slate-900 block">{previewQuote.number}</span>
                  <p className="text-xs text-slate-500 mt-1">Data: {formatDateBR(previewQuote.createdAt)}</p>
                  <p className="text-xs text-slate-500">Validade: {previewQuote.validityDays} dias</p>
                </div>
              </div>

              {/* Client and Target Equipment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Destinatário / Cliente</p>
                  <p className="font-bold text-slate-900 text-sm">{previewQuote.clientName}</p>
                  {previewQuote.clientDocument && <p className="text-slate-600">Doc: {previewQuote.clientDocument}</p>}
                  <div className="text-slate-600 flex items-start gap-1.5 my-0.5">
                    <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5 print:hidden" />
                    <div>
                      <a
                        href={getGoogleMapsRouteUrl(previewQuote.clientAddress, previewQuote.clientCep)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline hover:text-sky-700 decoration-sky-400 print:no-underline print:text-slate-600"
                        title="Abrir rota no aplicativo de navegação"
                      >
                        {previewQuote.clientAddress}
                      </a>
                      {previewQuote.clientCep && (
                        <span className="block text-[11px] font-mono text-slate-500 mt-0.5">
                          CEP: {previewQuote.clientCep}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-slate-600">Tel: {previewQuote.clientPhone}</p>
                  {previewQuote.clientEmail && <p className="text-slate-600">E-mail: {previewQuote.clientEmail}</p>}
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Equipamento / Instalação</p>
                  <p className="font-bold text-slate-800">{previewQuote.equipmentDescription}</p>
                  <p className="text-slate-500 mt-1 leading-relaxed">
                    Atendimento técnico especializado conforme normas da ABNT e recomendações do fabricante.
                  </p>
                  <p className="text-slate-700 font-medium mt-2">
                    Responsável: {companySettings.technicianResponsible}
                  </p>
                </div>
              </div>

              {/* Itemized Table */}
              <div>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-300 text-slate-600 text-[11px] uppercase tracking-wider font-semibold">
                      <th className="py-2 px-2 w-16">Tipo</th>
                      <th className="py-2 px-2">Descrição dos Serviços e Materiais</th>
                      <th className="py-2 px-2 text-center w-16">Qtd</th>
                      <th className="py-2 px-2 text-center w-16">Un</th>
                      <th className="py-2 px-2 text-right w-24">V. Unitário</th>
                      <th className="py-2 px-2 text-right w-24">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {previewQuote.items.map((item, index) => (
                      <tr key={index} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-2">
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                            item.type === 'Serviço' ? 'bg-sky-100 text-sky-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {item.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 font-medium text-slate-800">
                          {item.description}
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono">{item.quantity}</td>
                        <td className="py-2.5 px-2 text-center text-slate-500">{item.unit}</td>
                        <td className="py-2.5 px-2 text-right font-mono">{formatCurrency(item.unitPrice)}</td>
                        <td className="py-2.5 px-2 text-right font-mono font-semibold">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Breakdown */}
              <div className="flex justify-end pt-2">
                <div className="w-72 bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono">{formatCurrency(previewQuote.subtotal)}</span>
                  </div>
                  {previewQuote.discount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Desconto Especial:</span>
                      <span className="font-mono">- {formatCurrency(previewQuote.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-slate-900 pt-1.5 border-t border-slate-200">
                    <span>TOTAL GERAL:</span>
                    <span className="font-mono text-base text-sky-800">{formatCurrency(previewQuote.total)}</span>
                  </div>
                </div>
              </div>

              {/* Conditions, Warranty and Observations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
                <div className="space-y-2 border border-slate-200 p-3 rounded-lg bg-white">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <CreditCard className="w-3.5 h-3.5 text-sky-600" />
                    <span>Condições de Pagamento</span>
                  </div>
                  <p className="text-slate-600">{previewQuote.paymentTerms}</p>
                  {companySettings.pixKey && (
                    <p className="text-[11px] text-slate-500 font-mono">
                      Chave PIX: {companySettings.pixKey}
                    </p>
                  )}
                </div>

                <div className="space-y-2 border border-slate-200 p-3 rounded-lg bg-white">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Termo de Garantia</span>
                  </div>
                  <p className="text-slate-600">{previewQuote.warrantyTerms}</p>
                </div>
              </div>

              {previewQuote.technicianObservations && (
                <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <strong className="text-slate-800 font-semibold block mb-0.5">Observações Técnicas:</strong>
                  {previewQuote.technicianObservations}
                </div>
              )}

              {/* Signature Lines for formal sign-off */}
              <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
                <div className="border-t border-slate-400 pt-2 flex flex-col items-center">
                  <div className="h-12 flex items-center justify-center">
                    <span className="font-serif italic text-base text-slate-700">
                      {companySettings.technicianResponsible}
                    </span>
                  </div>
                  <p className="font-bold text-slate-800">{companySettings.technicianResponsible}</p>
                  <p className="text-slate-500">{companySettings.tradeName || 'Ar Soluções Climatização'} • Responsável Técnico</p>
                </div>

                <div className="border-t border-slate-400 pt-2 flex flex-col items-center">
                  {previewQuote.signature ? (
                    <div className="flex flex-col items-center w-full">
                      <div className="h-12 flex items-center justify-center">
                        {previewQuote.signature.signatureDataUrl ? (
                          <img
                            src={previewQuote.signature.signatureDataUrl}
                            alt="Assinatura do Cliente"
                            className="max-h-11 max-w-full object-contain"
                          />
                        ) : (
                          <span className="font-serif italic text-base font-bold text-sky-900">
                            {previewQuote.signature.signedBy}
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-slate-800">{previewQuote.signature.signedBy}</p>
                      {previewQuote.signature.documentNumber && (
                        <p className="text-slate-500 text-[10px]">Doc: {previewQuote.signature.documentNumber}</p>
                      )}
                      <span className="mt-1 inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Assinado Online em {new Date(previewQuote.signature.signedAt).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                      <div className="h-12 flex items-center justify-center text-slate-400 italic text-[11px]">
                        (Aguardando assinatura digital do cliente)
                      </div>
                      <p className="font-bold text-slate-800">{previewQuote.clientName}</p>
                      <p className="text-slate-500">De acordo do Cliente (Assinatura Eletrônica)</p>
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
