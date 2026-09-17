import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  Trash2,
  CheckCircle2,
  ZoomIn,
  Loader2,
  Sparkles,
  Tag,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { optimizeImage, OptimizedImageResult } from '../utils/imageOptimizer';

interface PhotoSlotData {
  url?: string;
  date?: string;
  stats?: {
    originalSize: string;
    compressedSize: string;
    ratio: number;
  };
}

interface EquipmentPhotoUploaderProps {
  labelPhoto?: PhotoSlotData;
  installationPhoto?: PhotoSlotData;
  onChangeLabelPhoto: (url: string | undefined, date: string | undefined, stats?: PhotoSlotData['stats']) => void;
  onChangeInstallationPhoto: (url: string | undefined, date: string | undefined, stats?: PhotoSlotData['stats']) => void;
  onPreviewPhoto: (type: 'label' | 'installation') => void;
}

export const EquipmentPhotoUploader: React.FC<EquipmentPhotoUploaderProps> = ({
  labelPhoto,
  installationPhoto,
  onChangeLabelPhoto,
  onChangeInstallationPhoto,
  onPreviewPhoto
}) => {
  const [isProcessingLabel, setIsProcessingLabel] = useState<boolean>(false);
  const [isProcessingInstall, setIsProcessingInstall] = useState<boolean>(false);
  const [labelStats, setLabelStats] = useState<PhotoSlotData['stats'] | undefined>(labelPhoto?.stats);
  const [installStats, setInstallStats] = useState<PhotoSlotData['stats'] | undefined>(installationPhoto?.stats);

  // Hidden file inputs for Camera and File selection
  const labelCameraInputRef = useRef<HTMLInputElement>(null);
  const labelFileInputRef = useRef<HTMLInputElement>(null);

  const installCameraInputRef = useRef<HTMLInputElement>(null);
  const installFileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (
    file: File,
    type: 'label' | 'installation'
  ) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecione um arquivo de imagem válido (JPEG, PNG, WebP).');
      return;
    }

    if (type === 'label') setIsProcessingLabel(true);
    if (type === 'installation') setIsProcessingInstall(true);

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
      } else {
        setInstallStats(stats);
        onChangeInstallationPhoto(result.dataUrl, now, stats);
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao otimizar imagem.');
    } finally {
      if (type === 'label') setIsProcessingLabel(false);
      if (type === 'installation') setIsProcessingInstall(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent, type: 'label' | 'installation') => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0], type);
    }
  };

  return (
    <div className="space-y-4 pt-3 border-t border-slate-200">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-sky-600" />
            Registro Fotográfico do Aparelho (Etiqueta & Instalação)
          </h4>
          <p className="text-[11px] text-slate-500">
            Comprimidas automaticamente no navegador com nitidez para zoom e leitura rápida.
          </p>
        </div>
        <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-200/60">
          Auto-Compressão Ativa
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          <div className="flex items-start justify-between gap-1 mb-2">
            <div className="flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span className="font-bold text-xs text-slate-800">Foto da Etiqueta Técnica</span>
            </div>
            {labelPhoto?.url && (
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100/70 px-1.5 py-0.2 rounded">
                Gravada
              </span>
            )}
          </div>

          <p className="text-[10.5px] text-slate-500 mb-2 leading-tight">
            Placa de dados: modelo, nº de série, capacidade BTU, corrente (A) e gás.
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
              <span className="text-[10px] text-slate-500">Redimensionando e comprimindo no navegador</span>
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
                  <span>Ampliar no Lightbox</span>
                </button>
              </div>

              {/* Compression stats badge if available */}
              {labelStats && (
                <div className="text-[10px] text-slate-600 bg-white p-1.5 rounded border border-slate-200 flex items-center justify-between">
                  <span>Tamanho: <b>{labelStats.compressedSize}</b></span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                    <Sparkles className="w-3 h-3" />
                    -{labelStats.ratio}% otimizado
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-1 pt-1">
                <button
                  type="button"
                  onClick={() => labelFileInputRef.current?.click()}
                  className="text-[11px] font-semibold text-sky-700 hover:text-sky-800 hover:underline"
                >
                  Substituir Foto
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLabelStats(undefined);
                    onChangeLabelPhoto(undefined, undefined);
                  }}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                  title="Remover foto da etiqueta"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="h-32 flex flex-col items-center justify-center bg-white rounded-lg border border-slate-200 p-2 text-center">
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  id="btn-camera-label"
                  onClick={() => labelCameraInputRef.current?.click()}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-[11px] transition-colors shadow-2xs"
                  title="Tirar foto agora com a câmera do celular"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Tirar Foto</span>
                </button>

                <button
                  type="button"
                  id="btn-gallery-label"
                  onClick={() => labelFileInputRef.current?.click()}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors"
                  title="Escolher arquivo da galeria"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Galeria</span>
                </button>
              </div>
              <span className="text-[10px] text-slate-400">ou arraste a foto aqui</span>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* 2. FOTO DA INSTALAÇÃO NO LOCAL */}
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
          <div className="flex items-start justify-between gap-1 mb-2">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span className="font-bold text-xs text-slate-800">Foto da Instalação no Local</span>
            </div>
            {installationPhoto?.url && (
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100/70 px-1.5 py-0.2 rounded">
                Gravada
              </span>
            )}
          </div>

          <p className="text-[10.5px] text-slate-500 mb-2 leading-tight">
            Inspeção da unidade evaporadora ou condensadora instalada no cliente.
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
              <span className="text-[10px] text-slate-500">Redimensionando e comprimindo no navegador</span>
            </div>
          ) : installationPhoto?.url ? (
            <div className="space-y-2">
              <div className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-900 aspect-video flex items-center justify-center">
                <img
                  src={installationPhoto.url}
                  alt="Instalação no Local"
                  className="w-full h-full object-contain cursor-pointer transition-transform group-hover:scale-105"
                  onClick={() => onPreviewPhoto('installation')}
                />
                <button
                  type="button"
                  onClick={() => onPreviewPhoto('installation')}
                  className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-semibold"
                >
                  <ZoomIn className="w-4 h-4" />
                  <span>Ampliar no Lightbox</span>
                </button>
              </div>

              {/* Compression stats badge if available */}
              {installStats && (
                <div className="text-[10px] text-slate-600 bg-white p-1.5 rounded border border-slate-200 flex items-center justify-between">
                  <span>Tamanho: <b>{installStats.compressedSize}</b></span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                    <Sparkles className="w-3 h-3" />
                    -{installStats.ratio}% otimizado
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-1 pt-1">
                <button
                  type="button"
                  onClick={() => installFileInputRef.current?.click()}
                  className="text-[11px] font-semibold text-sky-700 hover:text-sky-800 hover:underline"
                >
                  Substituir Foto
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setInstallStats(undefined);
                    onChangeInstallationPhoto(undefined, undefined);
                  }}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                  title="Remover foto da instalação"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="h-32 flex flex-col items-center justify-center bg-white rounded-lg border border-slate-200 p-2 text-center">
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  id="btn-camera-install"
                  onClick={() => installCameraInputRef.current?.click()}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-[11px] transition-colors shadow-2xs"
                  title="Tirar foto agora com a câmera do celular"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Tirar Foto</span>
                </button>

                <button
                  type="button"
                  id="btn-gallery-install"
                  onClick={() => installFileInputRef.current?.click()}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors"
                  title="Escolher arquivo da galeria"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Galeria</span>
                </button>
              </div>
              <span className="text-[10px] text-slate-400">ou arraste a foto aqui</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
