import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  Trash2,
  CheckCircle2,
  ZoomIn,
  Loader2,
  Tag,
  ShieldCheck,
  Wind
} from 'lucide-react';
import { optimizeImage, OptimizedImageResult } from '../utils/imageOptimizer';

export interface PhotoSlotData {
  url?: string;
  date?: string;
  stats?: {
    originalSize: string;
    compressedSize: string;
    ratio: number;
  };
}

export type PhotoType = 'label' | 'installation' | 'condenser';

interface EquipmentPhotoUploaderProps {
  labelPhoto?: PhotoSlotData;
  installationPhoto?: PhotoSlotData;
  condenserPhoto?: PhotoSlotData;
  onChangeLabelPhoto: (url: string | undefined, date: string | undefined, stats?: PhotoSlotData['stats']) => void;
  onChangeInstallationPhoto: (url: string | undefined, date: string | undefined, stats?: PhotoSlotData['stats']) => void;
  onChangeCondenserPhoto: (url: string | undefined, date: string | undefined, stats?: PhotoSlotData['stats']) => void;
  onPreviewPhoto: (type: PhotoType) => void;
}

export const EquipmentPhotoUploader: React.FC<EquipmentPhotoUploaderProps> = ({
  labelPhoto,
  installationPhoto,
  condenserPhoto,
  onChangeLabelPhoto,
  onChangeInstallationPhoto,
  onChangeCondenserPhoto,
  onPreviewPhoto
}) => {
  const [isProcessingLabel, setIsProcessingLabel] = useState<boolean>(false);
  const [isProcessingInstall, setIsProcessingInstall] = useState<boolean>(false);
  const [isProcessingCondenser, setIsProcessingCondenser] = useState<boolean>(false);

  const [labelStats, setLabelStats] = useState<PhotoSlotData['stats'] | undefined>(labelPhoto?.stats);
  const [installStats, setInstallStats] = useState<PhotoSlotData['stats'] | undefined>(installationPhoto?.stats);
  const [condenserStats, setCondenserStats] = useState<PhotoSlotData['stats'] | undefined>(condenserPhoto?.stats);

  // Hidden file inputs for Camera and File selection
  const labelCameraInputRef = useRef<HTMLInputElement>(null);
  const labelFileInputRef = useRef<HTMLInputElement>(null);

  const installCameraInputRef = useRef<HTMLInputElement>(null);
  const installFileInputRef = useRef<HTMLInputElement>(null);

  const condenserCameraInputRef = useRef<HTMLInputElement>(null);
  const condenserFileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (
    file: File,
    type: PhotoType
  ) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecione um arquivo de imagem válido (JPEG, PNG, WebP).');
      return;
    }

    if (type === 'label') setIsProcessingLabel(true);
    if (type === 'installation') setIsProcessingInstall(true);
    if (type === 'condenser') setIsProcessingCondenser(true);

    try {
      const result: OptimizedImageResult = await optimizeImage(file, {
        maxDimension: 1600,
        quality: 0.84
      });

      const now = new Date().toISOString();
      const stats = {
        originalSize: result.formattedOriginalSize,
        compressedSize: result.formattedCompressedSize,
        ratio: result.compressionRatio
      };

      if (type === 'label') {
        setLabelStats(stats);
        onChangeLabelPhoto(result.dataUrl, now, stats);
      } else if (type === 'installation') {
        setInstallStats(stats);
        onChangeInstallationPhoto(result.dataUrl, now, stats);
      } else {
        setCondenserStats(stats);
        onChangeCondenserPhoto(result.dataUrl, now, stats);
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao otimizar imagem.');
    } finally {
      if (type === 'label') setIsProcessingLabel(false);
      if (type === 'installation') setIsProcessingInstall(false);
      if (type === 'condenser') setIsProcessingCondenser(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent, type: PhotoType) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0], type);
    }
  };

  const totalPhotosCount = [labelPhoto?.url, installationPhoto?.url, condenserPhoto?.url].filter(Boolean).length;

  return (
    <div className="space-y-4 pt-3 border-t border-slate-200">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-sky-600" />
            Registro Fotográfico Completo (3 Opções de Foto)
          </h4>
          <p className="text-[11px] text-slate-500">
            Etiqueta Técnica, Unidade Interna (Evaporadora) e Unidade Externa (Condensadora).
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full border border-slate-200">
            {totalPhotosCount}/3 registradas
          </span>
          <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-200/60">
            Auto-Compressão Ativa
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* ======================================================== */}
        {/* 1. FOTO DA ETIQUETA TÉCNICA */}
        {/* ======================================================== */}
        <div
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'label')}
          className={`rounded-xl p-3 border transition-all flex flex-col justify-between ${
            labelPhoto?.url
              ? 'bg-sky-50/40 border-sky-200'
              : 'bg-slate-50/70 border-dashed border-slate-300 hover:border-sky-400'
          }`}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-1 mb-1.5">
            <div className="flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span className="font-bold text-xs text-slate-800">1. Etiqueta Técnica</span>
            </div>
            {labelPhoto?.url && (
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100/70 px-1.5 py-0.2 rounded">
                Gravada
              </span>
            )}
          </div>

          <p className="text-[10.5px] text-slate-500 mb-2 leading-tight">
            Placa de dados: modelo, nº de série, BTU, corrente (A) e gás refrigerante.
          </p>

          {/* Hidden inputs */}
          <input
            ref={labelCameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) processFile(e.target.files[0], 'label');
              e.target.value = '';
            }}
          />
          <input
            ref={labelFileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) processFile(e.target.files[0], 'label');
              e.target.value = '';
            }}
          />

          {/* Preview or Empty State */}
          {isProcessingLabel ? (
            <div className="h-32 flex flex-col items-center justify-center bg-white rounded-lg border border-sky-200 p-3 text-center">
              <Loader2 className="w-6 h-6 text-sky-600 animate-spin mb-1.5" />
              <span className="text-xs font-semibold text-sky-800">Otimizando foto...</span>
              <span className="text-[10px] text-slate-500">Redimensionando no navegador</span>
            </div>
          ) : labelPhoto?.url ? (
            <div className="space-y-2">
              <div className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-900 aspect-video flex items-center justify-center">
                <img
                  src={labelPhoto.url}
                  alt="Etiqueta Técnica"
                  className="w-full h-full object-contain cursor-pointer transition-transform group-hover:scale-105"
                  onClick={() => onPreviewPhoto('label')}
                />
                <button
                  type="button"
                  onClick={() => onPreviewPhoto('label')}
                  className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-semibold"
                >
                  <ZoomIn className="w-4 h-4" />
                  <span>Ampliar</span>
                </button>
              </div>

              {/* Compression stats badge */}
              {labelStats && (
                <div className="flex items-center justify-between text-[10px] text-slate-500 bg-white/80 px-2 py-1 rounded border border-slate-200/80">
                  <span className="truncate">Otimizada ({labelStats.ratio}% menor)</span>
                  <span className="font-mono text-emerald-600 font-bold">{labelStats.compressedSize}</span>
                </div>
              )}

              <div className="flex items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => labelFileInputRef.current?.click()}
                  className="flex-1 text-[11px] font-semibold text-slate-700 hover:text-sky-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-md py-1 px-2 transition-colors flex items-center justify-center gap-1"
                >
                  <Upload className="w-3 h-3" />
                  Trocar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onChangeLabelPhoto(undefined, undefined);
                    setLabelStats(undefined);
                  }}
                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md border border-slate-200 transition-colors"
                  title="Remover foto da etiqueta"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => labelCameraInputRef.current?.click()}
                  className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-[11px] shadow-xs active:scale-95 transition-all"
                  title="Tirar foto agora com a câmera"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Tirar Foto</span>
                </button>
                <button
                  type="button"
                  onClick={() => labelFileInputRef.current?.click()}
                  className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-semibold text-[11px] border border-slate-300 shadow-2xs active:scale-95 transition-all"
                  title="Selecionar imagem da galeria"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Galeria</span>
                </button>
              </div>
              <span className="text-[10px] text-slate-400 block text-center">ou arraste a foto aqui</span>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* 2. FOTO DA UNIDADE INTERNA (EVAPORADORA) */}
        {/* ======================================================== */}
        <div
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'installation')}
          className={`rounded-xl p-3 border transition-all flex flex-col justify-between ${
            installationPhoto?.url
              ? 'bg-sky-50/40 border-sky-200'
              : 'bg-slate-50/70 border-dashed border-slate-300 hover:border-sky-400'
          }`}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-1 mb-1.5">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span className="font-bold text-xs text-slate-800">2. Unidade Interna</span>
            </div>
            {installationPhoto?.url && (
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100/70 px-1.5 py-0.2 rounded">
                Gravada
              </span>
            )}
          </div>

          <p className="text-[10.5px] text-slate-500 mb-2 leading-tight">
            Evaporadora no ambiente: acabamento, saída de ar, fixação e dreno.
          </p>

          {/* Hidden inputs */}
          <input
            ref={installCameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) processFile(e.target.files[0], 'installation');
              e.target.value = '';
            }}
          />
          <input
            ref={installFileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) processFile(e.target.files[0], 'installation');
              e.target.value = '';
            }}
          />

          {/* Preview or Empty State */}
          {isProcessingInstall ? (
            <div className="h-32 flex flex-col items-center justify-center bg-white rounded-lg border border-sky-200 p-3 text-center">
              <Loader2 className="w-6 h-6 text-sky-600 animate-spin mb-1.5" />
              <span className="text-xs font-semibold text-sky-800">Otimizando foto...</span>
              <span className="text-[10px] text-slate-500">Redimensionando no navegador</span>
            </div>
          ) : installationPhoto?.url ? (
            <div className="space-y-2">
              <div className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-900 aspect-video flex items-center justify-center">
                <img
                  src={installationPhoto.url}
                  alt="Unidade Interna (Evaporadora)"
                  className="w-full h-full object-contain cursor-pointer transition-transform group-hover:scale-105"
                  onClick={() => onPreviewPhoto('installation')}
                />
                <button
                  type="button"
                  onClick={() => onPreviewPhoto('installation')}
                  className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-semibold"
                >
                  <ZoomIn className="w-4 h-4" />
                  <span>Ampliar</span>
                </button>
              </div>

              {/* Compression stats badge */}
              {installStats && (
                <div className="flex items-center justify-between text-[10px] text-slate-500 bg-white/80 px-2 py-1 rounded border border-slate-200/80">
                  <span className="truncate">Otimizada ({installStats.ratio}% menor)</span>
                  <span className="font-mono text-emerald-600 font-bold">{installStats.compressedSize}</span>
                </div>
              )}

              <div className="flex items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => installFileInputRef.current?.click()}
                  className="flex-1 text-[11px] font-semibold text-slate-700 hover:text-sky-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-md py-1 px-2 transition-colors flex items-center justify-center gap-1"
                >
                  <Upload className="w-3 h-3" />
                  Trocar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onChangeInstallationPhoto(undefined, undefined);
                    setInstallStats(undefined);
                  }}
                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md border border-slate-200 transition-colors"
                  title="Remover foto da instalação"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => installCameraInputRef.current?.click()}
                  className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-[11px] shadow-xs active:scale-95 transition-all"
                  title="Tirar foto agora com a câmera"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Tirar Foto</span>
                </button>
                <button
                  type="button"
                  onClick={() => installFileInputRef.current?.click()}
                  className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-semibold text-[11px] border border-slate-300 shadow-2xs active:scale-95 transition-all"
                  title="Selecionar imagem da galeria"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Galeria</span>
                </button>
              </div>
              <span className="text-[10px] text-slate-400 block text-center">ou arraste a foto aqui</span>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* 3. FOTO DA UNIDADE EXTERNA (CONDENSADORA) */}
        {/* ======================================================== */}
        <div
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'condenser')}
          className={`rounded-xl p-3 border transition-all flex flex-col justify-between ${
            condenserPhoto?.url
              ? 'bg-sky-50/40 border-sky-200'
              : 'bg-slate-50/70 border-dashed border-slate-300 hover:border-sky-400'
          }`}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-1 mb-1.5">
            <div className="flex items-center gap-1.5">
              <Wind className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span className="font-bold text-xs text-slate-800">3. Unidade Externa</span>
            </div>
            {condenserPhoto?.url && (
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100/70 px-1.5 py-0.2 rounded">
                Gravada
              </span>
            )}
          </div>

          <p className="text-[10.5px] text-slate-500 mb-2 leading-tight">
            Condensadora: suporte, mísulas, coxins, tubulação de cobre e válvulas.
          </p>

          {/* Hidden inputs */}
          <input
            ref={condenserCameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) processFile(e.target.files[0], 'condenser');
              e.target.value = '';
            }}
          />
          <input
            ref={condenserFileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) processFile(e.target.files[0], 'condenser');
              e.target.value = '';
            }}
          />

          {/* Preview or Empty State */}
          {isProcessingCondenser ? (
            <div className="h-32 flex flex-col items-center justify-center bg-white rounded-lg border border-sky-200 p-3 text-center">
              <Loader2 className="w-6 h-6 text-sky-600 animate-spin mb-1.5" />
              <span className="text-xs font-semibold text-sky-800">Otimizando foto...</span>
              <span className="text-[10px] text-slate-500">Redimensionando no navegador</span>
            </div>
          ) : condenserPhoto?.url ? (
            <div className="space-y-2">
              <div className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-900 aspect-video flex items-center justify-center">
                <img
                  src={condenserPhoto.url}
                  alt="Unidade Externa (Condensadora)"
                  className="w-full h-full object-contain cursor-pointer transition-transform group-hover:scale-105"
                  onClick={() => onPreviewPhoto('condenser')}
                />
                <button
                  type="button"
                  onClick={() => onPreviewPhoto('condenser')}
                  className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-semibold"
                >
                  <ZoomIn className="w-4 h-4" />
                  <span>Ampliar</span>
                </button>
              </div>

              {/* Compression stats badge */}
              {condenserStats && (
                <div className="flex items-center justify-between text-[10px] text-slate-500 bg-white/80 px-2 py-1 rounded border border-slate-200/80">
                  <span className="truncate">Otimizada ({condenserStats.ratio}% menor)</span>
                  <span className="font-mono text-emerald-600 font-bold">{condenserStats.compressedSize}</span>
                </div>
              )}

              <div className="flex items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => condenserFileInputRef.current?.click()}
                  className="flex-1 text-[11px] font-semibold text-slate-700 hover:text-sky-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-md py-1 px-2 transition-colors flex items-center justify-center gap-1"
                >
                  <Upload className="w-3 h-3" />
                  Trocar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onChangeCondenserPhoto(undefined, undefined);
                    setCondenserStats(undefined);
                  }}
                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md border border-slate-200 transition-colors"
                  title="Remover foto da condensadora"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => condenserCameraInputRef.current?.click()}
                  className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-[11px] shadow-xs active:scale-95 transition-all"
                  title="Tirar foto agora com a câmera"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Tirar Foto</span>
                </button>
                <button
                  type="button"
                  onClick={() => condenserFileInputRef.current?.click()}
                  className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-semibold text-[11px] border border-slate-300 shadow-2xs active:scale-95 transition-all"
                  title="Selecionar imagem da galeria"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Galeria</span>
                </button>
              </div>
              <span className="text-[10px] text-slate-400 block text-center">ou arraste a foto aqui</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
