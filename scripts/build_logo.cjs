const fs = require('fs');
const path = require('path');
const opentype = require('opentype.js');
const sharp = require('sharp');

async function generateLogo() {
  const font900Buffer = fs.readFileSync(path.join(__dirname, 'fonts/Montserrat-900.ttf'));
  const font700Buffer = fs.readFileSync(path.join(__dirname, 'fonts/Montserrat-700.ttf'));

  const font900 = opentype.parse(font900Buffer.buffer);
  const font700 = opentype.parse(font700Buffer.buffer);

  // Exact brand colors sampled from ar_solucoes_evolution_horizontal_HD.png
  const CRIMSON = '#E31B44';
  const NAVY = '#101626';
  const SLATE = '#5C6B7E';
  const DIVIDER = '#D8DEE4';

  // Canvas dimensions with optimal aspect ratio
  const width = 1420;
  const height = 400;

  // 1. Text Geometry
  const mainFontSize = 136;
  const mainY = 210;
  const wordmarkStartX = 450;

  // "Ar"
  const arPath = font900.getPath('Ar', wordmarkStartX, mainY, mainFontSize);
  const arAdvance = font900.getAdvanceWidth('Ar', mainFontSize);

  // "SOLUÇÕES"
  const solucoesStartX = wordmarkStartX + arAdvance + 28;
  const solucoesPath = font900.getPath('SOLUÇÕES', solucoesStartX, mainY, mainFontSize);
  const solucoesAdvance = font900.getAdvanceWidth('SOLUÇÕES', mainFontSize);

  // "CLIMATIZAÇÃO"
  const subText = 'CLIMATIZAÇÃO';
  const subFontSize = 41;
  const subY = 302;
  const subStartX = wordmarkStartX + 4;
  
  // Calculate total natural width of subText to evenly space it to match the wordmark length
  const targetSubWidth = (solucoesStartX + solucoesAdvance - 40) - subStartX;
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
  const dotSubX = currentSubX + 38;
  const dotSubY = 290;
  const dotSubRadius = 10;

  // 2. Left Emblem: Intertwined slanted 'A' and upright 'r'
  // Center of emblem is X = 220, Y = 200
  const emblemSvg = `
    <g id="brand-emblem" transform="translate(45, 10)">
      <!-- RED 'A' GLYPH (slanted forward ~14 degrees) -->
      <!-- Left leg going up to apex -->
      <path 
        d="M 120 315 L 62 315 L 175 62 C 182 45 198 38 214 42 C 228 45 238 58 245 74 L 295 186 L 246 186 L 208 98 Z" 
        fill="${CRIMSON}" 
      />
      <!-- Dynamic horizontal crossbar of A passing behind the r stem -->
      <path 
        d="M 116 242 L 285 242 C 300 242 308 252 305 264 C 302 276 290 282 272 282 L 95 282 Z" 
        fill="${CRIMSON}" 
      />
      <!-- Bottom right descending foot of A -->
      <path 
        d="M 235 315 L 295 315 L 274 262 L 235 262 Z" 
        fill="${CRIMSON}" 
      />

      <!-- UPRIGHT 'r' IN DEEP NAVY -->
      <!-- Vertical pillar/stem with rounded corners -->
      <rect x="210" y="148" width="58" height="167" rx="12" fill="${NAVY}" />

      <!-- Smooth arch of 'r' branching to the right -->
      <path 
        d="M 264 182 C 264 142 292 120 334 120 C 362 120 388 134 398 158 C 400 174 386 192 364 192 C 342 192 322 178 308 165 C 300 158 288 160 274 172 L 274 205 Z" 
        fill="${NAVY}" 
      />

      <!-- Crimson red dot accent on the right tip of the arch -->
      <circle cx="380" cy="168" r="16" fill="${CRIMSON}" />

      <!-- Concentric broadcast signal wave arc above the r arch -->
      <path 
        d="M 314 105 C 340 90 374 94 398 114" 
        stroke="${CRIMSON}" 
        stroke-width="9" 
        stroke-linecap="round" 
        fill="none" 
      />
    </g>
  `;

  // Full SVG with transparent background
  const fullSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" fill="none">
  <!-- Left Emblem -->
  ${emblemSvg}

  <!-- Vertical Divider Line -->
  <line x1="422" y1="72" x2="422" y2="330" stroke="${DIVIDER}" stroke-width="3" stroke-linecap="round" />

  <!-- "Ar" in Crimson -->
  <path d="${arPath.toPathData(2)}" fill="${CRIMSON}" />

  <!-- "SOLUÇÕES" in Navy -->
  <path d="${solucoesPath.toPathData(2)}" fill="${NAVY}" />

  <!-- "C L I M A T I Z A Ç Ã O" in Slate -->
  ${subPaths.map(p => `<path d="${p}" fill="${SLATE}" />`).join('\n  ')}

  <!-- Accent Dot after CLIMATIZAÇÃO in Crimson -->
  <circle cx="${dotSubX}" cy="${dotSubY}" r="${dotSubRadius}" fill="${CRIMSON}" />
</svg>`.trim();

  // 1. Write public/logo.svg
  fs.writeFileSync(path.join(__dirname, '../public/logo.svg'), fullSvg, 'utf-8');

  // 2. Generate HD PNG with transparent background
  const pngBuffer = await sharp(Buffer.from(fullSvg))
    .png({ compressionLevel: 9 })
    .toBuffer();

  fs.writeFileSync(path.join(__dirname, '../public/ar_solucoes_evolution_horizontal_HD.png'), pngBuffer);
  fs.writeFileSync(path.join(__dirname, '../public/logo.png'), pngBuffer);

  // 3. Also generate a clean white-background version if needed
  const whiteBgSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <rect width="${width}" height="${height}" fill="#FFFFFF" />
  ${fullSvg.replace('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1420 400" width="1420" height="400" fill="none">', '').replace('</svg>', '')}
</svg>`;
  
  const whitePngBuffer = await sharp(Buffer.from(whiteBgSvg))
    .png({ compressionLevel: 9 })
    .toBuffer();
  fs.writeFileSync(path.join(__dirname, '../public/ar_solucoes_evolution_horizontal_HD_white.png'), whitePngBuffer);

  console.log('Successfully generated:');
  console.log(' - /public/logo.svg');
  console.log(' - /public/ar_solucoes_evolution_horizontal_HD.png (' + pngBuffer.length + ' bytes)');
  console.log(' - /public/logo.png');
}

generateLogo().catch(console.error);
