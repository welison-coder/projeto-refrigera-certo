import { TechnicalVisit } from '../types';

/**
 * Extracts start and end Date objects from visit.date ('YYYY-MM-DD')
 * and visit.timeWindow ('HH:mm - HH:mm' or similar).
 */
export function parseVisitDates(dateStr: string, timeWindow: string): { startDate: Date; endDate: Date } {
  // Default to 09:00 - 10:00 if timeWindow parsing fails
  let startHour = 9;
  let startMinute = 0;
  let endHour = 10;
  let endMinute = 0;

  if (timeWindow) {
    const matches = timeWindow.match(/(\d{1,2})[:hH](\d{2})?\s*[-–aàs/]*\s*(\d{1,2})?[:hH]?(\d{2})?/);
    if (matches) {
      if (matches[1]) startHour = parseInt(matches[1], 10);
      if (matches[2]) startMinute = parseInt(matches[2], 10);

      if (matches[3]) {
        endHour = parseInt(matches[3], 10);
        if (matches[4]) endMinute = parseInt(matches[4], 10);
      } else {
        endHour = startHour + 1;
        endMinute = startMinute;
      }
    }
  }

  const [year, month, day] = (dateStr || new Date().toISOString().slice(0, 10))
    .split('-')
    .map(n => parseInt(n, 10));

  const startDate = new Date(year, (month || 1) - 1, day || 1, startHour, startMinute, 0);
  const endDate = new Date(year, (month || 1) - 1, day || 1, endHour, endMinute, 0);

  // If end date is before or equal to start date, advance 1 hour
  if (endDate <= startDate) {
    endDate.setHours(startDate.getHours() + 1);
  }

  return { startDate, endDate };
}

/**
 * Formats a Date into compact YYYYMMDDTHHmmss string for Google Calendar & iCalendar
 */
function toCalendarDateTimeString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const min = pad(date.getMinutes());
  const s = pad(date.getSeconds());
  return `${y}${m}${d}T${h}${min}${s}`;
}

/**
 * Generates direct Google Calendar URL with reminder parameters.
 * When clicked on an Android phone or browser, it opens the calendar with event & alarm ready.
 */
export function generateGoogleCalendarUrl(visit: TechnicalVisit, companyName: string = 'Refrigera Certo'): string {
  const { startDate, endDate } = parseVisitDates(visit.date, visit.timeWindow);
  const startStr = toCalendarDateTimeString(startDate);
  const endStr = toCalendarDateTimeString(endDate);

  const title = `Visita Técnica: ${visit.clientName} (${visit.serviceType}) - ${companyName}`;
  const details = [
    `🛠️ Serviço: ${visit.serviceType}`,
    `👤 Cliente: ${visit.clientName}`,
    `📞 Telefone/WhatsApp: ${visit.clientPhone}`,
    `📍 Endereço: ${visit.clientAddress}`,
    `👨‍🔧 Técnico Responsável: ${visit.technicianName}`,
    visit.reportedIssue ? `⚠️ Problema Relatado: ${visit.reportedIssue}` : '',
    visit.notes ? `📝 Obs: ${visit.notes}` : '',
    '',
    `Empresa: ${companyName}`
  ].filter(Boolean).join('\n');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${startStr}/${endStr}`,
    details: details,
    location: visit.clientAddress,
    sf: 'true',
    output: 'xml'
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generates an RFC 5545 standard .ICS file string with native mobile VALARM (reminder notification).
 * Works automatically on iPhone (Apple Calendar / Reminders), Android, Outlook, etc.
 */
export function generateICSContent(
  visit: TechnicalVisit,
  companyName: string = 'Refrigera Certo',
  reminderMinutes: number = 60
): string {
  const { startDate, endDate } = parseVisitDates(visit.date, visit.timeWindow);
  const startStr = toCalendarDateTimeString(startDate);
  const endStr = toCalendarDateTimeString(endDate);
  const nowStr = toCalendarDateTimeString(new Date());

  const cleanText = (str: string) =>
    str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

  const summary = cleanText(`Visita Técnica: ${visit.clientName} (${visit.serviceType})`);
  const description = cleanText(
    `Serviço: ${visit.serviceType}\nCliente: ${visit.clientName} (${visit.clientPhone})\nTécnico: ${visit.technicianName}\nLocal: ${visit.clientAddress}\nProblema: ${visit.reportedIssue || 'Atendimento técnico programado'}\nEmpresa: ${companyName}`
  );
  const location = cleanText(visit.clientAddress);

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Refrigera Certo//Gestao Climatizacao//PT-BR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:vis-${visit.id}-${Date.now()}@refrigeracerto.com.br`,
    `DTSTAMP:${nowStr}`,
    `DTSTART:${startStr}`,
    `DTEND:${endStr}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    'STATUS:CONFIRMED',
    // Mobile Alarm / Push Notification Trigger (configured minutes prior)
    'BEGIN:VALARM',
    `TRIGGER:-PT${reminderMinutes}M`,
    'ACTION:DISPLAY',
    `DESCRIPTION:Lembrete: Visita Técnica em ${cleanText(visit.clientName)} (${visit.timeWindow})`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

/**
 * Triggers a download of the .ICS file on the user's mobile device or computer.
 * On smartphones (iPhone/Samsung/Android), this immediately triggers "Adicionar ao Calendário com Alarme".
 */
export function downloadICSFile(
  visit: TechnicalVisit,
  companyName: string = 'Refrigera Certo',
  reminderMinutes: number = 60
): void {
  const icsContent = generateICSContent(visit, companyName, reminderMinutes);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  const safeClient = visit.clientName.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 20);
  link.download = `Lembrete_Visita_${safeClient}_${visit.date}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Opens Google Calendar directly in a new tab or native mobile app.
 */
export function openGoogleCalendarReminder(visit: TechnicalVisit, companyName: string = 'Refrigera Certo'): void {
  const url = generateGoogleCalendarUrl(visit, companyName);
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Web Notification API: Requests permission and triggers local phone/browser reminder if supported
 */
export async function requestMobileNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied';
  }
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  return await Notification.requestPermission();
}

export function triggerImmediateNotification(title: string, body: string): boolean {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return false;
  }
  try {
    new Notification(title, {
      body: body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: [200, 100, 200]
    } as NotificationOptions);
    return true;
  } catch (err) {
    console.warn('Could not trigger notification:', err);
    return false;
  }
}
