import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon' | 'print';
  theme?: 'light' | 'dark' | 'auto';
  showSubtitle?: boolean;
}

/**
 * Official Brand Logo for Refrigera Certo.
 * Matches exact geometry:
 * - Circular emblem with dark navy stylized framing and 8-pointed bright cyan snowflake
 * - "Refrigera" in cyan (#00a6e8)
 * - "Certo" in deep navy (#161354) or white (#ffffff for dark navbar)
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'full',
  theme = 'light',
  showSubtitle = false
}) => {
  // Height & dimension mapping
  const heightMap = {
    xs: 'h-5',
    sm: 'h-7',
    md: 'h-9',
    lg: 'h-11',
    xl: 'h-14'
  };

  const iconDimensionMap = {
    xs: 22,
    sm: 28,
    md: 36,
    lg: 44,
    xl: 56
  };

  const textScaleMap = {
    xs: 'text-sm font-black',
    sm: 'text-base font-black',
    md: 'text-lg sm:text-xl font-black',
    lg: 'text-xl sm:text-2xl font-black',
    xl: 'text-2xl sm:text-3xl font-black'
  };

  const currentHeight = heightMap[size];
  const iconPx = iconDimensionMap[size];
  const textClass = textScaleMap[size];

  // Colors
  const cyanColor = '#00a6e8';
  const navyColor = theme === 'dark' ? '#ffffff' : '#161354';
  const frameNavyColor = '#161354';

  const renderIcon = () => (
    <svg
      width={iconPx}
      height={iconPx}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 drop-shadow-2xs"
    >
      {/* Outer Stylized Circular Brackets / Framing (Dark Navy) */}
      <g transform="translate(50, 50)">
        {/* Top-Left Arc Segment */}
        <path
          d="M -34,-18 C -22,-38 -2,-44 14,-42 C 16,-38 15,-34 11,-31 C -1,-33 -17,-28 -28,-14 Z"
          fill={frameNavyColor}
        />
        {/* Bottom-Left Arc Segment */}
        <path
          d="M -34,18 C -22,38 -2,44 14,42 C 16,38 15,34 11,31 C -1,33 -17,28 -28,14 Z"
          fill={frameNavyColor}
        />
        {/* Leftmost Outer Crescent */}
        <path
          d="M -36,-16 C -44,-6 -44,6 -36,16 C -40,12 -44,3 -44,0 C -44,-3 -40,-12 -36,-16 Z"
          fill={frameNavyColor}
        />
        {/* Top-Right Wedge */}
        <path
          d="M 21,-38 C 32,-35 41,-24 44,-13 C 40,-12 35,-13 32,-17 C 28,-25 24,-32 21,-38 Z"
          fill={frameNavyColor}
        />
        {/* Bottom-Right Wedge */}
        <path
          d="M 21,38 C 32,35 41,24 44,13 C 40,12 35,13 32,17 C 28,25 24,32 21,38 Z"
          fill={frameNavyColor}
        />

        {/* Central 8-Ray Brilliant Snowflake in Cyan */}
        {/* 1. Top Vertical Ray */}
        <path d="M 0,-7 L 5,-20 L 0,-34 L -5,-20 Z" fill={cyanColor} />
        {/* 2. Bottom Vertical Ray */}
        <path d="M 0,7 L 5,20 L 0,34 L -5,20 Z" fill={cyanColor} />
        {/* 3. Left Horizontal Ray */}
        <path d="M -7,0 L -20,5 L -34,0 L -20,-5 Z" fill={cyanColor} />
        {/* 4. Right Horizontal Ray */}
        <path d="M 7,0 L 20,5 L 34,0 L 20,-5 Z" fill={cyanColor} />

        {/* 5. Top-Right Diagonal Ray */}
        <path d="M 4.8,-4.8 L 18.2,-10.1 L 24.1,-24.1 L 10.1,-18.2 Z" fill={cyanColor} />
        {/* 6. Top-Left Diagonal Ray */}
        <path d="M -4.8,-4.8 L -10.1,-18.2 L -24.1,-24.1 L -18.2,-10.1 Z" fill={cyanColor} />
        {/* 7. Bottom-Left Diagonal Ray */}
        <path d="M -4.8,4.8 L -18.2,10.1 L -24.1,24.1 L -10.1,18.2 Z" fill={cyanColor} />
        {/* 8. Bottom-Right Diagonal Ray */}
        <path d="M 4.8,4.8 L 10.1,18.2 L 24.1,24.1 L 18.2,10.1 Z" fill={cyanColor} />

        {/* Center Crystal Core Accent */}
        <polygon points="0,-4.5 4.5,0 0,4.5 -4.5,0" fill="#ffffff" />
      </g>
    </svg>
  );

  if (variant === 'icon') {
    return <div className={`inline-flex items-center justify-center ${className}`}>{renderIcon()}</div>;
  }

  // Full brand representation
  return (
    <div className={`inline-flex items-center gap-2.5 sm:gap-3 select-none ${className}`}>
      {renderIcon()}
      <div className="flex flex-col">
        <div className={`flex items-baseline tracking-tight leading-none ${textClass}`}>
          <span style={{ color: cyanColor }} className="font-extrabold tracking-tight">
            Refrigera
          </span>
          <span style={{ color: navyColor }} className="font-extrabold tracking-tight ml-1">
            Certo
          </span>
        </div>
        {showSubtitle && (
          <span
            className={`text-[10px] font-semibold tracking-wider uppercase mt-0.5 ${
              theme === 'dark' ? 'text-sky-300' : 'text-slate-500'
            }`}
          >
            Climatização
          </span>
        )}
      </div>
    </div>
  );
};
