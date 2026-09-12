import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import {
  Client,
  Equipment,
  TechnicalVisit,
  Quote,
  MaintenanceLog,
  CompanySettings
} from '../types';

export interface SyncedDataPayload {
  clients: Client[];
  equipment: Equipment[];
  visits: TechnicalVisit[];
  quotes: Quote[];
  maintenanceLogs: MaintenanceLog[];
  companySettings: CompanySettings;
}

export type SyncStatus = 'synced' | 'saving' | 'offline' | 'updated_remotely';

type RemoteUpdateCallback = (data: SyncedDataPayload, version: number) => void;
type StatusCallback = (status: SyncStatus, lastUpdated: string | null) => void;

class SyncService {
  private currentVersion = 0;
  private lastUpdated: string | null = null;
  private status: SyncStatus = 'synced';
  private remoteUpdateListeners: Set<RemoteUpdateCallback> = new Set();
  private statusListeners: Set<StatusCallback> = new Set();
  private saveTimeout: ReturnType<typeof setTimeout> | null = null;
  private isPushing = false;
  private hasPendingPush = false;
  private pendingPayload: SyncedDataPayload | null = null;
  private pollingInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.initRealtimeListeners();
  }

  public getStatus(): { status: SyncStatus; lastUpdated: string | null; version: number } {
    return {
      status: this.status,
      lastUpdated: this.lastUpdated,
      version: this.currentVersion,
    };
  }

  public subscribeStatus(cb: StatusCallback): () => void {
    this.statusListeners.add(cb);
    cb(this.status, this.lastUpdated);
    return () => this.statusListeners.delete(cb);
  }

  public subscribeRemoteUpdates(cb: RemoteUpdateCallback): () => void {
    this.remoteUpdateListeners.add(cb);
    return () => this.remoteUpdateListeners.delete(cb);
  }

  private setStatus(newStatus: SyncStatus) {
    this.status = newStatus;
    this.statusListeners.forEach(cb => cb(newStatus, this.lastUpdated));
  }

  private notifyRemoteUpdate(data: SyncedDataPayload, version: number) {
    this.remoteUpdateListeners.forEach(cb => cb(data, version));
  }

  /**
   * Initializes background polling and real-time listeners for instant cross-device updates
   */
  private initRealtimeListeners() {
    // 1. Check when window/tab regains focus (e.g. user unlocks phone or switches back from WhatsApp)
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', () => {
        this.checkRemoteVersion();
      });
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.checkRemoteVersion();
        }
      });
    }

    // 2. Periodic background check every 7 seconds
    if (typeof window !== 'undefined') {
      this.pollingInterval = setInterval(() => {
        if (!this.isPushing) {
          this.checkRemoteVersion();
        }
      }, 7000);
    }

    // 3. Firestore real-time listener (if connected)
    try {
      const docRef = doc(db, 'company_data', 'current');
      onSnapshot(docRef, (snapshot) => {
        if (snapshot.exists()) {
          const remote = snapshot.data() as SyncedDataPayload & { version?: number; lastUpdated?: string };
          const remoteVersion = remote.version || 0;
          if (remoteVersion > this.currentVersion && !this.isPushing) {
            this.currentVersion = remoteVersion;
            this.lastUpdated = remote.lastUpdated || new Date().toISOString();
            this.setStatus('updated_remotely');
            this.notifyRemoteUpdate(remote, remoteVersion);
            setTimeout(() => this.setStatus('synced'), 2500);
          }
        }
      }, (err) => {
        // Silently fallback to server /api/sync if firestore has network or rule limitations
        console.warn('Firestore snapshot fallback to API sync:', err?.message);
      });
    } catch (err) {
      console.warn('Firestore onSnapshot init skip:', err);
    }
  }

  /**
   * Checks if another device has uploaded newer data to the server
   */
  public async checkRemoteVersion(): Promise<boolean> {
    try {
      const res = await fetch('/api/sync/status', {
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (!res.ok) return false;
      const statusData = await res.json();

      if (statusData.exists && statusData.version > this.currentVersion) {
        return await this.pullRemoteData();
      }
    } catch {
      // offline
    }
    return false;
  }

  /**
   * Fetches full remote data from the central server
   */
  public async pullRemoteData(): Promise<boolean> {
    try {
      const res = await fetch('/api/sync', {
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (!res.ok) return false;
      const data = await res.json();

      if (data.exists && data.version > this.currentVersion) {
        this.currentVersion = data.version;
        this.lastUpdated = data.lastUpdated;
        this.setStatus('updated_remotely');
        this.notifyRemoteUpdate({
          clients: data.clients || [],
          equipment: data.equipment || [],
          visits: data.visits || [],
          quotes: data.quotes || [],
          maintenanceLogs: data.maintenanceLogs || [],
          companySettings: data.companySettings
        }, data.version);

        setTimeout(() => this.setStatus('synced'), 2500);
        return true;
      }
    } catch (err) {
      console.warn('Falha ao baixar atualização remota:', err);
    }
    return false;
  }

  /**
   * Automatically queues and pushes changes to the central server and cloud
   */
  public queuePush(payload: SyncedDataPayload, immediate = false) {
    this.pendingPayload = payload;
    this.setStatus('saving');

    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    const delay = immediate ? 50 : 600; // Debounce 600ms for typing, instant for button clicks
    this.saveTimeout = setTimeout(() => {
      this.executePush();
    }, delay);
  }

  private async executePush() {
    if (!this.pendingPayload) return;
    if (this.isPushing) {
      this.hasPendingPush = true;
      return;
    }

    this.isPushing = true;
    const payloadToPush = this.pendingPayload;
    this.pendingPayload = null;
    this.hasPendingPush = false;

    try {
      // 1. Push to server /api/sync
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...payloadToPush,
          clientVersion: this.currentVersion,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        this.currentVersion = result.version;
        this.lastUpdated = result.lastUpdated;
        this.setStatus('synced');
      } else {
        this.setStatus('offline');
      }

      // 2. Also try writing to Firestore as cloud backup
      try {
        const docRef = doc(db, 'company_data', 'current');
        await setDoc(docRef, {
          ...payloadToPush,
          version: this.currentVersion,
          lastUpdated: this.lastUpdated || new Date().toISOString(),
        }, { merge: true });
      } catch {
        // Firestore write optional secondary sync
      }
    } catch (err) {
      console.warn('Erro ao salvar sincronização na nuvem:', err);
      this.setStatus('offline');
    } finally {
      this.isPushing = false;
      if (this.hasPendingPush && this.pendingPayload) {
        this.executePush();
      }
    }
  }

  /**
   * Initializes initial data sync: pulls if remote exists, or seeds remote if server is empty
   */
  public async initializeSync(localData: SyncedDataPayload): Promise<SyncedDataPayload> {
    try {
      const res = await fetch('/api/sync');
      if (res.ok) {
        const remote = await res.json();
        if (remote.exists && remote.clients && remote.clients.length > 0) {
          this.currentVersion = remote.version;
          this.lastUpdated = remote.lastUpdated;
          this.setStatus('synced');
          return {
            clients: remote.clients,
            equipment: remote.equipment || [],
            visits: remote.visits || [],
            quotes: remote.quotes || [],
            maintenanceLogs: remote.maintenanceLogs || [],
            companySettings: remote.companySettings || localData.companySettings,
          };
        } else {
          // Central database is empty, seed it with our initial company data
          this.queuePush(localData, true);
        }
      }
    } catch (err) {
      console.warn('Inicialização da sincronização em modo local:', err);
      this.setStatus('offline');
    }
    return localData;
  }
}

export const syncService = new SyncService();
