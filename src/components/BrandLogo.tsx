import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon' | 'print';
  theme?: 'light' | 'dark' | 'auto';
  showSubtitle?: boolean;
}

/**
 * Official Brand Logo for Ar Soluções Climatização.
 * Directly renders the official image asset ar_solucoes_evolution_horizontal_HD.png
 * without altering or modifying anything from the original branding.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 'md',
}) => {
  // Height sizing mapping to match container rhythm
  const heightClasses = {
    xs: 'h-6 sm:h-7',
    sm: 'h-8 sm:h-9',
    md: 'h-10 sm:h-12',
    lg: 'h-14 sm:h-16',
    xl: 'h-20 sm:h-24',
  };

  return (
    <img
      src="/ar_solucoes_evolution_horizontal_HD.png"
      alt="Ar Soluções Climatização"
      className={`${heightClasses[size]} w-auto max-w-full object-contain select-none shrink-0 ${className}`}
      referrerPolicy="no-referrer"
      loading="eager"
      onError={(e) => {
        // Fallback to SVG if needed
        const target = e.currentTarget;
        if (!target.src.endsWith('/logo.svg')) {
          target.src = '/logo.svg';
        }
      }}
    />
  );
};
