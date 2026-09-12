// ==============================================================================
// Hostinger Node.js Application Startup File (Compatível com "type": "module")
// ==============================================================================
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

// Cria um require seguro dentro do escopo ES Module do Node.js
const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const bundlePath = path.resolve(__dirname, 'dist', 'server.cjs');

if (!fs.existsSync(bundlePath)) {
  console.error('[Hostinger Startup Error] O arquivo compilado "dist/server.cjs" não foi encontrado.');
  console.error('Execute o comando de build no terminal da Hostinger antes de iniciar o aplicativo:');
  console.error('  npm run build');
  process.exit(1);
}

// Carrega o servidor de produção compilado em dist/server.cjs
require(bundlePath);
