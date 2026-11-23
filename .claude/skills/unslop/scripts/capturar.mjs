// Captura telas do Duel Legends Arena para a auditoria do unslop.
// Uso: node .claude/skills/unslop/scripts/capturar.mjs <pasta-saida> [--celular] passo1 passo2 ...
//   passo = estado do jogo (title, modes, shop, pass, profile, missions, album, options, ...)
//         | luta:N    começa uma luta de teste com a lenda N e captura depois de 3 s
//         | espera:MS espera MS milissegundos
//         | btn:ID    aperta o botão ID (como onButton do jogo), sem capturar
//         | js:CÓDIGO roda código na página (window.__dla tem save, G, state...), sem capturar
//         | foto:NOME captura agora com esse nome
// Save de teste: variável de ambiente DLA_SAVE com JSON (mistura com o padrão).
// Abre o index.html da raiz (rode `node build.js` antes se mudou src/).
import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
async function carregarPlaywright() {
  for (const nome of ['playwright', 'playwright-core']) {
    try { return await import(nome); } catch {}
    for (const base of ['ferramentas/insta/package.json', 'package.json']) {
      try { return createRequire(path.join(raiz, base))(nome); } catch {}
    }
  }
  console.error('Playwright não encontrado. Instale dentro de ferramentas/insta (nunca no package.json da raiz, que é o do servidor):\n  cd ferramentas/insta\n  npm init -y        (só se ainda não houver package.json ali)\n  npm i -D playwright-core\nUsa o Edge/Chrome já instalado, sem baixar Chromium. Confira que node_modules está no .gitignore.');
  process.exit(1);
}

const args = process.argv.slice(2);
const celular = args.includes('--celular');
const [saida, ...passos] = args.filter(a => a !== '--celular');
if (!saida || !passos.length) { console.error('Uso: capturar.mjs <pasta-saida> [--celular] title modes luta:7 ...'); process.exit(1); }
fs.mkdirSync(saida, { recursive: true });

const { chromium } = await carregarPlaywright();
let navegador;
for (const channel of ['msedge', 'chrome', undefined]) {
  try { navegador = await chromium.launch(channel ? { channel } : {}); break; } catch {}
}
if (!navegador) { console.error('Nenhum navegador encontrado (Edge, Chrome ou Chromium do Playwright).'); process.exit(1); }

const viewport = celular ? { width: 844, height: 390 } : { width: 1440, height: 810 };
const pagina = await navegador.newPage({ locale: 'pt-BR', viewport, deviceScaleFactor: celular ? 2 : 1, hasTouch: celular });
const erros = [];
pagina.on('pageerror', e => erros.push(e.message));
// pula o tutorial e o pedido de apelido
const saveTeste = { nick: 'Teste', accAsked: true, tutAsked: true, tutDone: true, howto: true, wins: 12, games: 20, ...JSON.parse(process.env.DLA_SAVE || '{}') };
await pagina.addInitScript(s => {
  try { if (!localStorage.getItem('dla_proto')) localStorage.setItem('dla_proto', JSON.stringify(s)); } catch {}
}, saveTeste);
await pagina.goto(pathToFileURL(path.join(raiz, 'index.html')).href);
await pagina.waitForTimeout(1500);

const sufixo = celular ? '-celular' : '';
for (const p of passos) {
  if (p.startsWith('espera:')) { await pagina.waitForTimeout(+p.slice(7)); continue; }
  if (p.startsWith('btn:')) { await pagina.evaluate(id => window.__dla.onButton(id), p.slice(4)); await pagina.waitForTimeout(400); continue; }
  if (p.startsWith('js:')) { await pagina.evaluate(c => (0, eval)(c), p.slice(3)); await pagina.waitForTimeout(200); continue; }
  if (p.startsWith('foto:')) { await pagina.screenshot({ path: path.join(saida, `${p.slice(5)}${sufixo}.png`) }); continue; }
  if (p.startsWith('luta:')) {
    await pagina.evaluate(i => window.__dla.test(+i), p.slice(5));
    await pagina.waitForTimeout(3000);
    await pagina.screenshot({ path: path.join(saida, `luta-${p.slice(5)}${sufixo}.png`) });
    continue;
  }
  await pagina.evaluate(s => { window.__dla.state = s; }, p);
  await pagina.waitForTimeout(700);
  await pagina.screenshot({ path: path.join(saida, `${p}${sufixo}.png`) });
}
if (erros.length) console.log('Erros na página:\n' + erros.slice(0, 5).join('\n'));
console.log(`Capturas em ${path.resolve(saida)}`);
await navegador.close();
