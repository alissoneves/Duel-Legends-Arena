// Monta o jogo: junta src/index.html com os arquivos de src/js (em ordem) num único index.html.
// Uso: node build.js   (sem dependências)
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, 'src');
const shell = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
const parts = fs.readdirSync(path.join(dir, 'js')).filter(f => f.endsWith('.js')).sort()
  .map(f => fs.readFileSync(path.join(dir, 'js', f), 'utf8'));
if (!shell.includes('/*@@JS@@*/')) throw new Error('src/index.html sem a marca /*@@JS@@*/');
const out = shell.replace('/*@@JS@@*/', () => parts.join('\n'));
fs.writeFileSync(path.join(__dirname, 'index.html'), out);
console.log(`index.html montado: ${parts.length} partes, ${(out.length / 1024).toFixed(0)} KB`);
