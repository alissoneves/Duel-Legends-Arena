// Reel de recurso do jogo (loja, modos, ranqueada...) no padrão de marketing: 1080x1920, 30 fps.
// node feature.mjs <roteiro.json> --saida arq.mp4      depois: python3 som_feat.py arq.mp4 <semente>
//
// roteiro.json: { "titulo": ["MODOS", "DE JOGO"], "sub": "Escolha como lutar", "cor": "#3d7bff",
//   "cenas": [ { "tela": "modes", "legenda": "1x1 ATÉ 5x5", "foco": [x, y, w], "toque": [x, y], "seg": 2.6, "albSel": 12 } ] }
// foco e toque em coordenadas do jogo (480x270). A tela abre inteira (16:9) e o zoom vai até o foco.
import { chromium } from 'playwright-core';
import ffmpegPath from 'ffmpeg-static';
import { spawn } from 'node:child_process';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(aqui, '../..');
const args = process.argv.slice(2), opt = {}, pos = [];
for (let i = 0; i < args.length; i++) { if (args[i].startsWith('--')) opt[args[i].slice(2)] = args[i + 1], i++; else pos.push(args[i]); }
if (!pos[0] || !opt.saida) { console.error('Uso: node feature.mjs roteiro.json --saida arq.mp4'); process.exit(1); }
const RT = JSON.parse(fs.readFileSync(pos[0], 'utf8'));
const saida = path.resolve(opt.saida);
const fontes = Object.fromEntries(['Boldonse-Regular', 'BricolageGrotesque-Bold', 'LilitaOne-Regular'].map(f => [f, 'data:font/ttf;base64,' + fs.readFileSync(path.join(aqui, 'fontes', f + '.ttf')).toString('base64')]));

let navegador;
for (const channel of ['msedge', 'chrome', undefined]) { try { navegador = await chromium.launch(channel ? { channel } : {}); break; } catch {} }
const pagina = await navegador.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1.5, locale: 'pt-BR' });
const erros = []; pagina.on('pageerror', e => erros.push(e.message));
await pagina.addInitScript(() => {
  // perfil de demonstração: coleção, maestrias e elo preenchidos para mostrar as telas "vivas"
  let a = 7; Math.random = function () { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  window.__demo = true;
  localStorage.setItem('dla_proto', JSON.stringify({ nick: 'Lenda', accAsked: true, tutAsked: true, tutDone: true, howto: true, nickAsked: true, games: 240, wins: 151, gd: 3850, po: 12, boxes: 3,
    rank: { tier: 4, div: 2, lp: 64, mmr: 1720, placed: 5, w: 38, l: 21, shield: 0, streak: 3, peak: 4, peakName: '', season: 1, split: 1 },
    opt: { sfx: 0, music: 0, diff: 1, tips: false, lang: 'pt' } }));
});
await pagina.goto(pathToFileURL(path.join(raiz, 'index.html')).href);
await pagina.waitForFunction(() => window.__dla && document.fonts && document.fonts.status === 'loaded', null, { timeout: 30000 });
await pagina.waitForTimeout(800);

const res = await pagina.evaluate(async ({ RT, fontes }) => {
  for (const [nome, url] of Object.entries(fontes)) { const ff = new FontFace(nome, `url(${url})`); await ff.load(); document.fonts.add(ff); }
  window.__frozen = true;
  const D = window.__dla, cv = document.getElementById('c'), S = D.save;
  // coleção e maestrias de demonstração
  S.seen = S.seen || {}; S.mastery = S.mastery || {};
  D.CHARS.forEach((c, i) => { if (i % 10 < 7) S.seen[c.id] = true; if (i % 4 === 0) S.mastery[c.id] = 5 + (i * 37) % 120; });
  const W = 1080, H = 1920, K = cv.width / 480;
  const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  const LIL = '"LilitaOne-Regular"', SANS = '"BricolageGrotesque-Bold"';
  const AM = '#ffd23f', ESC = '#07080f', BR = '#ffffff';
  const cl = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
  const eo = t => 1 - Math.pow(1 - cl(t, 0, 1), 3);
  const eio = t => { t = cl(t, 0, 1); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  const eback = t => { t = cl(t, 0, 1); const s = 1.9; return 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2); };
  const ev = []; let F = 0; const out = [];
  const vinheta = () => { const g = x.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.5)'); x.fillStyle = g; x.fillRect(0, 0, W, H); };
  const emit = () => { vinheta(); out.push(c.toDataURL('image/jpeg', 0.93)); F++; };
  const cabe = (s, tam, max, fonte = LIL) => { x.font = `${tam}px ${fonte}`; const w = x.measureText(s).width; return w > max ? Math.floor(tam * max / w) : tam; };
  const GRAD = { ouro: ['#ffffff', '#fff3a6', '#ffd23f', '#ff9a1f'], gelo: ['#ffffff', '#d8f6ff', '#7fd8ff', '#2f8cff'], fogo: ['#fff1e0', '#ffb36b', '#ff6a2b', '#e0262b'], roxo: ['#ffffff', '#f0dcff', '#c58bff', '#7b3dff'], verde: ['#ffffff', '#dcffd0', '#7ce86a', '#23a84a'] };
  const brawl = (s, X, Y, tam, cores = GRAD.ouro, rot = -0.05) => {
    x.save(); x.translate(X, Y); x.rotate(rot); x.transform(1, 0, -0.1, 1, 0, 0);
    x.font = `${tam}px ${LIL}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round';
    const lw = Math.max(8, tam * 0.2), ex = Math.max(6, tam * 0.13);
    for (let d = ex; d > 0; d -= 2) { x.lineWidth = lw; x.strokeStyle = ESC; x.strokeText(s, 0, d); }
    x.lineWidth = lw; x.strokeStyle = ESC; x.strokeText(s, 0, 0);
    const g = x.createLinearGradient(0, -tam / 2, 0, tam / 2); g.addColorStop(0, cores[0]); g.addColorStop(0.45, cores[1]); g.addColorStop(0.55, cores[2]); g.addColorStop(1, cores[3]);
    x.fillStyle = g; x.fillText(s, 0, 0);
    const tw = x.measureText(s).width; x.fillStyle = 'rgba(255,255,255,0.5)'; x.beginPath(); x.rect(-tw / 2 - 10, -tam / 2, tw + 20, tam * 0.22); x.clip(); x.fillText(s, 0, 0);
    x.restore();
  };
  const pilula = (s, X, Y, tam, bg, fg = ESC) => { x.font = `${tam}px ${SANS}`; x.textAlign = 'center'; x.textBaseline = 'middle'; const w = x.measureText(s).width + tam * 1.1, h = tam * 1.6; x.fillStyle = bg; x.beginPath(); x.roundRect(X - w / 2, Y - h / 2, w, h, h / 2); x.fill(); x.fillStyle = fg; x.fillText(s, X, Y + 2); };
  const raios = (cx, cy, cor, rot, n = 18, alpha = 0.18) => { x.save(); x.translate(cx, cy); x.rotate(rot); x.fillStyle = cor; x.globalAlpha = alpha; for (let k = 0; k < n; k++) { x.rotate(Math.PI * 2 / n); x.beginPath(); x.moveTo(0, 0); x.lineTo(2400, -150); x.lineTo(2400, 150); x.closePath(); x.fill(); } x.restore(); };
  const fundo = (cor, rot, cy = 900) => { x.fillStyle = ESC; x.fillRect(0, 0, W, H); const g = x.createRadialGradient(W / 2, cy, 50, W / 2, cy, 1150); g.addColorStop(0, cor); g.addColorStop(1, ESC); x.globalAlpha = 0.55; x.fillStyle = g; x.fillRect(0, 0, W, H); x.globalAlpha = 1; raios(W / 2, cy, cor, rot); };
  const sprImg = id => D.SPR[id].img;
  const spr = (im, cx, base, esc, vira = 1, alpha = 1) => { x.save(); x.globalAlpha = alpha; x.imageSmoothingEnabled = false; x.translate(cx, base); x.scale(vira, 1); x.drawImage(im, -im.width * esc / 2, -im.height * esc, im.width * esc, im.height * esc); x.restore(); };
  // mão de toque (pixel art simples)
  const mao = (X, Y, esc = 7, press = 0) => {
    const M = ['..##......', '.#..#.....', '.#..#.....', '.#..####..', '.#..#..###', '##..#..#.#', '#...#..#.#', '#........#', '#........#', '.#......#.', '..######..'];
    x.save(); x.translate(X - 2 * esc, Y - 1 * esc + press * 6); x.scale(1 - press * 0.08, 1 - press * 0.08);
    for (let r = 0; r < M.length; r++) for (let q = 0; q < 10; q++) { const ch = M[r][q]; if (ch === '#') { x.fillStyle = ESC; x.fillRect(q * esc - 3, r * esc - 3, esc + 6, esc + 6); } }
    for (let r = 0; r < M.length; r++) { let dentro = false; for (let q = 0; q < 10; q++) { const ch = M[r][q]; if (ch === '#') { x.fillStyle = BR; x.fillRect(q * esc, r * esc, esc, esc); } } }
    // preenchimento
    x.fillStyle = BR; x.fillRect(2 * esc, 1 * esc, 2 * esc, 10 * esc); x.fillRect(1 * esc, 6 * esc, 8 * esc, 4 * esc); x.fillRect(4 * esc, 4 * esc, 5 * esc, 3 * esc);
    x.restore();
  };
  const tela = st => { if (st.albSel != null) D.albSel = st.albSel; D.state = st.tela; D.step(1, 1 / 60); };
  const captura = async () => createImageBitmap(cv);

  // ===== GANCHO (1,6 s) =====
  const cor = RT.cor || '#3d7bff', cores = GRAD[RT.grad || 'ouro'];
  const ids = D.CHARS.filter((_, i) => i % 9 === 3).slice(0, 6).map(c => c.id);
  ev.push({ f: 0, t: 'inicio' });
  for (let f = 0; f < 48; f++) {
    const shake = f >= 6 && f < 14 ? (14 - f) * 3 : 0;
    x.save(); x.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    fundo(cor, f * 0.012, 960);
    x.save(); x.globalAlpha = 0.3; x.strokeStyle = BR; x.lineWidth = 3; for (let k = 0; k < 14; k++) { const yy = (k * 137 + f * 60) % H, xx = (k * 311) % W; x.beginPath(); x.moveTo(xx, yy); x.lineTo(xx, yy + 180); x.stroke(); } x.restore();
    // lendas explodindo do centro
    ids.forEach((id, k) => { const ang = -Math.PI / 2 + (k - 2.5) * 0.55, e = eo((f - 2 - k) / 10), r = 520 * e; spr(sprImg(id), W / 2 + Math.cos(ang) * r, 1000 + Math.sin(ang) * r * 0.75 + 80, 9, k % 2 ? -1 : 1, e); });
    const L = RT.titulo, e1 = eback((f - 6) / 8), e2 = eback((f - 10) / 8);
    if (f >= 6) { x.save(); x.translate(W / 2, 940); x.scale(e1, e1); brawl(L[0], 0, 0, cabe(L[0], 170, 980), cores, -0.05); x.restore(); }
    if (L[1] && f >= 10) { x.save(); x.translate(W / 2, 1120); x.scale(e2, e2); brawl(L[1], 0, 0, cabe(L[1], 170, 980), cores, -0.05); x.restore(); }
    if (RT.sub && f >= 16) { x.globalAlpha = eo((f - 16) / 8); pilula(RT.sub, W / 2, 1300, 40, BR); x.globalAlpha = 1; }
    pilula('DUEL LEGENDS ARENA', W / 2, 196, 30, AM);
    if (f < 5) { x.fillStyle = `rgba(255,255,255,${1 - f / 5})`; x.fillRect(-50, -50, W + 100, H + 100); }
    x.restore();
    if (f === 6) ev.push({ f: F, t: 'impacto' });
    if (f >= 42) { const k = eo((f - 42) / 6); x.fillStyle = ESC; x.beginPath(); x.moveTo(-200, H); x.lineTo(-200 + (W + 600) * k, H); x.lineTo(-200 + (W + 600) * k + 400, 0); x.lineTo(-200, 0); x.closePath(); x.fill(); }
    emit();
  }

  // ===== CENAS =====
  const FWID = 1040, FX = (W - FWID) / 2, CY = 1010;
  for (let si = 0; si < RT.cenas.length; si++) {
    const sc = RT.cenas[si], n = Math.round((sc.seg || 2.6) * 30);
    tela(sc); for (let k = 0; k < 20; k++) D.step(1, 1 / 60);
    ev.push({ f: F, t: 'cena' });
    const foco = sc.foco || [240, 135, 480];
    let toqueF = -1;
    for (let f = 0; f < n; f++) {
      D.step(2, 1 / 60);
      const im = await captura();
      const p = eio((f - 6) / 26);
      const fh = lerp(FWID * 270 / 480, sc.alto || 1040, p);
      const sw = lerp(480, foco[2], p), sh = Math.min(270, sw * fh / FWID), sw2 = sh * FWID / fh;
      const cx = lerp(240, foco[0], p), cy2 = lerp(135, foco[1], p);
      const sx = cl(cx - sw2 / 2, 0, 480 - sw2), sy = cl(cy2 - sh / 2, 0, 270 - sh);
      fundo(cor, 0.2 + F * 0.004, CY);
      // fundo desfocado da própria tela
      x.save(); x.filter = 'blur(26px) brightness(0.4)'; x.drawImage(im, 0, 0, im.width, im.height, -700, 300, W + 1400, 1400); x.restore();
      const top = CY - fh / 2, ent = eo(f / 8);
      x.save(); x.translate(W / 2, CY); x.scale(0.9 + 0.1 * ent, 0.9 + 0.1 * ent); x.globalAlpha = ent; x.translate(-W / 2, -CY);
      x.shadowColor = 'rgba(0,0,0,0.7)'; x.shadowBlur = 60; x.shadowOffsetY = 24; x.fillStyle = ESC; x.beginPath(); x.roundRect(FX - 14, top - 14, FWID + 28, fh + 28, 44); x.fill(); x.shadowColor = 'transparent';
      x.save(); x.beginPath(); x.roundRect(FX, top, FWID, fh, 32); x.clip(); x.imageSmoothingEnabled = false; x.drawImage(im, sx * K, sy * K, sw2 * K, sh * K, FX, top, FWID, fh); x.restore();
      x.lineWidth = 5; x.strokeStyle = 'rgba(255,255,255,0.22)'; x.beginPath(); x.roundRect(FX, top, FWID, fh, 32); x.stroke();
      x.restore();
      // toque
      if (sc.toque) {
        const tx = FX + (sc.toque[0] - sx) / sw2 * FWID, ty = top + (sc.toque[1] - sy) / sh * fh;
        const t0 = 34, a = f - t0;
        if (a >= -10 && a < 30) {
          const vem = eo((a + 10) / 10), press = a >= 0 && a < 6 ? Math.sin(a / 6 * Math.PI) : 0;
          if (a === 0) toqueF = F;
          if (a >= 0) { const r = eo(a / 14) * 110; x.strokeStyle = `rgba(255,255,255,${0.8 * (1 - a / 14)})`; x.lineWidth = 8; x.beginPath(); x.arc(tx, ty, r, 0, 7); x.stroke(); }
          x.globalAlpha = a > 22 ? 1 - (a - 22) / 8 : 1; mao(tx + (1 - vem) * 260, ty + (1 - vem) * 300, 9, press); x.globalAlpha = 1;
        }
      }
      // legenda da cena
      if (sc.legenda) { const e = eback((f - 3) / 8), al = f > n - 6 ? 1 - (f - n + 6) / 6 : 1; if (f >= 3) { x.save(); x.globalAlpha = al; x.translate(W / 2, top - 120); x.scale(e, e); brawl(sc.legenda, 0, 0, cabe(sc.legenda, 104, 980), cores, -0.04); x.restore(); } }
      if (sc.detalhe && f >= 12) { x.globalAlpha = eo((f - 12) / 8); pilula(sc.detalhe, W / 2, top + fh + 80, 38, BR); x.globalAlpha = 1; }
      pilula('DUEL LEGENDS ARENA', W / 2, 196, 30, AM);
      // corte: chicote horizontal
      if (f >= n - 5 && si < RT.cenas.length - 1) { const k = eo((f - n + 5) / 5); x.fillStyle = ESC; x.fillRect(W - W * k, 0, W * k, H); }
      im.close();
      emit();
    }
    if (toqueF >= 0) ev.push({ f: toqueF, t: 'toque' });
  }

  // ===== FINAL (2,8 s) — último quadro = capa =====
  ev.push({ f: F, t: 'card' });
  D.state = 'title'; D.step(1, 1 / 60);
  const ctx = D.ctx; ctx.setTransform(K, 0, 0, K, 0, 0); ctx.clearRect(0, 0, 480, 270); D.logo(240, 60, 2);
  const logoBm = await createImageBitmap(cv);
  const lb = (() => { const t = document.createElement('canvas'); t.width = cv.width; t.height = cv.height; const g = t.getContext('2d'); g.drawImage(logoBm, 0, 0); const d = g.getImageData(0, 0, t.width, t.height).data; let x0 = t.width, y0 = t.height, x1 = 0, y1 = 0; for (let yy = 0; yy < t.height; yy += 2) for (let xx = 0; xx < t.width; xx += 2) if (d[(yy * t.width + xx) * 4 + 3] > 10) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (yy < y0) y0 = yy; if (yy > y1) y1 = yy; } return { x0, y0, w: x1 - x0 + 2, h: y1 - y0 + 2 }; })();
  for (let f = 0; f < 84; f++) {
    fundo(cor, 0.3 + f * 0.004, 980);
    const e = eback(f / 10), lw = 960 * e, lh = lb.h * lw / lb.w;
    x.save(); x.imageSmoothingEnabled = false; x.globalAlpha = cl(f / 4, 0, 1); x.drawImage(logoBm, lb.x0, lb.y0, lb.w, lb.h, (W - lw) / 2, 470 + (1 - e) * 60, lw, lh); x.restore();
    ids.slice(0, 3).forEach((id, k) => { const es = eo((f - 6 - k * 2) / 10); spr(sprImg(id), W / 2 + (k - 1) * 300, 1210 + (1 - es) * 80, 13, k === 2 ? -1 : 1, es); });
    const fim = RT.fim || '110 LENDAS SORTEADAS';
    if (f >= 10) brawl(fim, W / 2, 1320, cabe(fim, 76, 940), cores, -0.03);
    if (f >= 14) { const pul = 1 + 0.03 * Math.sin(f / 4); x.save(); x.globalAlpha = eo((f - 14) / 10); x.translate(W / 2, 1460); x.scale(pul, pul); pilula('▶ JOGUE GRÁTIS · LINK NA BIO', 0, 0, 40, AM); x.restore(); }
    emit();
  }
  window.__OUT = out;
  return { total: out.length, ev };
}, { RT, fontes });

console.log(`Montando ${res.total} quadros (${(res.total / 30).toFixed(1)} s)...`);
const ff = spawn(ffmpegPath, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'mjpeg', '-i', '-',
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart', saida + '.mudo.mp4']);
let ffErro = ''; ff.stderr.on('data', d => ffErro += d);
const fim = new Promise(r => ff.on('close', r));
for (let i = 0; i < res.total; i += 20) {
  const lote = await pagina.evaluate(([a, b]) => window.__OUT.slice(a, b), [i, i + 20]);
  for (const d of lote) if (!ff.stdin.write(Buffer.from(d.split(',')[1], 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
}
ff.stdin.end();
const cod = await fim;
await navegador.close();
if (cod !== 0) { console.error('ffmpeg falhou:\n' + ffErro); process.exit(1); }
fs.writeFileSync(saida + '.json', JSON.stringify({ fps: 30, total: res.total, ev: res.ev }));
if (erros.length) console.log('Erros no jogo:', erros.slice(0, 3));
console.log('Pronto (sem som):', saida + '.mudo.mp4');
