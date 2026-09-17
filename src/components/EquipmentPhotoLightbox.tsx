import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Camera,
  Layers,
  ChevronLeft,
  ChevronRight,
  Info,
  Calendar,
  Zap,
  Tag
} from 'lucide-react';
import { Equipment } from '../types';
import { downloadImage } from '../utils/imageOptimizer';
import { formatDateBR } from '../utils/formatters';

export type PhotoType = 'label' | 'installation';

interface EquipmentPhotoLightboxProps {
  equipment: Equipment | null;
  initialType?: PhotoType;
  isOpen: boolean;
  onClose: () => void;
}

export const EquipmentPhotoLightbox: React.FC<EquipmentPhotoLightboxProps> = ({
  equipment,
  initialType = 'label',
  isOpen,
  onClose
}) => {
  const [activeType, setActiveType] = useState<PhotoType>(initialType);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Reset zoom & active type when opening or equipment changes
  useEffect(() => {
    if (isOpen && equipment) {
      if (initialType === 'installation' && equipment.installationPhotoUrl) {
        setActiveType('installation');
      } else if (equipment.labelPhotoUrl) {
        setActiveType('label');
      } else if (equipment.installationPhotoUrl) {
        setActiveType('installation');
      } else {
        setActiveType('label');
      }
      setZoomLevel(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, equipment, initialType]);

  // Keyboard shortcut listener: ESC to close, + / - to zoom, Arrows to switch photo
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        setZoomLevel(prev => Math.min(prev + 0.3, 3.5));
      } else if (e.key === '-' || e.key === '_') {
        setZoomLevel(prev => Math.max(prev - 0.3, 0.8));
      } else if (e.key === '0') {
        setZoomLevel(1);
        setPosition({ x: 0, y: 0 });
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        if (equipment?.labelPhotoUrl && equipment?.installationPhotoUrl) {
          setActiveType(prev => (prev === 'label' ? 'installation' : 'label'));
          setZoomLevel(1);
          setPosition({ x: 0, y: 0 });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, equipment, onClose]);

  if (!isOpen || !equipment) return null;

  const currentPhotoUrl = activeType === 'label'
    ? equipment.labelPhotoUrl
    : equipment.installationPhotoUrl;

  const currentPhotoDate = activeType === 'label'
    ? equipment.labelPhotoDate
    : equipment.installationPhotoDate;

  const hasLabel = Boolean(equipment.labelPhotoUrl);
  const hasInstallation = Boolean(equipment.installationPhotoUrl);

  const handleDownload = () => {
    if (!currentPhotoUrl) return;
    const sanitizedBrand = equipment.brand.replace(/\s+/g, '-').toLowerCase();
    const sanitizedModel = (equipment.model || 'equip').replace(/\s+/g, '-').toLowerCase();
    const typeTag = activeType === 'label' ? 'etiqueta-tecnica' : 'foto-instalacao';
    const filename = `${typeTag}-${sanitizedBrand}-${sanitizedModel}-${equipment.id.slice(-4)}.jpg`;
    downloadImage(currentPhotoUrl, filename);
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.3, 3.5));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.3, 0.8));
  const handleResetZoom = () => {
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
  };

  // Dragging support when zoomed in
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-md select-none animate-in fade-in duration-200"
      onClick={(e) => {
        // Close if clicking directly on backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Top Bar / Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-slate-900/90 border-b border-slate-800 text-white z-10 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-lg bg-sky-500/20 text-sky-400 shrink-0">
            {activeType === 'label' ? <Tag className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
          </div>
          <div className="truncate">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-wide truncate">
                {equipment.brand} - {equipment.capacity}
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-800 text-sky-300 border border-slate-700">
                {activeType === 'label' ? 'Etiqueta Técnica' : 'Instalação no Local'}
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate">
              {equipment.clientName} • {equipment.locationDescription}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Photo Switcher Tabs */}
          {(hasLabel || hasInstallation) && (
            <div className="hidden sm:flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 mr-2">
              <button
                type="button"
                onClick={() => {
                  setActiveType('label');
                  handleResetZoom();
                }}
                disabled={!hasLabel}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeType === 'label'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : hasLabel
                    ? 'text-slate-300 hover:text-white'
                    : 'text-slate-500 cursor-not-allowed'
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Etiqueta {hasLabel ? '✓' : ''}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveType('installation');
                  handleResetZoom();
                }}
                disabled={!hasInstallation}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeType === 'installation'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : hasInstallation
                    ? 'text-slate-300 hover:text-white'
                    : 'text-slate-500 cursor-not-allowed'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Instalação {hasInstallation ? '✓' : ''}</span>
              </button>
            </div>
          )}

          {/* Zoom Controls */}
          <div className="hidden md:flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700">
            <button
              onClick={handleZoomOut}
              title="Diminuir Zoom (-)"
              className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono px-2 text-slate-300">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              title="Aumentar Zoom (+)"
              className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetZoom}
              title="Ajustar à Tela (0)"
              className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors ml-0.5"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Download button */}
          <button
            id="btn-download-photo"
            onClick={handleDownload}
            disabled={!currentPhotoUrl}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            title="Baixar imagem em alta resolução"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Baixar Foto</span>
          </button>

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
            title="Fechar (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Switcher Bar */}
      <div className="sm:hidden flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setActiveType('label');
              handleResetZoom();
            }}
            disabled={!hasLabel}
            className={`px-3 py-1 rounded-lg font-semibold ${
              activeType === 'label' ? 'bg-sky-600 text-white' : 'text-slate-400'
            }`}
          >
            Etiqueta
          </button>
          <button
            onClick={() => {
              setActiveType('installation');
              handleResetZoom();
            }}
            disabled={!hasInstallation}
            className={`px-3 py-1 rounded-lg font-semibold ${
              activeType === 'installation' ? 'bg-sky-600 text-white' : 'text-slate-400'
            }`}
          >
            Instalação
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleZoomOut} className="p-1 text-slate-300"><ZoomOut className="w-4 h-4" /></button>
          <span className="font-mono text-slate-400">{Math.round(zoomLevel * 100)}%</span>
          <button onClick={handleZoomIn} className="p-1 text-slate-300"><ZoomIn className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Main Viewing Canvas */}
      <div
        className={`flex-1 flex items-center justify-center p-4 overflow-hidden relative ${
          zoomLevel > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={(e) => {
          if (e.target === e.currentTarget && zoomLevel === 1) {
            onClose();
          }
        }}
      >
        {currentPhotoUrl ? (
          <div
            className="transition-transform duration-100 ease-out max-w-full max-h-full flex items-center justify-center"
            style={{
              transform: `scale(${zoomLevel}) translate(${position.x / zoomLevel}px, ${position.y / zoomLevel}px)`
            }}
          >
            <img
              src={currentPhotoUrl}
              alt={activeType === 'label' ? 'Etiqueta Técnica' : 'Foto da Instalação'}
              className="max-w-[92vw] max-h-[70vh] object-contain rounded-lg shadow-2xl border border-slate-700/60 bg-black/40"
              onDoubleClick={() => {
                if (zoomLevel === 1) {
                  setZoomLevel(2);
                } else {
                  handleResetZoom();
                }
              }}
              draggable={false}
            />
          </div>
        ) : (
          <div className="text-center text-slate-400 max-w-md p-8 bg-slate-900/60 rounded-2xl border border-slate-800">
            <Camera className="w-12 h-12 mx-auto text-slate-600 mb-3" />
            <h3 className="text-base font-bold text-slate-200 mb-1">
              {activeType === 'label' ? 'Etiqueta Não Registrada' : 'Foto da Instalação Não Registrada'}
            </h3>
            <p className="text-xs text-slate-400">
              {activeType === 'label'
                ? 'Nenhuma foto da placa/etiqueta técnica foi anexada a este equipamento.'
                : 'Nenhuma foto de vistoria ou comissionamento foi anexada a este equipamento.'}
            </p>
          </div>
        )}

        {/* Hint overlay */}
        {currentPhotoUrl && (
          <div className="absolute bottom-4 left-4 hidden md:flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-700 text-[11px] text-slate-300 pointer-events-none">
            <Info className="w-3.5 h-3.5 text-sky-400" />
            <span>Duplo clique ou use a roda do mouse para ampliar detalhes (número de série, gás e amperagem)</span>
          </div>
        )}
      </div>

      {/* Bottom Technical Strip: Instant cross-reference of label data */}
      <div className="px-4 sm:px-6 py-3 bg-slate-900/95 border-t border-slate-800 shrink-0 text-xs">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <span className="text-slate-400 text-[11px] block">Modelo:</span>
              <span className="font-mono font-bold text-sky-400">{equipment.model || 'Não especificado'}</span>
            </div>
            <div className="h-6 w-px bg-slate-800 hidden sm:block" />

            <div>
              <span className="text-slate-400 text-[11px] block">Nº de Série:</span>
              <span className="font-mono font-bold text-slate-200">{equipment.serialNumber || 'Não registrado'}</span>
            </div>
            <div className="h-6 w-px bg-slate-800 hidden sm:block" />

            <div>
              <span className="text-slate-400 text-[11px] block">Capacidade Térmica:</span>
              <span className="font-semibold text-white">{equipment.capacity}</span>
            </div>
            <div className="h-6 w-px bg-slate-800 hidden sm:block" />

            <div>
              <span className="text-slate-400 text-[11px] block">Fluido Refrigerante:</span>
              <span className="font-mono font-bold text-emerald-400">{equipment.gasType}</span>
            </div>
            <div className="h-6 w-px bg-slate-800 hidden sm:block" />

            {equipment.nominalCurrent && (
              <div>
                <span className="text-slate-400 text-[11px] block">Corrente Elétrica:</span>
                <span className="font-mono font-bold text-amber-400">{equipment.nominalCurrent}</span>
              </div>
            )}
          </div>

          {currentPhotoDate && (
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Registro fotográfico: {formatDateBR(currentPhotoDate.slice(0, 10))}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
