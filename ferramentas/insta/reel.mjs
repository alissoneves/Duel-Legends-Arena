// Reel "Lenda do Dia" (versão pro): 1080x1920, 30 fps, com eventos para o som (reel.json ao lado do vídeo).
//
// node reel.mjs <lenda> <rival> --n 7 --raridade Raro --golpes "A|B|C" --card ../../insta/lenda_007.jpg
//               [--seed S] [--arena N] --saida ../../insta/lenda_007.mp4
// A lenda sempre vence (se perder na semente, sai com código 2: tente outra --seed).
// Depois: python3 som_pro.py <video.mp4> <seed>  (música + efeitos sincronizados pelos eventos)
//
// Roteiro: gancho (nome da lenda batendo na tela) -> luta em tela cheia 4:5 com fundo desfocado,
// HUD de jogo de luta, zoom e tremor a cada golpe, combo -> K.O. congelado -> VITÓRIA -> card (capa).
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
const [lendaA, lendaB] = pos;
const modo = opt.modo || 'lenda';
if (!lendaA || !lendaB || !opt.saida || (modo === 'lenda' && !opt.card)) { console.error('Uso: node reel.mjs <lenda> <rival> --n N --raridade R --golpes "a|b|c" --card card.jpg --saida arq.mp4'); process.exit(1); }
const seed = opt.seed != null ? +opt.seed : 1;
const saida = path.resolve(opt.saida);
const fontes = Object.fromEntries(['Boldonse-Regular', 'BricolageGrotesque-Bold', 'LilitaOne-Regular'].map(f => [f, 'data:font/ttf;base64,' + fs.readFileSync(path.join(aqui, 'fontes', f + '.ttf')).toString('base64')]));

let navegador;
for (const channel of ['msedge', 'chrome', undefined]) { try { navegador = await chromium.launch(channel ? { channel } : {}); break; } catch {} }
if (!navegador) { console.error('Nenhum navegador encontrado.'); process.exit(1); }
// dpr 1.5: o jogo desenha em K=6 (2880x1620), nítido mesmo com o zoom do vídeo
const pagina = await navegador.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1.5, locale: 'pt-BR' });
const erros = []; pagina.on('pageerror', e => erros.push(e.message));
await pagina.addInitScript(({ seed }) => {
  try { localStorage.setItem('dla_proto', JSON.stringify({ nick: 'Video', accAsked: true, tutAsked: true, tutDone: true, howto: true, games: 50, wins: 25, opt: { sfx: 0, music: 0, diff: 1, tips: false, lang: 'pt' } })); } catch {}
  let a = seed >>> 0;
  Math.random = function () { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  window.__gravar = true;
}, { seed });
await pagina.goto(pathToFileURL(path.join(raiz, 'index.html')).href);
await pagina.waitForFunction(() => window.__dla && document.fonts && document.fonts.status === 'loaded', null, { timeout: 30000 });
await pagina.waitForTimeout(800);

// ---------- 1. captura ----------
const info = await pagina.evaluate(async ({ a, b, arena, modo }) => {
  window.__frozen = true;
  const D = window.__dla, cv = document.getElementById('c');
  const r = D.gravar(a, b, arena == null ? null : +arena);
  if (modo === 'lenda') { D.G.p.aiDiff = 1.3; D.G.b.aiDiff = 0.75; }
  const lenda = f => ({ nome: f.def.name, el: f.def.el, corEl: D.ELCOL[f.def.el] || '#c9cbe6', corRar: (D.RAR[f.def.rar] || {}).col || '#c9cbe6', spr: D.SPR[f.def.id].img.toDataURL(), hpMax: f.maxHp || f.hpMax || 1000 });
  const A = lenda(D.G.p), B = lenda(D.G.b);
  const MAX = 60 * 9, DEPOIS = 100, LIMITE = 60 * 150, quadros = [];
  let ko = -1, i = 0;
  for (; i < LIMITE; i++) {
    D.step(1, 1 / 60);
    const g = D.G, p = g.p, f = g.b, cam = g.cam;
    const blob = await new Promise(res => cv.toBlob(res, 'image/jpeg', 0.92));
    quadros.push({ blob, px: p.x - cam.x, py: p.y - cam.y, fx: f.x - cam.x, fy: f.y - cam.y, hpA: Math.max(0, p.hp), hpB: Math.max(0, f.hp) });
    if (ko < 0 && g.over) ko = quadros.length - 1;
    if (ko < 0 && quadros.length > MAX) quadros.shift();
    if (ko >= 0 && quadros.length - 1 - ko >= DEPOIS) break;
  }
  if (ko < 0) return { erro: 'Sem nocaute em 150 s.' };
  const venceu = D.G.winner === D.G.p ? 'A' : 'B';
  A.hpMax = Math.max(A.hpMax, ...quadros.map(q => q.hpA)); B.hpMax = Math.max(B.hpMax, ...quadros.map(q => q.hpB));
  const ctx = D.ctx; ctx.setTransform(cv.width / 480, 0, 0, cv.width / 480, 0, 0); ctx.clearRect(0, 0, 480, 270); D.logo(240, 60, 2);
  const logo = cv.toDataURL('image/png');
  window.__V = { quadros, ko, venceu, A, B, arena: r.arena, K: cv.width / 480, logo };
  return { ko, venceu, A: A.nome, B: B.nome, arena: r.arena, s: Math.round(i / 60) };
}, { a: lendaA, b: lendaB, arena: opt.arena, modo });
if (info.erro) { console.error(info.erro); await navegador.close(); process.exit(1); }
console.log(`${info.A} x ${info.B} em ${info.arena}: K.O. aos ${info.s}s, vence ${info.venceu === 'A' ? info.A : info.B}`);
if (modo === 'lenda' && info.venceu !== 'A') { console.error(`${info.A} perdeu nesta semente.`); await navegador.close(); process.exit(2); }

// ---------- 2. montagem ----------
const R = { modo, n: opt.n || '', rar: opt.raridade || '', titulo: opt.titulo || 'QUEM VENCE?', golpes: (opt.golpes || '').split('|').filter(Boolean), golpesB: (opt.golpesB || '').split('|').filter(Boolean), card: opt.card ? 'data:image/jpeg;base64,' + fs.readFileSync(path.resolve(opt.card)).toString('base64') : null, fontes };
const res = await pagina.evaluate(async (R) => {
  for (const [nome, url] of Object.entries(R.fontes)) { const ff = new FontFace(nome, `url(${url})`); await ff.load(); document.fonts.add(ff); }
  const V = window.__V, W = 1080, H = 1920;
  const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  const LIL = '"LilitaOne-Regular"', BIG = '"Boldonse-Regular"', SANS = '"BricolageGrotesque-Bold"', PX = '"Press Start 2P", monospace';
  const AM = '#ffd23f', ESC = '#07080f', BR = '#ffffff';
  const load = s => new Promise(r => { const im = new Image(); im.onload = () => r(im); im.src = s; });
  const sprA = await load(V.A.spr), sprB = await load(V.B.spr), card = R.card ? await load(R.card) : null, logo = await load(V.logo);
  const VA = V.venceu === 'A', vencL = VA ? V.A : V.B, vencS = VA ? sprA : sprB;
  let cacheI = -1, cacheB = null;
  const quadro = async i => { i = Math.max(0, Math.min(V.quadros.length - 1, i | 0)); if (i !== cacheI) { cacheB && cacheB.close(); cacheB = await createImageBitmap(V.quadros[i].blob); cacheI = i; } return cacheB; };
  const cl = (v, a, b) => Math.max(a, Math.min(b, v));
  const eo = t => 1 - Math.pow(1 - cl(t, 0, 1), 3);
  const eback = t => { t = cl(t, 0, 1); const s = 1.9; return 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2); };
  let rs = 12345; const rnd = () => (rs = (rs * 16807) % 2147483647) / 2147483647;
  const ev = []; let F = 0; const out = [];
  const emit = () => { vinheta(); out.push(c.toDataURL('image/jpeg', 0.93)); F++; };
  const vinheta = () => { const g = x.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.55)'); x.fillStyle = g; x.fillRect(0, 0, W, H); };
  const texto = (s, X, Y, tam, cor, fonte = BIG, al = 'center', borda = 0, bordaCor = ESC, sombra = 0) => {
    x.font = `${tam}px ${fonte}`; x.textAlign = al; x.textBaseline = 'middle'; x.lineJoin = 'round';
    if (sombra) { x.fillStyle = 'rgba(0,0,0,0.6)'; x.fillText(s, X + sombra, Y + sombra); }
    if (borda) { x.strokeStyle = bordaCor; x.lineWidth = borda; x.strokeText(s, X, Y); }
    x.fillStyle = cor; x.fillText(s, X, Y);
  };
  const cabe = (s, tam, max, fonte = BIG) => { x.font = `${tam}px ${fonte}`; const w = x.measureText(s).width; return w > max ? Math.floor(tam * max / w) : tam; };
  const curto = s => String(s).split(',')[0];
  const spr = (im, cx, base, esc, vira = 1, alpha = 1) => { x.save(); x.globalAlpha = alpha; x.imageSmoothingEnabled = false; x.translate(cx, base); x.scale(vira, 1); x.drawImage(im, -im.width * esc / 2, -im.height * esc, im.width * esc, im.height * esc); x.restore(); };
  const raios = (cx, cy, cor, rot, n = 18, alpha = 0.18) => { x.save(); x.translate(cx, cy); x.rotate(rot); x.fillStyle = cor; x.globalAlpha = alpha; for (let k = 0; k < n; k++) { x.rotate(Math.PI * 2 / n); x.beginPath(); x.moveTo(0, 0); x.lineTo(2400, -150); x.lineTo(2400, 150); x.closePath(); x.fill(); } x.restore(); };
  const fundoCor = (cor, rot) => { x.fillStyle = ESC; x.fillRect(0, 0, W, H); const g = x.createRadialGradient(W / 2, 820, 50, W / 2, 820, 1100); g.addColorStop(0, cor); g.addColorStop(1, ESC); x.globalAlpha = 0.55; x.fillStyle = g; x.fillRect(0, 0, W, H); x.globalAlpha = 1; raios(W / 2, 820, cor, rot); };
  const pilula = (s, X, Y, tam, bg, fg = ESC, fonte = SANS) => { x.font = `${tam}px ${fonte}`; const w = x.measureText(s).width + tam * 1.1, h = tam * 1.6; x.fillStyle = bg; x.beginPath(); x.roundRect(X - w / 2, Y - h / 2, w, h, h / 2); x.fill(); texto(s, X, Y + 2, tam, fg, fonte); return w; };

  // texto no estilo jogo mobile: Lilita One, extrusão 3D, contorno grosso, degradê e brilho
  const GRAD = { ouro: ['#ffffff', '#fff3a6', '#ffd23f', '#ff9a1f'], fogo: ['#fff1e0', '#ffb36b', '#ff6a2b', '#e0262b'], gelo: ['#ffffff', '#d8f6ff', '#7fd8ff', '#2f8cff'], verde: ['#ffffff', '#dcffd0', '#7ce86a', '#23a84a'] };
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
  // ---- câmera 4:5 sobre o jogo ----
  const FX = 0, FY = 470, FW = 1080, FH = 1350, ASP = FH / FW;
  let cam = null, punch = 0, shake = 0;
  const enquadrar = (q, zoom = 1, foco = null, k = 0.12) => {
    let mx, my, w;
    if (foco) { mx = foco[0]; my = foco[1] - 14; w = 120; }
    else {
      const dx = Math.abs(q.px - q.fx), dy = Math.abs(q.py - q.fy);
      w = Math.max(dx * 1.35 + 70, (dy * 1.35 + 90) / ASP, 112);
      if (w > 190) { w = 190; mx = q.px + (q.fx - q.px) * 0.25; my = q.py + (q.fy - q.py) * 0.25 - 10; } // longe: segue a lenda
      else { mx = (q.px + q.fx) / 2; my = (q.py + q.fy) / 2 - 10; }
    }
    w = Math.min(190, w * zoom);
    if (!cam) cam = { x: mx, y: my, w };
    cam.x += (mx - cam.x) * k; cam.y += (my - cam.y) * k; cam.w += (w - cam.w) * k;
  };
  const desenharJogo = async (i, extra = {}) => {
    const im = await quadro(i);
    const w = cam.w * (1 - punch * 0.08), h = w * ASP;
    const sx = cl(cam.x - w / 2, 0, 480 - w), sy = cl(cam.y - h / 2, 0, 270 - h);
    const ox = shake ? (rnd() - 0.5) * shake : 0, oy = shake ? (rnd() - 0.5) * shake : 0;
    // fundo: o mesmo quadro, ampliado, desfocado e escuro
    x.save(); x.filter = 'blur(28px) brightness(0.45) saturate(1.3)'; x.drawImage(im, 0, 0, im.width, im.height, -900, -200, W + 1800, H + 400); x.restore();
    // janela principal
    x.save(); x.beginPath(); x.roundRect(FX + 24 + ox, FY + oy, FW - 48, FH, 36); x.clip();
    x.imageSmoothingEnabled = false; x.drawImage(im, sx * V.K, sy * V.K, w * V.K, h * V.K, FX + ox - 40, FY + oy - 50, FW + 80, FH + 100);
    if (extra.flash) { x.fillStyle = `rgba(255,255,255,${extra.flash})`; x.fillRect(0, FY, W, FH); }
    if (extra.escurece) { x.fillStyle = `rgba(7,8,15,${extra.escurece})`; x.fillRect(0, FY, W, FH); }
    x.restore();
    x.lineWidth = 4; x.strokeStyle = 'rgba(255,255,255,0.18)'; x.beginPath(); x.roundRect(FX + 24 + ox, FY + oy, FW - 48, FH, 36); x.stroke();
  };
  // ---- HUD de jogo de luta ----
  const vis = { a: 1, b: 1, ca: 1, cb: 1 };
  const hud = (q, alpha = 1) => {
    x.save(); x.globalAlpha = alpha;
    const pa = q.hpA / V.A.hpMax, pb = q.hpB / V.B.hpMax;
    vis.a += (pa - vis.a) * 0.5; vis.b += (pb - vis.b) * 0.5;
    vis.ca = vis.ca > vis.a ? vis.ca - 0.012 : vis.a; vis.cb = vis.cb > vis.b ? vis.cb - 0.012 : vis.b;
    const Y = 330, BW = 400, BH = 34;
    for (const [lado, L, im, v, cv] of [[0, V.A, sprA, vis.a, vis.ca], [1, V.B, sprB, vis.b, vis.cb]]) {
      const esq = lado === 0, bx = esq ? 80 : W - 80 - BW;
      // retrato
      const rx = esq ? 30 : W - 130; x.fillStyle = 'rgba(7,8,15,0.85)'; x.beginPath(); x.roundRect(rx, Y - 92, 100, 100, 20); x.fill();
      x.strokeStyle = L.corEl; x.lineWidth = 4; x.stroke(); spr(im, rx + 50, Y + 2, 3.4, esq ? 1 : -1);
      texto(curto(L.nome).toUpperCase(), esq ? 148 : W - 148, Y - 58, cabe(curto(L.nome).toUpperCase(), 34, 320, SANS), BR, SANS, esq ? 'left' : 'right', 6);
      // barra inclinada
      x.save(); x.translate(bx + (esq ? 60 : 0), Y); x.transform(1, 0, esq ? -0.35 : 0.35, 1, 0, 0);
      const ww = BW - 60; x.fillStyle = 'rgba(7,8,15,0.9)'; x.fillRect(-6, -6, ww + 12, BH + 12);
      x.fillStyle = '#2a2e4a'; x.fillRect(0, 0, ww, BH);
      const cw = ww * cl(cv, 0, 1), vw = ww * cl(v, 0, 1);
      x.fillStyle = '#ffffff'; x.fillRect(esq ? 0 : ww - cw, 0, cw, BH);
      const g = x.createLinearGradient(0, 0, 0, BH); const col = v > 0.5 ? ['#7dff8f', '#22b14c'] : v > 0.25 ? ['#ffd25a', '#e08a00'] : ['#ff7a7a', '#d3202a']; g.addColorStop(0, col[0]); g.addColorStop(1, col[1]);
      x.fillStyle = g; x.fillRect(esq ? 0 : ww - vw, 0, vw, BH);
      x.fillStyle = 'rgba(255,255,255,0.35)'; x.fillRect(esq ? 0 : ww - vw, 3, vw, 5);
      x.restore();
    }
    // emblema central
    x.fillStyle = ESC; x.beginPath(); x.arc(W / 2, Y + 16, 46, 0, 7); x.fill(); x.strokeStyle = AM; x.lineWidth = 5; x.stroke();
    texto('VS', W / 2, Y + 20, 34, AM, BIG);
    x.restore();
  };
  const faixaTopo = (alpha = 1) => { x.save(); x.globalAlpha = alpha; pilula(R.modo === 'lenda' ? `LENDA DO DIA #${R.n}` : R.titulo, W / 2, 196, 30, AM, ESC, SANS); x.restore(); };

  const ko = V.ko, n = V.quadros.length, ini = Math.max(0, ko - 60 * 7);

  // ===== 1) GANCHO (1,5 s) =====
  ev.push({ f: 0, t: 'inicio' });
  for (let f = 0; f < 45; f++) {
    const t = f / 45;
    shake = R.modo === 'confronto' ? (f >= 12 && f < 20 ? (20 - f) * 3 : 0) : (f >= 6 && f < 14 ? (14 - f) * 3 : 0);
    const ox = shake ? (rnd() - 0.5) * shake : 0, oy = shake ? (rnd() - 0.5) * shake : 0;
    x.save(); x.translate(ox, oy);
    if (R.modo === 'confronto') {
      // fundo dividido na diagonal com a cor de cada lenda
      x.fillStyle = ESC; x.fillRect(0, 0, W, H);
      const sl = eo(f / 6) * 0.5;
      x.save(); x.globalAlpha = sl; x.fillStyle = V.A.corEl; x.beginPath(); x.moveTo(0, 0); x.lineTo(W, 0); x.lineTo(0, H); x.fill(); x.fillStyle = V.B.corEl; x.beginPath(); x.moveTo(W, 0); x.lineTo(W, H); x.lineTo(0, H); x.fill(); x.restore();
      raios(W / 2, 960, '#ffffff', f * 0.01, 16, 0.07);
      x.save(); x.globalAlpha = 0.3; x.strokeStyle = BR; x.lineWidth = 3; for (let k = 0; k < 14; k++) { const xx = (k * 157 + f * 70) % W, yy = (k * 271) % H; x.beginPath(); x.moveTo(xx, yy); x.lineTo(xx + 180, yy); x.stroke(); } x.restore();
      const ea = eback(f / 8), eb = eback((f - 4) / 8);
      spr(sprA, -300 + ea * 570, 860, 14, 1); spr(sprB, W + 300 - eb * 570, 1420, 14, -1);
      const nA = curto(V.A.nome).toUpperCase(), nB = curto(V.B.nome).toUpperCase();
      if (f >= 6) brawl(nA, 290 + (1 - eo((f - 6) / 6)) * -500, 950, cabe(nA, 74, 560, LIL), GRAD.ouro, -0.05);
      if (f >= 10) brawl(nB, W - 290 + (1 - eo((f - 10) / 6)) * 500, 1510, cabe(nB, 74, 560, LIL), GRAD.gelo, -0.05);
      if (f >= 12) { const e = eback((f - 12) / 7); x.save(); x.translate(W / 2, 1190); x.scale(e * 1.0, e * 1.0); brawl('VS', 0, 0, 230, GRAD.fogo, -0.08); x.restore(); }
      if (f === 12) ev.push({ f: F, t: 'impacto' });
    } else {
    fundoCor(V.A.corEl, f * 0.01);
      // linhas de velocidade
      x.save(); x.globalAlpha = 0.35; x.strokeStyle = BR; x.lineWidth = 3; for (let k = 0; k < 14; k++) { const yy = (k * 137 + f * 60) % H; const xx = (k * 311) % W; x.beginPath(); x.moveTo(xx, yy); x.lineTo(xx, yy + 160 + (k % 3) * 80); x.stroke(); } x.restore();
      // sprite gigante batendo
      const s = f < 6 ? 3 - 2 * eo(f / 6) : 1 + 0.02 * Math.sin(f / 3);
      spr(sprA, W / 2, 1210, 26 * s, 1);
      x.fillStyle = 'rgba(0,0,0,0.35)'; x.beginPath(); x.ellipse(W / 2, 1215, 260, 40, 0, 0, 7); x.fill();
      // nome
      const nm = curto(V.A.nome).toUpperCase(), tn = cabe(nm, 150, 980);
      const en = eback((f - 6) / 9);
      if (f >= 6) { x.save(); x.translate(W / 2, 1400); x.rotate(-0.05); x.scale(en, en); texto(nm, 0, 0, tn, AM, BIG, 'center', 22, ESC, 10); x.restore(); }
      // tags
      if (f >= 14) { const e2 = eo((f - 14) / 8); x.globalAlpha = e2; pilula(R.rar.toUpperCase(), W / 2 - 150, 1560 + (1 - e2) * 40, 34, V.A.corRar); pilula(V.A.el.toUpperCase(), W / 2 + 150, 1560 + (1 - e2) * 40, 34, V.A.corEl); x.globalAlpha = 1; }
    }
    faixaTopo(eo(f / 8));
    if (f < 5) { x.fillStyle = `rgba(255,255,255,${1 - f / 5})`; x.fillRect(-50, -50, W + 100, H + 100); }
    x.restore();
    if (f === 6 && R.modo !== 'confronto') ev.push({ f: F, t: 'impacto' });
    // transição: corte diagonal nos 6 últimos quadros
    if (f >= 39) { const k = eo((f - 39) / 6); x.fillStyle = ESC; x.beginPath(); x.moveTo(-200, H); x.lineTo(-200 + (W + 600) * k, H); x.lineTo(-200 + (W + 600) * k + 400, 0); x.lineTo(-200, 0); x.closePath(); x.fill(); }
    emit();
  }
  ev.push({ f: F, t: 'luta' });

  // ===== 2) LUTA =====
  const lentoIni = ko - 40;
  let golpeB = 0, i = ini, prev = V.quadros[ini], combo = 0, ultHit = -99, comboShow = 0, golpe = 0, golpeT = -99, ft = 0;
  const callout = [];
  while (i < ko) {
    const q = V.quadros[i | 0];
    // golpes (diferença de vida entre os quadros pulados)
    const dA = prev.hpA - q.hpA, dB = prev.hpB - q.hpB;
    if (dB > 0.5) { punch = 1; shake = Math.min(22, 8 + dB / 6); if (F - ultHit < 18) combo++; else combo = 1; ultHit = F; ev.push({ f: F, t: 'hit', lado: 'B', d: dB }); if (combo >= 2) comboShow = 24; if (ft - golpeT > 60 && R.golpes.length && ft > 15) { callout.push({ s: R.golpes[golpe % R.golpes.length], k: golpe % R.golpes.length, f0: F }); golpe++; golpeT = ft; ev.push({ f: F, t: 'golpe' }); } }
    if (dA > 0.5) { shake = Math.max(shake, R.modo === 'confronto' ? 14 : 8); if (R.modo === 'confronto') punch = 0.7; ev.push({ f: F, t: 'hit', lado: 'A', d: dA }); if (R.modo === 'confronto' && ft - golpeT > 60 && R.golpesB.length && ft > 15) { callout.push({ s: R.golpesB[golpeB % R.golpesB.length], k: golpeB % R.golpesB.length, f0: F, b: 1 }); golpeB++; golpeT = ft; ev.push({ f: F, t: 'golpe' }); } }
    prev = q;
    // golpe especial em destaque a cada ~2,3 s
    const lento = i >= lentoIni;
    enquadrar(q, lento ? 0.8 : 1, null, lento ? 0.2 : 0.12);
    await desenharJogo(i, { flash: punch > 0.9 ? 0.18 : 0 });
    hud(q, eo(ft / 8));
    faixaTopo();
    // combo
    if (comboShow > 0) { const e = eback((24 - comboShow) / 6); x.save(); x.translate(W - 230, 700); x.rotate(0.08); x.scale(e, e); texto(`${combo} HITS`, 0, 0, 50, '#ff5a3d', BIG, 'center', 12, ESC); x.restore(); comboShow--; }
    // chamada do golpe (no alto da janela, sem cobrir os lutadores)
    for (const co of callout) {
      const a = F - co.f0; if (a < 0 || a > 40) continue;
      const e = eback(a / 6), al = a > 33 ? 1 - (a - 33) / 7 : 1, dy = a > 33 ? -(a - 33) * 6 : 0;
      const s = co.s.toUpperCase(), tam = cabe(s, 92, 800, LIL);
      x.save(); x.globalAlpha = al; x.translate(W / 2 + 30, 600 + dy); x.rotate(-0.06); x.scale(e, e); x.transform(1, 0, -0.12, 1, 0, 0);
      x.font = `${tam}px ${LIL}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round';
      const tw = x.measureText(s).width;
      // tecla do golpe (A/B/C) na cor do card
      const kx = -tw / 2 - 70, kc = ['#e0393e', '#3d7bff', '#ffd23f'][co.k % 3];
      x.fillStyle = ESC; x.beginPath(); x.roundRect(kx - 46, -40, 92, 92, 20); x.fill();
      x.fillStyle = kc; x.beginPath(); x.roundRect(kx - 42, -48, 84, 84, 18); x.fill();
      x.fillStyle = 'rgba(255,255,255,0.35)'; x.fillRect(kx - 34, -42, 68, 10);
      x.font = `64px ${LIL}`; x.lineWidth = 10; x.strokeStyle = ESC; x.strokeText('ABC'[co.k % 3], kx, -4); x.fillStyle = '#fff'; x.fillText('ABC'[co.k % 3], kx, -4);
      // texto estilo jogo mobile: extrusão 3D, contorno grosso e degradê
      x.font = `${tam}px ${LIL}`;
      for (let d = 12; d > 0; d -= 2) { x.lineWidth = 18; x.strokeStyle = ESC; x.strokeText(s, 0, d); }
      x.lineWidth = 18; x.strokeStyle = ESC; x.strokeText(s, 0, 0);
      const g = x.createLinearGradient(0, -tam / 2, 0, tam / 2); const cc = co.b ? GRAD.gelo : GRAD.ouro; g.addColorStop(0, cc[0]); g.addColorStop(0.45, cc[1]); g.addColorStop(0.55, cc[2]); g.addColorStop(1, cc[3]);
      x.fillStyle = g; x.fillText(s, 0, 0);
      x.fillStyle = 'rgba(255,255,255,0.55)'; x.save(); x.beginPath(); x.rect(-tw / 2 - 10, -tam / 2, tw + 20, tam * 0.22); x.clip(); x.fillText(s, 0, 0); x.restore();
      x.restore();
    }
    // tempo lento: barras de cinema entrando
    if (lento) { const k = eo((i - lentoIni) / 20); x.fillStyle = ESC; x.fillRect(0, FY, W, 70 * k); x.fillRect(0, FY + FH - 70 * k, W, 70 * k); }
    punch *= 0.75; shake *= 0.72; if (shake < 1) shake = 0;
    emit(); ft++;
    i += lento ? 0.5 : 2;
  }

  // ===== 3) K.O. =====
  ev.push({ f: F, t: 'ko' });
  const qk = V.quadros[ko];
  for (let f = 0; f < 40; f++) {
    const congelado = f < 12;
    const idx = congelado ? ko : ko + (f - 12) * 0.5;
    const q = V.quadros[Math.min(n - 1, idx | 0)];
    enquadrar(q, 1, VA ? [q.fx, q.fy] : [q.px, q.py], 0.25);
    shake = f < 10 ? 30 - f * 3 : 0;
    await desenharJogo(idx, { flash: f < 3 ? 0.9 - f * 0.3 : 0, escurece: congelado ? 0 : 0.25 });
    hud(q); faixaTopo();
    x.fillStyle = ESC; x.fillRect(0, FY, W, 70); x.fillRect(0, FY + FH - 70, W, 70);
    if (f >= 2) { raios(W / 2, 1120, '#ff3b30', f * 0.03, 14, 0.22); const e = eback((f - 2) / 8); x.save(); x.translate(W / 2, 1120); x.rotate(-0.08); x.scale(e, e); texto('K.O.', 0, 0, 260, '#ff3b30', BIG, 'center', 30, ESC, 14); x.restore(); }
    emit();
  }

  // ===== 4) VITÓRIA (1,4 s) =====
  ev.push({ f: F, t: 'vitoria' });
  const qf = V.quadros[n - 1];
  for (let f = 0; f < 42; f++) {
    enquadrar(qf, 1, VA ? [qf.px, qf.py] : [qf.fx, qf.fy], 0.2); shake = 0;
    await desenharJogo(n - 1, { escurece: 0.55 * eo(f / 8) });
    hud(qf, 1 - eo(f / 10)); faixaTopo();
    raios(W / 2, 1100, AM, f * 0.02, 16, 0.16 * eo(f / 6));
    const e = eo(f / 8); spr(vencS, W / 2, 1300 + (1 - e) * 200, 20 + Math.sin(f / 4) * 0.4, 1, e);
    const ev2 = eback((f - 4) / 8); if (f >= 4) { x.save(); x.translate(W / 2, 760); x.scale(ev2, ev2); texto('VITÓRIA!', 0, 0, 130, AM, BIG, 'center', 22, ESC, 10); x.restore(); }
    if (f >= 10) { x.globalAlpha = eo((f - 10) / 8); brawl(curto(vencL.nome).toUpperCase() + ' VENCE!', W / 2, 1430, cabe(curto(vencL.nome).toUpperCase() + ' VENCE!', 80, 900, LIL), GRAD.ouro, -0.04); x.globalAlpha = 1; }
    // transição para o card
    if (f >= 36) { const k = eo((f - 36) / 6); x.fillStyle = ESC; x.fillRect(0, 0, W, H * k); }
    emit();
  }

  // ===== 5) CARD (2,8 s) — último quadro = capa =====
  ev.push({ f: F, t: 'card' });
  if (!card) {
    // final com o logo (capa): sprites das duas lendas + chamada
    const lb = await (async () => { const t = document.createElement('canvas'); t.width = logo.width; t.height = logo.height; const g = t.getContext('2d'); g.drawImage(logo, 0, 0); const d = g.getImageData(0, 0, t.width, t.height).data; let x0 = t.width, y0 = t.height, x1 = 0, y1 = 0; for (let yy = 0; yy < t.height; yy++) for (let xx = 0; xx < t.width; xx++) if (d[(yy * t.width + xx) * 4 + 3] > 10) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (yy < y0) y0 = yy; if (yy > y1) y1 = yy; } return { x0, y0, w: x1 - x0 + 1, h: y1 - y0 + 1 }; })();
    for (let f = 0; f < 84; f++) {
      fundoCor(vencL.corEl, 0.3 + f * 0.004);
      const e = eback(f / 10), lw = 940 * e, lh = lb.h * lw / lb.w;
      x.save(); x.imageSmoothingEnabled = false; x.globalAlpha = cl(f / 4, 0, 1); x.drawImage(logo, lb.x0, lb.y0, lb.w, lb.h, (W - lw) / 2, 470 + (1 - e) * 60, lw, lh); x.restore();
      const es = eo((f - 6) / 10); spr(sprA, W / 2 - 230, 1180 + (1 - es) * 80, 15, 1, es); spr(sprB, W / 2 + 230, 1180 + (1 - es) * 80, 15, -1, es);
      if (f >= 10) brawl('110 LENDAS SORTEADAS', W / 2, 1300, cabe('110 LENDAS SORTEADAS', 70, 920, LIL), GRAD.ouro, -0.03);
      if (f >= 14) { const pul = 1 + 0.03 * Math.sin(f / 4); x.save(); x.globalAlpha = eo((f - 14) / 10); x.translate(W / 2, 1440); x.scale(pul, pul); pilula('▶ JOGUE GRÁTIS · LINK NA BIO', 0, 0, 40, AM); x.restore(); }
      emit();
    }
  } else {
  const ch = card.height * W / card.width, cy = Math.round((H - ch) / 2) - 40;
  for (let f = 0; f < 84; f++) {
    const e = eback(f / 12);
    fundoCor(V.A.corEl, 0.3 + f * 0.004);
    x.save(); x.translate(W / 2, cy + ch / 2); x.scale(0.82 + 0.18 * e, 0.82 + 0.18 * e); x.globalAlpha = cl(f / 5, 0, 1);
    x.shadowColor = 'rgba(0,0,0,0.6)'; x.shadowBlur = 50; x.shadowOffsetY = 20;
    x.imageSmoothingEnabled = true; x.drawImage(card, -W / 2, -ch / 2, W, ch); x.shadowColor = 'transparent';
    // brilho passando
    if (f > 10 && f < 34) { const p = (f - 10) / 24; x.save(); x.beginPath(); x.rect(-W / 2, -ch / 2, W, ch); x.clip(); x.globalCompositeOperation = 'lighter'; const gx = -W + p * W * 2.2; const g = x.createLinearGradient(gx - 160, 0, gx + 160, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.transform(1, 0, -0.4, 1, 0, 0); x.fillRect(gx - 160, -ch / 2, 320 + ch, ch); x.restore(); }
    x.restore();
    const ep = eo((f - 14) / 10);
    if (f >= 14) { const pul = 1 + 0.03 * Math.sin(f / 4); x.save(); x.globalAlpha = ep; x.translate(W / 2, cy + ch + 95); x.scale(pul, pul); pilula('▶ JOGUE GRÁTIS · LINK NA BIO', 0, 0, 40, AM); x.restore(); }
    emit();
  }
  }
  window.__OUT = out;
  return { total: out.length, ev, fps: 30 };
}, R);

// ---------- 3. vídeo ----------
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
