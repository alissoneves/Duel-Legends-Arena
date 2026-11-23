// Gera em sequência os vídeos listados em lote.txt (arquivo | argumentos do video.mjs).
// Uso (de dentro de ferramentas/insta): node lote.mjs [pasta-saida] [filtro]
//   pasta-saida: padrão tmp/lote (depois de conferir, copie para ../../insta/)
//   filtro: só gera linhas cujo arquivo contém esse texto (ex.: g0)
// Se uma luta não tiver nocaute, tenta as sementes 2 a 6.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const saida = path.resolve(aqui, process.argv[2] || 'tmp/lote');
const filtro = process.argv[3] || '';
fs.mkdirSync(saida, { recursive: true });
const dividir = s => (s.match(/"[^"]*"|\S+/g) || []).map(t => t.replace(/^"|"$/g, ''));
const linhas = fs.readFileSync(path.join(aqui, 'lote.txt'), 'utf8').split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
const falhas = [];
for (const l of linhas) {
  const [arq, resto] = l.split('|').map(s => s.trim());
  if (filtro && !arq.includes(filtro)) continue;
  const base = dividir(resto);
  const temSeed = base.includes('--seed');
  let ok = false;
  for (const seed of temSeed ? [null] : [1, 2, 3, 4, 5, 6]) {
    const args = ['video.mjs', ...base, ...(seed ? ['--seed', String(seed)] : []), '--saida', path.join(saida, arq)];
    const r = spawnSync(process.execPath, args, { cwd: aqui, encoding: 'utf8' });
    const out = (r.stdout || '') + (r.stderr || '');
    if (r.status === 0) { console.log(`ok  ${arq}  ${(out.match(/^.* x .* em .*$/m) || [''])[0]}`); ok = true; break; }
    if (!/Nenhum nocaute/.test(out)) { console.log(`ERRO ${arq}\n${out.slice(-600)}`); break; }
  }
  if (!ok) falhas.push(arq);
}
console.log(falhas.length ? `Falharam: ${falhas.join(', ')}` : 'Todos gerados.');
