import React, { useState, useEffect } from 'react';
import { getStoredCustomLogo, LOGO_UPDATED_EVENT } from '../utils/logoManager';

export interface BrandLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon' | 'print';
  theme?: 'light' | 'dark' | 'auto';
  showSubtitle?: boolean;
  customLogoUrl?: string | null;
}

/**
 * Logomarca Oficial do Sistema Ar Soluções Climatização.
 * - Suporta exibição da logomarca personalizada carregada pelo administrador (PNG, SVG, JPG, WebP)
 * - Atualiza em tempo real em todas as telas e relatórios quando o admin altera a logo
 * - Mantém a identidade oficial vetorial como padrão de fábrica com proporções exatas
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 'md',
  theme = 'auto',
  customLogoUrl,
}) => {
  const [useSvgFallback, setUseSvgFallback] = useState(false);
  const [activeCustomLogo, setActiveCustomLogo] = useState<string | null>(() => {
    if (customLogoUrl !== undefined) return customLogoUrl;
    return getStoredCustomLogo();
  });

  // Atualizar caso a prop mude
  useEffect(() => {
    if (customLogoUrl !== undefined) {
      setActiveCustomLogo(customLogoUrl);
    }
  }, [customLogoUrl]);

  // Escutar atualizações dinâmicas quando o admin alterar a logomarca nas configurações
  useEffect(() => {
    const handleLogoUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<string | null>;
      if (customLogoUrl === undefined) {
        if (customEvent.detail !== undefined) {
          setActiveCustomLogo(customEvent.detail);
        } else {
          setActiveCustomLogo(getStoredCustomLogo());
        }
      }
    };

    window.addEventListener(LOGO_UPDATED_EVENT, handleLogoUpdate);
    window.addEventListener('storage', handleLogoUpdate);
    return () => {
      window.removeEventListener(LOGO_UPDATED_EVENT, handleLogoUpdate);
      window.removeEventListener('storage', handleLogoUpdate);
    };
  }, [customLogoUrl]);

  // Mapeamento óptico de alturas preservando proporção
  const heightClasses = {
    xs: 'h-6 sm:h-7',
    sm: 'h-8 sm:h-9',
    md: 'h-10 sm:h-11',
    lg: 'h-14 sm:h-16',
    xl: 'h-20 sm:h-24',
  };

  // Se houver logo personalizada ativa carregada pelo admin:
  if (activeCustomLogo) {
    return (
      <img
        src={activeCustomLogo}
        alt="Logomarca da Empresa"
        className={`${heightClasses[size]} w-auto max-w-full object-contain select-none shrink-0 transition-opacity duration-200 ${className}`}
        referrerPolicy="no-referrer"
        loading="eager"
        onError={() => {
          // Se a imagem falhar ao carregar, limpa e recorre à padrão
          setActiveCustomLogo(null);
        }}
      />
    );
  }

  // Logomarca Padrão de Fábrica
  const selectedSrc = useSvgFallback
    ? '/logo.svg'
    : (theme === 'dark' ? '/ar_solucoes_evolution_horizontal_HD_white.png' : '/ar_solucoes_evolution_horizontal_HD.png');

  return (
    <img
      src={selectedSrc}
      alt="Ar Soluções Climatização"
      className={`${heightClasses[size]} w-auto max-w-full object-contain select-none shrink-0 transition-opacity duration-200 ${className}`}
      referrerPolicy="no-referrer"
      loading="eager"
      onError={() => {
        if (!useSvgFallback) {
          setUseSvgFallback(true);
        }
      }}
    />
  );
};
