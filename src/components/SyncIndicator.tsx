import React, { useEffect, useState } from 'react';
import { Cloud, CloudCheck, CloudUpload, RefreshCw, Smartphone } from 'lucide-react';
import { syncService, SyncStatus } from '../services/syncService';

export const SyncIndicator: React.FC = () => {
  const [status, setStatus] = useState<SyncStatus>('synced');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = syncService.subscribeStatus((newStatus, updatedTime) => {
      setStatus(newStatus);
      setLastUpdated(updatedTime);
    });
    return () => unsubscribe();
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await syncService.checkRemoteVersion();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const formattedTime = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : 'Agora';

  return (
    <div
      id="sync-status-indicator"
      onClick={handleManualRefresh}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium cursor-pointer transition-all border shadow-xs ${
        status === 'saving' || isRefreshing
          ? 'bg-amber-950/40 text-amber-300 border-amber-500/30 animate-pulse'
          : status === 'updated_remotely'
          ? 'bg-sky-950/40 text-sky-300 border-sky-500/40 animate-bounce'
          : status === 'offline'
          ? 'bg-rose-950/30 text-rose-300 border-rose-500/30'
          : 'bg-emerald-950/30 text-emerald-300 border-emerald-500/30 hover:bg-emerald-900/40'
      }`}
      title={`Sincronização Nuvem Multi-Aparelho\nÚltima atualização: ${formattedTime}\nClique para forçar verificação`}
    >
      {status === 'saving' || isRefreshing ? (
        <>
          <CloudUpload className="w-3.5 h-3.5 animate-spin text-amber-400" />
          <span className="hidden md:inline">Salvando na nuvem...</span>
          <span className="md:hidden">Salvando...</span>
        </>
      ) : status === 'updated_remotely' ? (
        <>
          <Smartphone className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">Atualizado de outro aparelho</span>
          <span className="sm:hidden">Atualizado</span>
        </>
      ) : status === 'offline' ? (
        <>
          <Cloud className="w-3.5 h-3.5 text-rose-400" />
          <span className="hidden sm:inline">Offline (Salvo local)</span>
          <span className="sm:hidden">Offline</span>
        </>
      ) : (
        <>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <CloudCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden lg:inline">Nuvem Sincronizada</span>
          <span className="lg:hidden hidden sm:inline">Sincronizado</span>
        </>
      )}
      <RefreshCw className={`w-3 h-3 text-slate-400 ml-0.5 opacity-60 hover:opacity-100 ${isRefreshing ? 'animate-spin' : ''}`} />
    </div>
  );
};
