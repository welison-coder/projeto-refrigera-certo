/**
 * Gerenciador e Processador de Logomarca do Sistema
 * Permite ao Administrador carregar arquivos de imagem (PNG, SVG, JPG, WebP)
 * para serem usados como logotipo em todas as telas, relatórios e menus do sistema.
 */

const STORAGE_KEY = 'refrigera_certo_company';
export const LOGO_UPDATED_EVENT = 'ar-logo-updated';

/**
 * Obtém a URL/Base64 da logo personalizada gravada nas configurações da empresa
 */
export function getStoredCustomLogo(): string | null {
  try {
    const item = localStorage.getItem(STORAGE_KEY);
    if (!item) return null;
    const parsed = JSON.parse(item);
    return parsed.logoUrl && typeof parsed.logoUrl === 'string' ? parsed.logoUrl : null;
  } catch (err) {
    console.error('Erro ao ler logo customizada do localStorage:', err);
    return null;
  }
}

/**
 * Dispara evento de atualização da logo para todos os componentes na tela
 */
export function notifyLogoUpdated(newLogoUrl: string | null): void {
  try {
    window.dispatchEvent(
      new CustomEvent(LOGO_UPDATED_EVENT, {
        detail: newLogoUrl
      })
    );
  } catch (e) {
    console.error('Erro ao disparar evento de logo:', e);
  }
}

/**
 * Processa e otimiza um arquivo de imagem carregado pelo administrador.
 * - Suporta SVG, PNG, JPG, WebP
 * - Se for PNG/JPG/WebP, redimensiona proporcionalmente mantendo transparência (canal alpha)
 * - Gera Base64 pronto para armazenamento no localStorage e sincronização em nuvem
 */
export async function processLogoUpload(file: File): Promise<string> {
  // 1. Validação de formato
  const validTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/gif'];
  if (!validTypes.includes(file.type) && !file.name.match(/\.(png|jpe?g|webp|svg|gif)$/i)) {
    throw new Error('Formato de arquivo inválido. Por favor, selecione uma imagem PNG, JPG, WebP ou SVG.');
  }

  // 2. Se for SVG, ler diretamente mantendo vetorial puro
  if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Falha ao ler arquivo vetorial SVG.'));
        }
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo SVG.'));
      reader.readAsDataURL(file);
    });
  }

  // 3. Imagens Bitmap: Carregar e otimizar preservando canal alpha (transparência)
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // Dimensões máximas confortáveis para cabeçalhos e relatórios
        const maxWidth = 1200;
        const maxHeight = 400;

        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(reader.result as string);
          return;
        }

        // Configuração de interpolação em alta qualidade
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Exportar como PNG com compressão de transparência intacta
        const dataUrl = canvas.toDataURL('image/png');
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Falha ao processar a imagem selecionada.'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('Erro ao abrir arquivo.'));
    reader.readAsDataURL(file);
  });
}
