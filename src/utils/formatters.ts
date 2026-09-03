export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDateBR(dateString: string): string {
  if (!dateString) return '-';
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('pt-BR');
  } catch {
    return dateString;
  }
}

export function formatDateTimeBR(dateString: string): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

export function cleanPhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function createWhatsAppLink(phone: string, text: string): string {
  const digits = cleanPhone(phone);
  const fullPhone = digits.startsWith('55') ? digits : `55${digits}`;
  const encodedText = encodeURIComponent(text);
  return `https://wa.me/${fullPhone}?text=${encodedText}`;
}

export function generateVisitConfirmationMessage(
  companyName: string,
  clientName: string,
  date: string,
  timeWindow: string,
  technicianName: string,
  serviceType: string
): string {
  return `Olá, ${clientName}! Aqui é da *${companyName}*.
Confirmamos o agendamento da sua visita técnica:
📅 Data: *${formatDateBR(date)}*
⏰ Horário: *${timeWindow}*
👨‍🔧 Técnico Responsável: *${technicianName}*
🛠️ Serviço: *${serviceType}*

Caso precise reagendar ou tenha alguma dúvida, estamos à disposição!`;
}

export function generateQuoteWhatsAppMessage(
  companyName: string,
  clientName: string,
  quoteNumber: string,
  total: number,
  paymentTerms: string,
  equipment: string
): string {
  return `Olá, ${clientName}! Segue o orçamento da *${companyName}*:
📄 Orçamento: *#${quoteNumber}*
❄️ Equipamento: *${equipment}*
💰 Valor Total: *${formatCurrency(total)}*
💳 Condições: *${paymentTerms}*

Ficamos à disposição para esclarecer qualquer dúvida e iniciar os serviços!`;
}
