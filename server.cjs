// ==============================================================================
// Hostinger Node.js Application Startup File (CommonJS fallback)
// ==============================================================================
// Se no painel da Hostinger você definir o startup file como "server.cjs"
// este arquivo será carregado diretamente no modo CommonJS.

const path = require('node:path');
const fs = require('node:fs');

const bundlePath = path.resolve(__dirname, 'dist', 'server.cjs');

if (!fs.existsSync(bundlePath)) {
  console.error('[Hostinger Startup Error] O arquivo compilado "dist/server.cjs" não foi encontrado.');
  console.error('Execute o comando de build antes de iniciar o aplicativo:');
  console.error('  npm run build');
  process.exit(1);
}

require(bundlePath);
