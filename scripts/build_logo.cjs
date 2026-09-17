const fs = require('fs');
const path = require('path');
const opentype = require('opentype.js');
const sharp = require('sharp');

async function renderBrandLogo() {
  const font900Buffer = fs.readFileSync(path.join(__dirname, 'fonts/Montserrat-900.ttf'));
  const font700Buffer = fs.readFileSync(path.join(__dirname, 'fonts/Montserrat-700.ttf'));

  const font900 = opentype.parse(font900Buffer.buffer);
  const font700 = opentype.parse(font700Buffer.buffer);

  // Exact brand colors sampled from uploaded ar_solucoes_evolution_horizontal_HD (1).png
  const CRIMSON = '#E31B44';
  const NAVY = '#0F172A';
  const SLATE = '#5C6B7E';
  const DIVIDER = '#D1D5DB';

  // Typography dimensions
  const mainFontSize = 140;
  const mainY = 196;
  const wordmarkStartX = 445;

  // "Ar"
  const arPath = font900.getPath('Ar', wordmarkStartX, mainY, mainFontSize);
  const arAdvance = font900.getAdvanceWidth('Ar', mainFontSize);

  // "SOLUÇÕES"
  const solucoesStartX = wordmarkStartX + arAdvance + 28;
  const solucoesPath = font900.getPath('SOLUÇÕES', solucoesStartX, mainY, mainFontSize);
  const solucoesAdvance = font900.getAdvanceWidth('SOLUÇÕES', mainFontSize);

  const wordmarkEnd = solucoesStartX + solucoesAdvance;

  // "CLIMATIZAÇÃO"
  const subText = 'CLIMATIZAÇÃO';
  const subFontSize = 40;
  const subY = 286;
  const subStartX = wordmarkStartX + 4;
  
  // Calculate total natural width of subText to evenly space it to match the wordmark length
  const targetSubWidth = wordmarkEnd - 55 - subStartX;
  let naturalSubWidth = 0;
  for (const char of subText) {
    naturalSubWidth += font700.getAdvanceWidth(char, subFontSize);
  }
  const extraSpacing = (targetSubWidth - naturalSubWidth) / (subText.length - 1);

  let currentSubX = subStartX;
  const subPaths = [];
  for (let i = 0; i < subText.length; i++) {
    const char = subText[i];
    const charPath = font700.getPath(char, currentSubX, subY, subFontSize);
    subPaths.push(charPath.toPathData(2));
    currentSubX += font700.getAdvanceWidth(char, subFontSize) + extraSpacing;
  }

  // Red dot after CLIMATIZAÇÃO
  const dotSubX = currentSubX + 28;
  const dotSubY = 274;
  const dotSubRadius = 9;

  // Tight canvas calculation
  const minX = 65;
  const minY = 38;
  const maxX = dotSubX + 24;
  const maxY = 322;
  const vbWidth = Math.ceil(maxX - minX);
  const vbHeight = Math.ceil(maxY - minY);

  // Emblem:
  // Beautiful, continuous, authentic monogram "A" + "r" with wave and red terminal dot
  const emblemSvg = `
    <g id="brand-emblem">
      <!-- RED "A" GLYPH - Slanted ~14deg with smooth apex and clean base feet -->
      <!-- Left leg & apex & right outer leg -->
      <path 
        d="M 92 315 
           L 155 315 
           L 188 226 
           L 242 226 
           L 256 315 
           L 318 315 
           L 236 60 
           C 229 44 216 38 202 42 
           C 188 46 179 58 172 74 
           Z 
           M 204 112 
           L 224 176 
           L 186 176 
           Z" 
        fill="${CRIMSON}" 
      />

      <!-- Dynamic crossbar extending to the right through the r -->
      <path 
        d="M 170 234 
           L 302 234 
           C 316 234 324 244 322 255 
           C 320 266 308 272 292 272 
           L 154 272 
           Z" 
        fill="${CRIMSON}" 
      />

      <!-- UPRIGHT "r" STEM (Deep Navy with smooth rounded corners) -->
      <rect x="206" y="142" width="56" height="173" rx="12" fill="${NAVY}" />

      <!-- Smooth sweeping arch of "r" branching rightward -->
      <path 
        d="M 260 178 
           C 260 138 288 116 330 116 
           C 358 116 384 130 394 154 
           C 396 170 382 188 360 188 
           C 338 188 318 174 304 161 
           C 296 154 284 156 270 168 
           L 270 200 
           Z" 
        fill="${NAVY}" 
      />

      <!-- Crimson accent dot inside terminal of the "r" arch -->
      <circle cx="376" cy="164" r="14.5" fill="${CRIMSON}" />

      <!-- Concentric broadcast / cooling breeze arc above the "r" -->
      <path 
        d="M 310 102 C 336 86 372 90 396 110" 
        stroke="${CRIMSON}" 
        stroke-width="8.5" 
        stroke-linecap="round" 
        fill="none" 
      />
    </g>
  `;

  // Full SVG with transparent background tightly bounding the contents
  const fullSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${vbWidth} ${vbHeight}" width="${vbWidth}" height="${vbHeight}" fill="none">
  <!-- Left Emblem -->
  ${emblemSvg}

  <!-- Vertical Divider Line -->
  <line x1="422" y1="52" x2="422" y2="315" stroke="${DIVIDER}" stroke-width="2.8" stroke-linecap="round" />

  <!-- "Ar" in Crimson -->
  <path d="${arPath.toPathData(2)}" fill="${CRIMSON}" />

  <!-- "SOLUÇÕES" in Navy -->
  <path d="${solucoesPath.toPathData(2)}" fill="${NAVY}" />

  <!-- "C L I M A T I Z A Ç Ã O" in Slate -->
  ${subPaths.map(p => `<path d="${p}" fill="${SLATE}" />`).join('\n  ')}

  <!-- Accent Dot after CLIMATIZAÇÃO in Crimson -->
  <circle cx="${dotSubX}" cy="${dotSubY}" r="${dotSubRadius}" fill="${CRIMSON}" />
</svg>`.trim();

  // 1. Write public/logo.svg and dist/logo.svg
  fs.writeFileSync(path.join(__dirname, '../public/logo.svg'), fullSvg, 'utf-8');
  if (fs.existsSync(path.join(__dirname, '../dist'))) {
    fs.writeFileSync(path.join(__dirname, '../dist/logo.svg'), fullSvg, 'utf-8');
  }

  // 2. High-DPI transparent PNG (rendered at 2x density for ultra-crisp Retina / HD displays)
  const targetWidth = vbWidth * 2;
  const targetHeight = vbHeight * 2;

  const pngBuffer = await sharp(Buffer.from(fullSvg), { density: 144 })
    .resize(targetWidth, targetHeight)
    .png({ compressionLevel: 9 })
    .toBuffer();

  fs.writeFileSync(path.join(__dirname, '../public/ar_solucoes_evolution_horizontal_HD.png'), pngBuffer);
  fs.writeFileSync(path.join(__dirname, '../public/logo.png'), pngBuffer);

  if (fs.existsSync(path.join(__dirname, '../dist'))) {
    fs.writeFileSync(path.join(__dirname, '../dist/ar_solucoes_evolution_horizontal_HD.png'), pngBuffer);
    fs.writeFileSync(path.join(__dirname, '../dist/logo.png'), pngBuffer);
  }

  // 3. Crisp white-background version
  const whiteBgSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${vbWidth} ${vbHeight}" width="${vbWidth}" height="${vbHeight}">
  <rect x="${minX}" y="${minY}" width="${vbWidth}" height="${vbHeight}" fill="#FFFFFF" />
  ${fullSvg.replace(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${vbWidth} ${vbHeight}" width="${vbWidth}" height="${vbHeight}" fill="none">`, '').replace('</svg>', '')}
</svg>`;

  const whitePngBuffer = await sharp(Buffer.from(whiteBgSvg), { density: 144 })
    .resize(targetWidth, targetHeight)
    .png({ compressionLevel: 9 })
    .toBuffer();

  fs.writeFileSync(path.join(__dirname, '../public/ar_solucoes_evolution_horizontal_HD_white.png'), whitePngBuffer);
  if (fs.existsSync(path.join(__dirname, '../dist'))) {
    fs.writeFileSync(path.join(__dirname, '../dist/ar_solucoes_evolution_horizontal_HD_white.png'), whitePngBuffer);
  }

  console.log(`Successfully generated HD Logo: ${targetWidth}x${targetHeight}px, viewBox: ${minX} ${minY} ${vbWidth} ${vbHeight}`);
}

renderBrandLogo().catch(console.error);
