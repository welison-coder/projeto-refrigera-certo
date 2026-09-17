/**
 * Serviço de Backup Automático Diário - Ar Soluções Climatização
 * Realiza o download automático do backup do sistema todos os dias às 18:00.
 */

import { storage } from '../utils/storage';

const STORAGE_KEYS = {
  LAST_AUTO_BACKUP_DATE: 'ar_solucoes_last_auto_backup_date',
  LAST_AUTO_BACKUP_TIMESTAMP: 'ar_solucoes_last_auto_backup_timestamp',
  LAST_AUTO_BACKUP_FILENAME: 'ar_solucoes_last_auto_backup_filename',
  AUTO_BACKUP_ENABLED: 'ar_solucoes_auto_backup_enabled',
};

export const AUTO_BACKUP_EVENT = 'ar-auto-backup-completed';

export interface AutoBackupInfo {
  enabled: boolean;
  targetHour: number; // 18 (18h)
  doneToday: boolean;
  lastDate: string | null;
  lastTimestamp: string | null;
  lastFilename: string | null;
  nextRunText: string;
}

/**
 * Retorna a data local no formato YYYY-MM-DD
 */
export function getLocalTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Verifica se o backup das 18h já foi gerado e baixado hoje
 */
export function isAutoBackupDoneToday(): boolean {
  try {
    const today = getLocalTodayDateString();
    const lastDate = localStorage.getItem(STORAGE_KEYS.LAST_AUTO_BACKUP_DATE);
    return lastDate === today;
  } catch {
    return false;
  }
}

/**
 * Retorna o status atual do backup automático para exibição nos componentes
 */
export function getAutoBackupStatus(): AutoBackupInfo {
  const today = getLocalTodayDateString();
  const lastDate = localStorage.getItem(STORAGE_KEYS.LAST_AUTO_BACKUP_DATE);
  const lastTimestamp = localStorage.getItem(STORAGE_KEYS.LAST_AUTO_BACKUP_TIMESTAMP);
  const lastFilename = localStorage.getItem(STORAGE_KEYS.LAST_AUTO_BACKUP_FILENAME);
  const doneToday = lastDate === today;

  const now = new Date();
  const currentHour = now.getHours();

  let nextRunText = '';
  if (doneToday) {
    nextRunText = 'Amanhã às 18:00';
  } else if (currentHour < 18) {
    nextRunText = 'Hoje às 18:00';
  } else {
    nextRunText = 'Programado para agora (18:00+)';
  }

  return {
    enabled: true,
    targetHour: 18,
    doneToday,
    lastDate,
    lastTimestamp,
    lastFilename,
    nextRunText
  };
}

/**
 * Executa a checagem e dispara o download do backup se for >= 18:00 e ainda não tiver sido feito hoje
 */
export function checkAndTriggerDailyBackup(): boolean {
  try {
    const now = new Date();
    const currentHour = now.getHours();
    const today = getLocalTodayDateString();

    // Dispara a partir das 18h (18:00 até 23:59)
    if (currentHour >= 18 && !isAutoBackupDoneToday()) {
      // Grava imediatamente a data para evitar disparos duplicados entre abas ou ticks simultâneos
      localStorage.setItem(STORAGE_KEYS.LAST_AUTO_BACKUP_DATE, today);
      const timestamp = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.LAST_AUTO_BACKUP_TIMESTAMP, timestamp);

      const filename = `ar-solucoes-backup-diario-18h-${today}.json`;
      localStorage.setItem(STORAGE_KEYS.LAST_AUTO_BACKUP_FILENAME, filename);

      // Dispara o download automático
      storage.exportAllData({
        isAutomatic: true,
        customFilename: filename
      });

      // Dispara evento para interface exibir notificação elegante
      if (typeof window !== 'undefined') {
        const detail = {
          date: today,
          timestamp,
          filename,
          timeStr: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };
        window.dispatchEvent(new CustomEvent(AUTO_BACKUP_EVENT, { detail }));
      }

      console.info(`[AutoBackup Ar Soluções] Backup diário das 18h baixado com sucesso: ${filename}`);
      return true;
    }
  } catch (error) {
    console.error('[AutoBackup Ar Soluções] Erro na verificação do backup automático:', error);
  }
  return false;
}

/**
 * Inicia o monitor de backup automático diário
 * Checa a cada 30 segundos e ao reativar a aba
 */
export function startAutoBackupWatcher(
  onBackupTriggered?: (detail: { filename: string; timeStr: string }) => void
): () => void {
  // Listener do evento
  const handleBackupEvent = (event: Event) => {
    const customEvent = event as CustomEvent;
    if (onBackupTriggered && customEvent.detail) {
      onBackupTriggered(customEvent.detail);
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener(AUTO_BACKUP_EVENT, handleBackupEvent);
  }

  // Executa imediatamente na inicialização
  checkAndTriggerDailyBackup();

  // Verifica a cada 30 segundos
  const intervalId = setInterval(() => {
    checkAndTriggerDailyBackup();
  }, 30000);

  // Verifica ao focar ou reabrir a aba do navegador
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      checkAndTriggerDailyBackup();
    }
  };

  const handleWindowFocus = () => {
    checkAndTriggerDailyBackup();
  };

  if (typeof window !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);
  }

  // Cleanup
  return () => {
    clearInterval(intervalId);
    if (typeof window !== 'undefined') {
      window.removeEventListener(AUTO_BACKUP_EVENT, handleBackupEvent);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    }
  };
}

/**
 * Força a execução do backup diário das 18h manualmente (ex: teste do técnico)
 */
export function triggerManualAutoBackupTest(): void {
  const today = getLocalTodayDateString();
  const now = new Date();
  const timestamp = now.toISOString();
  const filename = `ar-solucoes-backup-diario-18h-${today}.json`;

  localStorage.setItem(STORAGE_KEYS.LAST_AUTO_BACKUP_DATE, today);
  localStorage.setItem(STORAGE_KEYS.LAST_AUTO_BACKUP_TIMESTAMP, timestamp);
  localStorage.setItem(STORAGE_KEYS.LAST_AUTO_BACKUP_FILENAME, filename);

  storage.exportAllData({
    isAutomatic: true,
    customFilename: filename
  });

  if (typeof window !== 'undefined') {
    const detail = {
      date: today,
      timestamp,
      filename,
      timeStr: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
    window.dispatchEvent(new CustomEvent(AUTO_BACKUP_EVENT, { detail }));
  }
}
