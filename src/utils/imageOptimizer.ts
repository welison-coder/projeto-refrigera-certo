/**
 * Utilitário de Otimização e Compressão Automática de Imagens no Navegador
 * Especialmente desenhado para fotos tiradas pelo smartphone ou galeria:
 * - Redimensiona fotos de 12MP/48MP para até 1600px garantindo leitura nítida de etiquetas técnicas e QR codes
 * - Comprime com JPEG de alta fidelidade (qualidade 0.84)
 * - Reduz o tamanho de 5MB~15MB para ~120KB~250KB instantaneamente no navegador
 */

export interface OptimizedImageResult {
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
  compressionRatio: number; // Porcentagem de redução (ex: 95%)
  formattedOriginalSize: string;
  formattedCompressedSize: string;
  fileName: string;
}

export interface OptimizeOptions {
  maxDimension?: number;
  quality?: number;
  mimeType?: 'image/jpeg' | 'image/webp';
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Otimiza e comprime uma foto capturada pela câmera ou galeria do smartphone
 */
export async function optimizeImage(
  file: File | Blob,
  options: OptimizeOptions = {}
): Promise<OptimizedImageResult> {
  const {
    maxDimension = 1600, // Dimensão máxima que mantém nitidez cirúrgica em etiquetas
    quality = 0.84, // Balanço perfeito entre nitidez de texto pequeno e leveza
    mimeType = 'image/jpeg'
  } = options;

  const originalSize = file.size;
  const fileName = (file as File).name || 'foto-equipamento.jpg';

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // Calcular proporção mantendo aspect ratio
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Não foi possível obter contexto 2D do canvas'));
        return;
      }

      // Habilitar interpolação de alta qualidade para não borrar texto de etiquetas
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Fundo branco caso haja transparência
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);

      // Desenhar a imagem redimensionada
      ctx.drawImage(img, 0, 0, width, height);

      // Exportar comprimida
      const dataUrl = canvas.toDataURL(mimeType, quality);

      // Calcular tamanho final a partir do base64
      // dataUrl: "data:image/jpeg;base64,...."
      const base64Str = dataUrl.split(',')[1] || '';
      const compressedSize = Math.round((base64Str.length * 3) / 4);

      const savedBytes = Math.max(0, originalSize - compressedSize);
      const compressionRatio = originalSize > 0 
        ? Math.round((savedBytes / originalSize) * 100) 
        : 0;

      resolve({
        dataUrl,
        originalSize,
        compressedSize,
        width,
        height,
        compressionRatio,
        formattedOriginalSize: formatBytes(originalSize),
        formattedCompressedSize: formatBytes(compressedSize),
        fileName
      });
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Falha ao processar arquivo de imagem. Formato não suportado.'));
    };

    img.src = objectUrl;
  });
}

/**
 * Helper para baixar uma imagem com nome padronizado
 */
export function downloadImage(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
