import React, { useState, useRef, useEffect } from 'react';
import { Navigation, ChevronDown, ExternalLink, Copy, Check, Smartphone, MapPin } from 'lucide-react';
import {
  getGoogleMapsRouteUrl,
  getWazeRouteUrl,
  getAppleMapsRouteUrl,
  getAndroidGeoUrl,
  isMobileDevice,
  isIOS,
  isAndroid,
  getCleanGpsDestination
} from '../utils/navigation';

interface RouteButtonProps {
  address: string;
  cep?: string;
  className?: string;
  size?: 'sm' | 'md';
  variant?: 'primary' | 'outline' | 'text';
  showLabel?: boolean;
}

export const RouteButton: React.FC<RouteButtonProps> = ({
  address,
  cep,
  className = '',
  size = 'sm',
  variant = 'primary',
  showLabel = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!address && !cep) return null;

  const googleMapsUrl = getGoogleMapsRouteUrl(address, cep);
  const wazeUrl = getWazeRouteUrl(address, cep);
  const appleMapsUrl = getAppleMapsRouteUrl(address, cep);
  const androidGeoUrl = getAndroidGeoUrl(address, cep);
  const cleanDestination = getCleanGpsDestination(address, cep);

  // Primary URL choice: on Android/iOS, maps.google.com/maps?daddr triggers native app directly
  const primaryUrl = isIOS() ? appleMapsUrl : googleMapsUrl;

  const handleCopyAddress = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(cleanDestination);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all focus:outline-hidden select-none';
  const sizeStyles = size === 'sm' ? 'text-xs px-2.5 py-1.5 gap-1.5 min-h-[34px]' : 'text-sm px-3.5 py-2 gap-2 min-h-[40px]';
  
  let variantStyles = '';
  if (variant === 'primary') {
    variantStyles = 'bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white shadow-2xs hover:shadow-xs';
  } else if (variant === 'outline') {
    variantStyles = 'border border-sky-300 hover:border-sky-400 bg-sky-50/70 hover:bg-sky-100 active:bg-sky-200 text-sky-700';
  } else {
    variantStyles = 'text-sky-700 hover:text-sky-900 hover:bg-sky-50 p-1';
  }

  return (
    <div className={`relative inline-flex items-stretch rounded-lg ${className}`} ref={dropdownRef}>
      {/* 
        Main 1-Click Navigation Link.
        Using a real anchor tag <a href="..." target="_blank"> guarantees that mobile operating systems
        (Android and iOS) intercept the link to open Google Maps or Apple Maps natively,
        and completely avoids mobile browser pop-up blockers that break window.open().
      */}
      <a
        href={primaryUrl}
        target="_blank"
        rel="noopener noreferrer"
        title={`Abrir rota para ${cleanDestination} no aplicativo de GPS`}
        className={`${baseStyles} ${sizeStyles} ${variantStyles} ${showLabel ? 'rounded-r-none' : 'rounded-lg'}`}
      >
        <Navigation className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        {showLabel && <span>Rota GPS</span>}
      </a>

      {/* Dropdown toggle button for choosing specific GPS app (Google Maps, Waze, Apple, Android) */}
      {showLabel && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          title="Opções de navegação (Google Maps, Waze, Apple Maps, Copiar Endereço)"
          className={`px-2 rounded-r-lg border-l border-white/25 flex items-center justify-center transition-colors ${
            variant === 'primary'
              ? 'bg-sky-700 hover:bg-sky-800 text-white'
              : 'border-l-sky-200 bg-sky-100/80 hover:bg-sky-200 text-sky-800'
          }`}
          aria-expanded={isOpen}
          aria-label="Abrir menu de aplicativos de GPS"
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      )}

      {/* Dropdown Menu - Optimized for desktop and mobile touch */}
      {isOpen && (
        <div
          className="absolute right-0 bottom-full mb-1 sm:bottom-auto sm:top-full sm:mt-1 w-64 max-w-[90vw] bg-white rounded-xl shadow-2xl border border-slate-200 p-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1.5 flex items-center justify-between">
            <span>Abrir no Aplicativo de GPS</span>
            <span className="text-sky-600 font-normal normal-case">1 toque</span>
          </div>

          <div className="space-y-1">
            {/* Google Maps */}
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-sky-50 active:bg-sky-100 text-slate-800 hover:text-sky-900 font-medium transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                <div>
                  <div className="font-semibold text-slate-800">Google Maps</div>
                  <div className="text-[10px] text-slate-500 font-normal">App nativo ou navegador</div>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </a>

            {/* Waze */}
            <a
              href={wazeUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-sky-50 active:bg-sky-100 text-slate-800 hover:text-sky-900 font-medium transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shrink-0"></span>
                <div>
                  <div className="font-semibold text-slate-800">Waze</div>
                  <div className="text-[10px] text-slate-500 font-normal">Trânsito em tempo real</div>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </a>

            {/* Apple Maps (iOS / macOS) */}
            <a
              href={appleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-sky-50 active:bg-sky-100 text-slate-800 hover:text-sky-900 font-medium transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0"></span>
                <div>
                  <div className="font-semibold text-slate-800">Apple Maps</div>
                  <div className="text-[10px] text-slate-500 font-normal">Nativo no iPhone / iPad</div>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </a>

            {/* Android Geo Intent (Abre o App Padrão do Celular) */}
            <a
              href={androidGeoUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-emerald-50 active:bg-emerald-100 text-slate-800 hover:text-emerald-900 font-medium transition-colors"
            >
              <div className="flex items-center gap-2">
                <Smartphone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-800">GPS Padrão do Celular</div>
                  <div className="text-[10px] text-slate-500 font-normal">Abre diálogo nativo do Android</div>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </a>

            {/* Copy Address Button */}
            <button
              type="button"
              onClick={handleCopyAddress}
              className="w-full mt-1 pt-1.5 border-t border-slate-100 flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-slate-100 active:bg-slate-200 text-slate-700 font-medium transition-colors"
            >
              <div className="flex items-center gap-2 text-left truncate">
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                )}
                <div className="truncate">
                  <div className="font-semibold text-slate-800">{copied ? 'Endereço Copiado!' : 'Copiar Endereço'}</div>
                  <div className="text-[10px] text-slate-400 truncate">Para colar no Uber / 99 / etc.</div>
                </div>
              </div>
              {copied && <span className="text-[10px] font-bold text-emerald-600 shrink-0">Pronto!</span>}
            </button>
          </div>

          {/* CEP Pinpoint Footer */}
          {cep && (
            <div className="mt-1.5 pt-1.5 border-t border-slate-100 px-2 py-1 text-[10px] text-slate-600 flex items-center gap-1.5 bg-slate-50 rounded font-mono">
              <MapPin className="w-3 h-3 text-sky-500 shrink-0" />
              <span className="truncate">Destino com CEP: {cep}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
