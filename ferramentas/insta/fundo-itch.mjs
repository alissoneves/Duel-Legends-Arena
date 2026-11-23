// Fundo da página do itch.io: "arquibancada de lendas".
// As laterais viram arquibancadas de uma arena à noite com as lendas do jogo como plateia
// (silhuetas, algumas acesas como se tivessem sido sorteadas). O centro fica calmo, para o conteúdo do itch.
// Uso (de dentro de ferramentas/insta, depois de `node build.js` na raiz):
//   node fundo-itch.mjs [--saida arq.png] [--largura 2400] [--altura 1600] [--coluna 1000] [--seed 3]
import { chromium } from 'playwright-core';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(aqui, '../..');
const a = process.argv.slice(2), opt = {};
for (let i = 0; i < a.length; i += 2) opt[a[i].replace(/^--/, '')] = a[i + 1];
const cfg = { W: +(opt.largura || 2400), H: +(opt.altura || 1600), coluna: +(opt.coluna || 1000), seed: +(opt.seed || 3) };
const saida = path.resolve(opt.saida || path.join(aqui, 'tmp', 'fundo_itch.png'));
fs.mkdirSync(path.dirname(saida), { recursive: true });

let nav;
for (const channel of ['msedge', 'chrome', undefined]) { try { nav = await chromium.launch(channel ? { channel } : {}); break; } catch {} }
const p = await nav.newPage({ viewport: { width: 1280, height: 720 } });
await p.goto(pathToFileURL(path.join(raiz, 'index.html')).href);
await p.waitForFunction(() => window.__dla && document.fonts.status === 'loaded');
const png = await p.evaluate((C) => {
  window.__frozen = true;
  const D = window.__dla, { W, H, coluna } = C;
  let s = C.seed >>> 0; const rnd = () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
  const FUNDO = '#0b0c14';
  x.fillStyle = FUNDO; x.fillRect(0, 0, W, H);

  // silhueta na cor de tinta do jogo (como a Coleção mostra lendas não descobertas)
  const silh = {};
  const sombra = id => { if (silh[id]) return silh[id]; const sp = D.SPR[id], t = document.createElement('canvas'); t.width = sp.w; t.height = sp.h; const g = t.getContext('2d'); g.drawImage(sp.img, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = '#23264a'; g.fillRect(0, 0, sp.w, sp.h); return silh[id] = t; };
  const ids = Object.keys(D.SPR);

  // arquibancadas: degraus de pedra em cada lateral
  const lado = (W - coluna) / 2, esc = 4, passoX = 76, passoY = 104, degrau = 22;
  const dados = [];
  const desenhaLado = (x0, x1, espelho) => {
    for (let y = 40, fila = 0; y < H; y += passoY, fila++) {
      // degrau (tom do mesmo neutro, sem cor nova)
      x.fillStyle = fila % 2 ? '#10121e' : '#12142a'; x.fillRect(x0, y + 80 - 6, x1 - x0, degrau);
      x.fillStyle = 'rgba(255,255,255,0.04)'; x.fillRect(x0, y + 80 - 6, x1 - x0, 2);
      const desloc = fila % 2 ? passoX / 2 : 0;
      for (let cx = x0 + 30 + desloc; cx < x1 - 20; cx += passoX) {
        const id = ids[Math.floor(rnd() * ids.length)], sp = D.SPR[id];
        const acesa = rnd() < 0.13;
        const img = acesa ? sp.img : sombra(id);
        const jitter = Math.round((rnd() - 0.5) * 8);
        x.save(); x.translate(Math.round(cx + jitter), y + 80); x.scale(espelho ? -1 : 1, 1);
        x.drawImage(img, Math.round(-sp.w * esc / 2), -sp.h * esc, sp.w * esc, sp.h * esc); x.restore();
        // dado do sorteio, raro, no meio da plateia
        if (!acesa && rnd() < 0.025) dados.push([Math.round(cx + 26), y + 18]);
        if (false) { const dx = 0, dy = 0, k = 3; x.fillStyle = FUNDO; x.fillRect(dx - k, dy - k, 12 * k, 12 * k); x.fillStyle = '#ffffff'; x.fillRect(dx, dy, 10 * k, 10 * k); x.fillStyle = '#e0393e'; x.fillRect(dx + k, dy + k, 3 * k, 3 * k); x.fillStyle = FUNDO; for (const [u, v, w] of [[6, 1, 3], [4, 4, 2], [1, 6, 3], [6, 6, 3]]) x.fillRect(dx + u * k, dy + v * k, w * k, w * k); }
      }
    }
  };
  desenhaLado(0, lado + 60, false);
  desenhaLado(W - lado - 60, W, true);
  for (const [dx, dy] of dados) { const k = 3; x.fillStyle = FUNDO; x.fillRect(dx - k, dy - k, 12 * k, 12 * k); x.fillStyle = '#ffffff'; x.fillRect(dx, dy, 10 * k, 10 * k); x.fillStyle = '#e0393e'; x.fillRect(dx + k, dy + k, 3 * k, 3 * k); x.fillStyle = FUNDO; for (const [u, v, w] of [[6, 1, 3], [4, 4, 2], [1, 6, 3], [6, 6, 3]]) x.fillRect(dx + u * k, dy + v * k, w * k, w * k); }

  // a plateia some em direção ao centro (o conteúdo do itch fica sobre fundo calmo)
  for (const [xa, xb] of [[lado - 260, lado + 80], [W - lado + 260, W - lado - 80]]) {
    const g = x.createLinearGradient(xa, 0, xb, 0); g.addColorStop(0, 'rgba(11,12,20,0)'); g.addColorStop(1, 'rgba(11,12,20,1)');
    x.fillStyle = g; x.fillRect(Math.min(xa, xb), 0, Math.abs(xb - xa), H);
  }
  x.fillStyle = FUNDO; x.fillRect(lado + 80, 0, coluna - 160, H);
  // embaixo some no fundo da página (o itch repete a cor de fundo depois da imagem)
  const gb = x.createLinearGradient(0, H - 420, 0, H); gb.addColorStop(0, 'rgba(11,12,20,0)'); gb.addColorStop(1, 'rgba(11,12,20,1)');
  x.fillStyle = gb; x.fillRect(0, H - 420, W, 420);
  return c.toDataURL('image/png');
}, cfg);
fs.writeFileSync(saida, Buffer.from(png.split(',')[1], 'base64'));
await nav.close();
console.log(`Pronto: ${saida} (${cfg.W}x${cfg.H}, coluna central de ${cfg.coluna}px)`);
