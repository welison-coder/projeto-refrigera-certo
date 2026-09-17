/**
 * Gerador de fotos demonstrativas realistas para etiquetas técnicas e instalações
 * Garante que os aparelhos venham pré-configurados com registros visuais para visualização imediata no Lightbox
 */

export function generateSampleLabelPhoto(params: {
  brand: string;
  model: string;
  capacity: string;
  gasType: string;
  serialNumber: string;
  currentAmp: string;
  voltage: string;
}): string {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520" width="800" height="520">
  <defs>
    <!-- Gradiente metálico de placa técnica de alumínio escovado -->
    <linearGradient id="metalPlate" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2b313a" />
      <stop offset="50%" stop-color="#1e242d" />
      <stop offset="100%" stop-color="#141920" />
    </linearGradient>
    <linearGradient id="accentBar" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0284c7" />
      <stop offset="100%" stop-color="#0369a1" />
    </linearGradient>
    <filter id="plateShadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.5"/>
    </filter>
  </defs>

  <!-- Fundo do ambiente / gabinete da máquina -->
  <rect width="800" height="520" fill="#0f172a" />
  <rect x="20" y="20" width="760" height="480" rx="8" fill="#1e293b" stroke="#334155" stroke-width="2" />
  
  <!-- Rebites de fixação nos cantos -->
  <circle cx="45" cy="45" r="7" fill="#64748b" stroke="#334155" stroke-width="2"/>
  <circle cx="755" cy="45" r="7" fill="#64748b" stroke="#334155" stroke-width="2"/>
  <circle cx="45" cy="475" r="7" fill="#64748b" stroke="#334155" stroke-width="2"/>
  <circle cx="755" cy="475" r="7" fill="#64748b" stroke="#334155" stroke-width="2"/>

  <!-- Placa de Identificação Técnica Metalizada -->
  <g transform="translate(60, 50)">
    <rect width="680" height="420" rx="6" fill="url(#metalPlate)" stroke="#475569" stroke-width="2" />
    
    <!-- Faixa de cabeçalho da marca -->
    <rect x="0" y="0" width="680" height="58" rx="6" fill="url(#accentBar)" />
    <rect x="0" y="46" width="680" height="12" fill="url(#accentBar)" />
    
    <text x="24" y="38" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="900" fill="#ffffff" letter-spacing="1.5">
      ${params.brand.toUpperCase()} CLIMATIZAÇÃO
    </text>
    <text x="656" y="36" text-anchor="end" font-family="monospace" font-size="13" font-weight="bold" fill="#bae6fd">
      ETIQUETA TÉCNICA OFICIAL
    </text>

    <!-- Linha divisória fina -->
    <line x1="20" y1="75" x2="660" y2="75" stroke="#334155" stroke-width="1" />

    <!-- Coluna da Esquerda: Dados Principais -->
    <g transform="translate(24, 90)">
      <!-- Modelo -->
      <text x="0" y="16" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="#94a3b8" text-transform="uppercase">MODELO DO APARELHO / MODEL</text>
      <text x="0" y="42" font-family="monospace" font-size="20" font-weight="bold" fill="#38bdf8">${params.model}</text>

      <!-- Capacidade BTU -->
      <text x="0" y="80" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="#94a3b8">CAPACIDADE TÉRMICA</text>
      <text x="0" y="106" font-family="system-ui, sans-serif" font-size="20" font-weight="bold" fill="#f8fafc">${params.capacity}</text>

      <!-- Gás Refrigerante -->
      <text x="0" y="144" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="#94a3b8">FLUIDO REFRIGERANTE / GAS</text>
      <text x="0" y="170" font-family="monospace" font-size="20" font-weight="bold" fill="#34d399">${params.gasType}</text>

      <!-- Corrente Elétrica -->
      <text x="0" y="208" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="#94a3b8">CORRENTE NOMINAL (OPERAÇÃO)</text>
      <text x="0" y="234" font-family="monospace" font-size="19" font-weight="bold" fill="#fbbf24">${params.currentAmp}</text>
    </g>

    <!-- Coluna da Direita: Nº de Série, Tensão e Barcode -->
    <g transform="translate(360, 90)">
      <!-- Nº de Série -->
      <text x="0" y="16" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="#94a3b8">NÚMERO DE SÉRIE / SERIAL NO.</text>
      <text x="0" y="42" font-family="monospace" font-size="18" font-weight="bold" fill="#f1f5f9">${params.serialNumber}</text>

      <!-- Tensão e Frequência -->
      <text x="0" y="80" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="#94a3b8">ALIMENTAÇÃO ELÉTRICA</text>
      <text x="0" y="106" font-family="monospace" font-size="18" font-weight="bold" fill="#e2e8f0">${params.voltage} ~ 60Hz</text>

      <!-- Pressões de Teste -->
      <text x="0" y="144" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="#94a3b8">PRESSÃO ADMISSÍVEL (ALTA / BAIXA)</text>
      <text x="0" y="170" font-family="monospace" font-size="15" font-weight="bold" fill="#94a3b8">4.15 MPa / 2.20 MPa</text>

      <!-- Ilustração de Código de Barras / QR Code de Inspeção -->
      <g transform="translate(0, 195)">
        <rect width="295" height="52" fill="#ffffff" rx="4" />
        <!-- Barras do código de barras -->
        <g fill="#0f172a">
          <rect x="15" y="6" width="3" height="40" />
          <rect x="22" y="6" width="2" height="40" />
          <rect x="28" y="6" width="5" height="40" />
          <rect x="36" y="6" width="2" height="40" />
          <rect x="42" y="6" width="4" height="40" />
          <rect x="50" y="6" width="1" height="40" />
          <rect x="56" y="6" width="6" height="40" />
          <rect x="66" y="6" width="2" height="40" />
          <rect x="72" y="6" width="4" height="40" />
          <rect x="80" y="6" width="3" height="40" />
          <rect x="88" y="6" width="5" height="40" />
          <rect x="98" y="6" width="2" height="40" />
          <rect x="106" y="6" width="4" height="40" />
          <rect x="115" y="6" width="2" height="40" />
          <rect x="122" y="6" width="5" height="40" />
          <rect x="132" y="6" width="3" height="40" />
          <rect x="140" y="6" width="2" height="40" />
          <rect x="148" y="6" width="4" height="40" />
          <rect x="156" y="6" width="6" height="40" />
          <rect x="166" y="6" width="2" height="40" />
          <rect x="174" y="6" width="4" height="40" />
          <rect x="182" y="6" width="3" height="40" />
          <rect x="190" y="6" width="5" height="40" />
          <rect x="200" y="6" width="2" height="40" />
          <rect x="210" y="6" width="4" height="40" />
          <rect x="220" y="6" width="3" height="40" />
          <rect x="230" y="6" width="5" height="40" />
          <rect x="242" y="6" width="2" height="40" />
          <rect x="250" y="6" width="4" height="40" />
          <rect x="260" y="6" width="2" height="40" />
          <rect x="270" y="6" width="5" height="40" />
        </g>
      </g>
    </g>

    <!-- Rodapé da Placa -->
    <g transform="translate(24, 375)">
      <rect width="632" height="30" rx="4" fill="#0f172a" />
      <text x="12" y="20" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="#38bdf8">
        ✓ REGISTRO TÉCNICO VERIFICADO EM CAMPO
      </text>
      <text x="620" y="20" text-anchor="end" font-family="monospace" font-size="11" fill="#94a3b8">
        LAUDO AR SOLUÇÕES
      </text>
    </g>
  </g>
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function generateSampleInstallationPhoto(params: {
  title: string;
  unitType: 'evaporadora' | 'condensadora';
  location: string;
  brand: string;
  capacity: string;
}): string {
  const isOutdoor = params.unitType === 'condensadora';
  const bgColor = isOutdoor ? '#1e293b' : '#f8fafc';
  const wallColor = isOutdoor ? '#334155' : '#e2e8f0';

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520" width="800" height="520">
  <defs>
    <linearGradient id="unitBody" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#e2e8f0" />
    </linearGradient>
    <linearGradient id="grille" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#475569" />
      <stop offset="100%" stop-color="#334155" />
    </linearGradient>
    <linearGradient id="copperPipe" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#334155" />
      <stop offset="50%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>
  </defs>

  <!-- Parede de fundo do local -->
  <rect width="800" height="520" fill="${wallColor}" />
  
  <!-- Linhas de textura de parede / azulejo ou alvenaria -->
  <line x1="0" y1="130" x2="800" y2="130" stroke="#cbd5e1" stroke-width="1" stroke-dasharray="8 8" />
  <line x1="0" y1="260" x2="800" y2="260" stroke="#cbd5e1" stroke-width="1" stroke-dasharray="8 8" />
  <line x1="0" y1="390" x2="800" y2="390" stroke="#cbd5e1" stroke-width="1" stroke-dasharray="8 8" />

  ${isOutdoor ? `
    <!-- CONDENSADORA EXTERNA (Suportes com calços antivibração e hélice) -->
    <!-- Suporte Metálico de Parede / Mísulas -->
    <rect x="230" y="340" width="20" height="110" fill="#64748b" />
    <polygon points="230,450 250,450 330,340 310,340" fill="#475569" />
    <rect x="550" y="340" width="20" height="110" fill="#64748b" />
    <polygon points="550,450 570,450 650,340 630,340" fill="#475569" />
    <!-- Coxins de borracha -->
    <rect x="220" y="330" width="40" height="12" rx="3" fill="#0f172a" />
    <rect x="540" y="330" width="40" height="12" rx="3" fill="#0f172a" />

    <!-- Gabinete Condensadora -->
    <rect x="180" y="150" width="440" height="200" rx="16" fill="url(#unitBody)" stroke="#94a3b8" stroke-width="3" />
    
    <!-- Grade frontal circular da hélice -->
    <circle cx="350" cy="250" r="75" fill="#334155" stroke="#cbd5e1" stroke-width="4" />
    <circle cx="350" cy="250" r="55" fill="none" stroke="#64748b" stroke-width="2" />
    <circle cx="350" cy="250" r="35" fill="none" stroke="#64748b" stroke-width="2" />
    <circle cx="350" cy="250" r="15" fill="#94a3b8" />
    
    <!-- Tubulação de Cobre com Isolamento Armaflex e Fita PVC -->
    <path d="M 580 230 Q 640 230 680 280 L 680 520" fill="none" stroke="url(#copperPipe)" stroke-width="22" stroke-linecap="round" />
    <path d="M 580 255 Q 630 255 660 300 L 660 520" fill="none" stroke="#ffffff" stroke-width="12" stroke-linecap="round" />
    
    <!-- Logo da Marca na Unidade -->
    <rect x="210" y="175" width="100" height="28" rx="4" fill="#0284c7" />
    <text x="260" y="194" text-anchor="middle" font-family="system-ui, sans-serif" font-size="13" font-weight="900" fill="#ffffff">
      ${params.brand.toUpperCase()}
    </text>
  ` : `
    <!-- EVAPORADORA INTERNA (Split Hi-Wall / Piso Teto clean e nivelado) -->
    <!-- Sombra suave na parede -->
    <rect x="145" y="155" width="510" height="175" rx="14" fill="#000000" opacity="0.12" />

    <!-- Corpo da Unidade Evaporadora -->
    <rect x="140" y="140" width="520" height="170" rx="12" fill="url(#unitBody)" stroke="#cbd5e1" stroke-width="2" />
    
    <!-- Friso de Aleta de insuflamento inferior -->
    <rect x="155" y="275" width="490" height="22" rx="4" fill="#94a3b8" stroke="#64748b" stroke-width="1" />
    
    <!-- Display digital iluminado (temperatura 22°C) -->
    <rect x="560" y="200" width="60" height="32" rx="6" fill="#0f172a" />
    <text x="590" y="224" text-anchor="middle" font-family="monospace" font-size="18" font-weight="bold" fill="#38bdf8">22°</text>

    <!-- Logo da Marca centralizado -->
    <text x="400" y="195" text-anchor="middle" font-family="system-ui, sans-serif" font-size="16" font-weight="bold" fill="#475569" letter-spacing="2">
      ${params.brand.toUpperCase()}
    </text>
    <text x="400" y="215" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="#0284c7">
      INVERTER
    </text>

    <!-- Canaleta ou furo de acabamento de dreno e linhas -->
    <rect x="120" y="270" width="25" height="18" rx="2" fill="#e2e8f0" stroke="#94a3b8" />
  `}

  <!-- Overlay Informativo de Vistoria / Inspeção Técnica no Rodapé -->
  <rect x="20" y="440" width="760" height="60" rx="10" fill="#0f172a" opacity="0.92" />
  
  <text x="40" y="465" font-family="system-ui, sans-serif" font-size="13" font-weight="bold" fill="#ffffff">
    INSPEÇÃO TÉCNICA DE INSTALAÇÃO NO LOCAL
  </text>
  <text x="40" y="485" font-family="system-ui, sans-serif" font-size="11" fill="#94a3b8">
    ${params.location} • ${params.brand} ${params.capacity} • Instalação com vácuo e tubulação isolada
  </text>

  <rect x="630" y="455" width="130" height="30" rx="6" fill="#059669" />
  <text x="695" y="475" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="#ffffff">
    ✓ APROVADO
  </text>
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function generateSampleCondenserPhoto(params: {
  title?: string;
  location: string;
  brand: string;
  capacity: string;
}): string {
  return generateSampleInstallationPhoto({
    title: params.title || `Unidade Condensadora Externa ${params.brand}`,
    unitType: 'condensadora',
    location: params.location,
    brand: params.brand,
    capacity: params.capacity
  });
}

