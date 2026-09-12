// ==============================================================================
// Hostinger Node.js Application Startup File
// ==============================================================================
// Este arquivo é o ponto de entrada comum aceito pelo gerenciador Node.js da Hostinger.
// Ele carrega o servidor de produção compilado em dist/server.cjs (gerado por npm run build).

const path = require('path');
const fs = require('fs');

const bundlePath = path.resolve(__dirname, 'dist', 'server.cjs');

if (!fs.existsSync(bundlePath)) {
  console.error('[Hostinger Startup Error] O arquivo compilado "dist/server.cjs" não foi encontrado.');
  console.error('Execute o comando de build antes de iniciar o aplicativo:');
  console.error('  npm run build');
  process.exit(1);
}

// Inicia o servidor compilado
require(bundlePath);
