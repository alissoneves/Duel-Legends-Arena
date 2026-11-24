// Gera vídeos verticais (1080x1920, 30 fps, sem áudio) para o Instagram a partir do próprio jogo.
//
// Confronto:  node video.mjs confronto <lendaA> <lendaB> [--arena N] [--seed S] [--saida arq.mp4]
// Lenda do Dia: some --vence-a 1 --final ../../insta/lenda_NNN.jpg (a lenda vence e o vídeo termina no card)
// Recurso:    node video.mjs recurso <lendaA> <lendaB> --titulo "DUELO 1x1" --sub "Você contra uma lenda"
//                 --frases "Esquive|Bloqueie na hora certa|Guarde o especial" [--arena N] [--seed S] [--saida arq.mp4]
// Lenda = id (c12, saci, iara...) ou nome ("Curupira"). Sem --saida, grava em tmp/.
//
// Como funciona: o jogo roda num navegador sem janela, em modo gravação (window.__gravar: câmera entre
// os lutadores, sem HUD, nome da lenda sobre cada uma). Cada quadro da luta é guardado a 60 fps até o
// nocaute; depois o vídeo é montado sabendo onde está o nocaute (câmera lenta, zoom, vitória, final).
import { chromium } from 'playwright-core';
import ffmpegPath from 'ffmpeg-static';
import { spawn } from 'node:child_process';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(aqui, '../..');

// ---------- argumentos ----------
const args = process.argv.slice(2);
const opt = {};
const pos = [];
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) opt[args[i].slice(2)] = args[i + 1], i++;
  else pos.push(args[i]);
}
const [modo, lendaA, lendaB] = pos;
if (!['confronto', 'recurso'].includes(modo) || !lendaA || !lendaB) {
  console.error('Uso: node video.mjs confronto <lendaA> <lendaB> [--arena N] [--seed S] [--saida arq.mp4]\n     node video.mjs recurso <lendaA> <lendaB> --titulo "..." --sub "..." --frases "a|b|c"');
  process.exit(1);
}
const seed = opt.seed != null ? +opt.seed : 1;
const nomeArq = s => s.toLowerCase().replace(/\s+/g, '_');
const saida = path.resolve(opt.saida || path.join(aqui, 'tmp', `${modo}_${nomeArq(lendaA)}_vs_${nomeArq(lendaB)}.mp4`));
fs.mkdirSync(path.dirname(saida), { recursive: true });

// ---------- navegador ----------
let navegador;
for (const channel of ['msedge', 'chrome', undefined]) {
  try { navegador = await chromium.launch(channel ? { channel } : {}); break; } catch {}
}
if (!navegador) { console.error('Nenhum navegador encontrado (Edge, Chrome ou Chromium do Playwright).'); process.exit(1); }
// 1920x1080 com dpr 1: o jogo desenha em K=4, cada pixel do jogo vira 4x4
const pagina = await navegador.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, locale: 'pt-BR' });
const erros = [];
pagina.on('pageerror', e => erros.push(e.message));
await pagina.addInitScript(({ seed }) => {
  try { localStorage.setItem('dla_proto', JSON.stringify({ nick: 'Video', accAsked: true, tutAsked: true, tutDone: true, howto: true, games: 50, wins: 25, opt: { sfx: 0, music: 0, diff: 1, tips: false, lang: 'pt' } })); } catch {}
  let a = seed >>> 0; // sorteio repetível: mesma semente, mesma luta
  Math.random = function () { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  window.__gravar = true;
}, { seed });
await pagina.goto(pathToFileURL(path.join(raiz, 'index.html')).href);
await pagina.waitForFunction(() => window.__dla && document.fonts && document.fonts.status === 'loaded', null, { timeout: 30000 });
await pagina.waitForTimeout(800);

// ---------- 1. captura da luta ----------
console.log('Capturando a luta...');
const info = await pagina.evaluate(async ({ a, b, arena, venceA }) => {
  window.__frozen = true;
  const D = window.__dla, cv = document.getElementById('c');
  const r = D.gravar(a, b, arena == null ? null : +arena);
  if (venceA) { D.G.p.aiDiff = 1.3; D.G.b.aiDiff = 0.75; } // Lenda do Dia: o bot da lenda joga melhor que o rival
  const G = () => D.G;
  const lenda = f => ({ id: f.def.id, nome: f.def.name, el: f.def.el, rar: f.def.rar, corEl: D.ELCOL[f.def.el] || '#c9cbe6', corRar: (D.RAR[f.def.rar] || {}).col || '#c9cbe6', spr: D.SPR[f.def.id].img.toDataURL() });
  const A = lenda(G().p), B = lenda(G().b);
  const MAX = 60 * 11, DEPOIS = 90, LIMITE = 60 * 150;
  const quadros = [];
  let ko = -1, i = 0;
  for (; i < LIMITE; i++) {
    D.step(1, 1 / 60);
    const g = G(), p = g.p, f = g.b, cam = g.cam;
    const blob = await new Promise(res => cv.toBlob(res, 'image/jpeg', 0.9));
    quadros.push({ blob, px: p.x - cam.x, py: p.y - cam.y, fx: f.x - cam.x, fy: f.y - cam.y, hpA: Math.max(0, p.hp), hpB: Math.max(0, f.hp), flash: g.flashT || 0 });
    if (ko < 0 && g.over) ko = quadros.length - 1;
    if (ko < 0 && quadros.length > MAX) quadros.shift();
    if (ko >= 0 && quadros.length - 1 - ko >= DEPOIS) break;
  }
  if (ko < 0) return { erro: 'Nenhum nocaute em 150 s de luta. Tente outra --seed.' };
  const venceu = G().winner === G().p ? 'A' : 'B';
  // logo do jogo, com fundo transparente, para o final
  const ctx = D.ctx; ctx.setTransform(cv.width / 480, 0, 0, cv.width / 480, 0, 0); ctx.clearRect(0, 0, 480, 270); D.logo(240, 60, 2);
  const logo = cv.toDataURL('image/png');
  window.__V = { quadros, ko, venceu, A, B, arena: r.arena, K: cv.width / 480, logo };
  return { ko, n: quadros.length, venceu, A: A.nome, B: B.nome, arena: r.arena, segundos: Math.round(i / 60) };
}, { a: lendaA, b: lendaB, arena: opt.arena, venceA: !!opt['vence-a'] });
if (info.erro) { console.error(info.erro); await navegador.close(); process.exit(1); }
console.log(`${info.A} x ${info.B} em ${info.arena}: nocaute aos ${info.segundos}s, vence ${info.venceu === 'A' ? info.A : info.B}`);
// --vence-a 1: a lenda A precisa vencer (Lenda do Dia); se perder, pede outra semente
if (opt['vence-a'] && info.venceu !== 'A') { console.error(`${info.A} perdeu nesta semente. Tente outra --seed.`); await navegador.close(); process.exit(2); }

// ---------- 2. montagem ----------
const roteiro = {
  modo,
  titulo: opt.titulo || '',
  sub: opt.sub || '',
  frases: (opt.frases || '').split('|').map(s => s.trim()).filter(Boolean),
  // --final arq.jpg: termina no card da lenda (1080x1350) em vez do logo; o último quadro serve de capa
  final: opt.final ? 'data:image/jpeg;base64,' + fs.readFileSync(path.resolve(opt.final)).toString('base64') : null,
};
const total = await pagina.evaluate(async (R) => {
  const V = window.__V, W = 1080, H = 1920, FPS = 30;
  const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  const PX = '"Press Start 2P", monospace', PS = '"Pixelify Sans", sans-serif';
  const COR = { fundo: '#0b0c14', painel: '#141626', borda: '#2e3358', texto: '#ffffff', sec: '#c9cbe6', apagado: '#8a8fb8', acao: '#ffd23f', escuro: '#0b0c14' };
  const carregar = src => new Promise(res => { const im = new Image(); im.onload = () => res(im); im.src = src; });
  const sprA = await carregar(V.A.spr), sprB = await carregar(V.B.spr), logo = await carregar(V.logo);
  // recorte do logo (área não transparente)
  const lb = (() => { const t = document.createElement('canvas'); t.width = logo.width; t.height = logo.height; const g = t.getContext('2d'); g.drawImage(logo, 0, 0); const d = g.getImageData(0, 0, t.width, t.height).data; let x0 = t.width, y0 = t.height, x1 = 0, y1 = 0; for (let y = 0; y < t.height; y++) for (let xx = 0; xx < t.width; xx++) if (d[(y * t.width + xx) * 4 + 3] > 10) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (y < y0) y0 = y; if (y > y1) y1 = y; } return { x0, y0, w: x1 - x0 + 1, h: y1 - y0 + 1 }; })();
  const cache = new Map();
  const quadro = async i => { i = Math.max(0, Math.min(V.quadros.length - 1, i)); if (!cache.has(i)) { cache.clear(); cache.set(i, await createImageBitmap(V.quadros[i].blob)); } return cache.get(i); };

  const ease = t => 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3);
  const txt = (s, X, Y, tam, cor, al = 'center', fonte = PX, contorno = true) => { x.font = `${tam}px ${fonte}`; x.textAlign = al; x.textBaseline = 'alphabetic'; if (contorno) { x.fillStyle = COR.escuro; const o = Math.max(2, Math.round(tam / 12)); for (const [dx, dy] of [[-o, 0], [o, 0], [0, -o], [0, o], [o, o], [-o, -o], [o, -o], [-o, o]]) x.fillText(s, X + dx, Y + dy); } x.fillStyle = cor; x.fillText(s, X, Y); };
  // nome curto ("Nerojor, The Knight" -> "Nerojor") e tamanho que cabe na largura
  const curto = s => String(s).split(',')[0].toUpperCase();
  const cabe = (s, tam, max, fonte = PX) => { x.font = `${tam}px ${fonte}`; const w = x.measureText(s).width; return w > max ? Math.floor(tam * max / w) : tam; };
  const caixaTexto = (s, X, Y, tam, fonte = PS) => { x.font = `${tam}px ${fonte}`; return x.measureText(s).width; };
  const spr = (im, cx, base, esc, vira = 1) => { x.save(); x.imageSmoothingEnabled = false; x.translate(Math.round(cx), Math.round(base)); x.scale(vira, 1); x.drawImage(im, Math.round(-im.width * esc / 2), -im.height * esc, im.width * esc, im.height * esc); x.restore(); };
  const tag = (s, X, Y, cor, tam = 30) => { x.font = `${tam}px ${PS}`; const w = x.measureText(s).width + 24; x.fillStyle = cor; x.fillRect(X, Y, w, tam + 12); x.fillStyle = COR.escuro; x.textAlign = 'left'; x.fillText(s, X + 12, Y + tam + 2); return w; };
  const corVida = p => p > 0.5 ? '#46d160' : p > 0.25 ? '#ffb02e' : '#ff4d4d';
  const dado = (X, Y, s) => { x.fillStyle = COR.escuro; x.fillRect(X - s, Y - s, 12 * s, 12 * s); x.fillStyle = '#fff'; x.fillRect(X, Y, 10 * s, 10 * s); x.fillStyle = '#e0393e'; x.fillRect(X + s, Y + s, 3 * s, 3 * s); x.fillStyle = COR.escuro; for (const [a, b, w] of [[6, 1, 3], [4, 4, 2], [1, 6, 3], [6, 6, 3]]) x.fillRect(X + a * s, Y + b * s, w * s, w * s); };

  // janela do jogo
  // área segura do Reels: o Instagram cobre ~200 px no topo e ~360 px embaixo
  const JY = 420, JH = H - 420, ASP = JH / W; // a luta vai até o fim da tela; a frase fica sobre ela, na área segura
  let cam = null;
  const janela = async (i, zoomExtra = 1, rapido = false, noPerdedor = false) => {
    const q = V.quadros[Math.max(0, Math.min(V.quadros.length - 1, i))];
    const pd = V.venceu === 'A' ? [q.fx, q.fy] : [q.px, q.py];
    const mx = noPerdedor ? pd[0] : (q.px + q.fx) / 2, my = (noPerdedor ? pd[1] - 30 : (q.py + q.fy) / 2 - 10);
    const dx = Math.abs(q.px - q.fx), dy = Math.abs(q.py - q.fy);
    let cw = Math.max(dx * 1.25 + 70, (dy * 1.3 + 90) / ASP); cw = Math.max(96, Math.min(270 / ASP, cw)) * zoomExtra;
    if (!cam) cam = { x: mx, y: my, w: cw };
    const k = rapido ? 0.25 : 0.1; cam.x += (mx - cam.x) * k; cam.y += (my - cam.y) * k; cam.w += (cw - cam.w) * k;
    const w = cam.w, h = w * ASP;
    const sx = Math.max(0, Math.min(480 - w, cam.x - w / 2)), sy = Math.max(0, Math.min(270 - h, cam.y - h / 2));
    const im = await quadro(i);
    x.imageSmoothingEnabled = false;
    x.drawImage(im, sx * V.K, sy * V.K, w * V.K, h * V.K, 0, JY, W, JH);
    x.fillStyle = 'rgba(255,255,255,0.08)'; x.fillRect(0, JY, W, 2); x.fillRect(0, JY + JH - 2, W, 2);
    return q;
  };
  const placar = q => {
    x.fillStyle = COR.fundo; x.fillRect(0, 0, W, JY);
    const Y0 = 190;
    for (const [L, hp, lado] of [[V.A, q.hpA, 0], [V.B, q.hpB, 1]]) {
      const esq = lado === 0, im = esq ? sprA : sprB;
      const bx = esq ? 40 : W - 40 - 130;
      x.fillStyle = COR.painel; x.fillRect(bx, Y0, 130, 150); spr(im, bx + 65, Y0 + 135, 6, esq ? 1 : -1);
      const tx = esq ? 196 : W - 196, al = esq ? 'left' : 'right';
      { const nm = curto(L.nome); txt(nm, tx, Y0 + 46, cabe(nm, 34, W / 2 - 50 - 196), COR.texto, al); }
      x.font = `28px ${PS}`; const tw = x.measureText(L.el).width + 24; tag(L.el, esq ? tx : tx - tw, Y0 + 66, L.corEl, 28);
      const bw = 300, bxx = esq ? tx : tx - bw; x.fillStyle = COR.escuro; x.fillRect(bxx - 3, Y0 + 122, bw + 6, 34); x.fillStyle = '#262a46'; x.fillRect(bxx, Y0 + 125, bw, 28);
      const pc = Math.max(0, Math.min(1, hp / 1000)), pw = Math.round(bw * pc); x.fillStyle = corVida(pc); x.fillRect(esq ? bxx : bxx + bw - pw, Y0 + 125, pw, 28);
    }
    txt('x', W / 2, Y0 + 90, 40, COR.apagado, 'center', PX, false);
    txt(V.arena, W / 2, Y0 + 225, 30, COR.apagado, 'center', PS, false);
  };
  const legenda = (s, cor = COR.texto, tam = 56, fonte = PS) => { if (!s) return; x.fillStyle = 'rgba(11,12,20,0.78)'; x.fillRect(0, 1404, W, 136); x.fillStyle = 'rgba(255,255,255,0.08)'; x.fillRect(0, 1404, W, 2); txt(s, W / 2, 1492, tam, cor, 'center', fonte); };
  const saida = [];
  const emitir = () => saida.push(c.toDataURL('image/jpeg', 0.92));

  const ko = V.ko, n = V.quadros.length;
  const ini = Math.max(0, ko - 60 * 8);
  const lentoIni = ko - 36, lentoFim = ko + 24;
  const venc = V.venceu === 'A' ? V.A : V.B, vencSpr = V.venceu === 'A' ? sprA : sprB;
  const frase = t => R.modo === 'recurso' && R.frases.length ? R.frases[Math.min(R.frases.length - 1, Math.floor(t / 2.6))] : 'Quem vence essa luta?';

  // 1) abertura (1,6 s)
  const im0 = await quadro(ini);
  for (let f = 0; f < 48; f++) {
    const t = f / 48;
    x.fillStyle = COR.fundo; x.fillRect(0, 0, W, H);
    x.globalAlpha = 0.16; x.fillStyle = V.A.corEl; x.beginPath(); x.moveTo(0, 0); x.lineTo(W, 0); x.lineTo(0, H); x.closePath(); x.fill();
    x.fillStyle = V.B.corEl; x.beginPath(); x.moveTo(W, 0); x.lineTo(W, H); x.lineTo(0, H); x.closePath(); x.fill(); x.globalAlpha = 1;
    if (R.modo === 'recurso') {
      txt(R.titulo, W / 2, 420, 84, COR.acao);
      if (R.sub) txt(R.sub, W / 2, 510, 44, COR.sec, 'center', PS);
    }
    const ea = ease(t * 3.2), eb = ease(t * 3.2 - 0.25);
    const yA = R.modo === 'recurso' ? 1160 : 760, yB = R.modo === 'recurso' ? 1160 : 1220;
    const esc = R.modo === 'recurso' ? 12 : 16;
    spr(sprA, -300 + ea * 600, yA, esc, 1); spr(sprB, W + 300 - eb * 600, yB, esc, -1);
    if (R.modo === 'confronto') {
      txt(curto(V.A.nome), 300 * ea + (1 - ea) * -300, yA + 90, cabe(curto(V.A.nome), 48, 540), COR.texto, 'center');
      txt(curto(V.B.nome), W - 300 * eb - (1 - eb) * -300, yB + 90, cabe(curto(V.B.nome), 48, 540), COR.texto, 'center');
      x.font = `34px ${PS}`; const twA = x.measureText(V.A.el).width + 24, twB = x.measureText(V.B.el).width + 24; tag(V.A.el, 300 - twA / 2, yA + 116, V.A.corEl, 34); tag(V.B.el, W - 300 - twB / 2, yB + 116, V.B.corEl, 34);
    }
    const ev = ease((t - 0.35) * 4);
    if (ev > 0) { x.save(); x.translate(W / 2, R.modo === 'recurso' ? 1010 : 1010); x.scale(2 - ev, 2 - ev); x.globalAlpha = ev; txt('VS', 0, 30, 96, '#ff8a3d'); x.restore(); x.globalAlpha = 1; }
    if (t > 0.55) { x.globalAlpha = ease((t - 0.55) * 3); txt(R.modo === 'recurso' ? frase(0) : 'Quem vence essa luta?', W / 2, 1540, 56, COR.texto, 'center', PS); x.globalAlpha = 1; }
    emitir();
  }
  // 2) luta: velocidade normal, câmera lenta perto do nocaute
  let i = ini, tLuta = 0;
  while (i < n - 1) {
    const lento = i >= lentoIni && i < lentoFim;
    const perto = i >= lentoIni - 30 && i < lentoFim + 20;
    x.fillStyle = COR.fundo; x.fillRect(0, 0, W, H);
    const q = await janela(i, perto ? 0.78 : 1, perto, i >= ko - 6);
    placar(q);
    if (i < ko) legenda(frase(tLuta));
    else legenda(`${curto(venc.nome)} VENCE`, COR.acao, cabe(`${curto(venc.nome)} VENCE`, 50, W - 80), PX);
    if (i >= ko && i < ko + 6) { x.fillStyle = `rgba(255,255,255,${0.5 * (1 - (i - ko) / 6)})`; x.fillRect(0, JY, W, JH); }
    emitir();
    i += lento ? 1 : 2; tLuta += 1 / 30;
  }
  // 3) vitória (1,4 s)
  const ult = n - 1;
  for (let f = 0; f < 42; f++) {
    const t = ease(f / 12);
    x.fillStyle = COR.fundo; x.fillRect(0, 0, W, H);
    const q = await janela(ult, 0.78, false, true);
    placar(q);
    x.fillStyle = `rgba(11,12,20,${0.6 * t})`; x.fillRect(0, JY, W, JH);
    x.globalAlpha = t; spr(vencSpr, W / 2, JY + 820, 16, 1);
    txt('VITÓRIA', W / 2, JY + 240, 110, COR.acao); x.globalAlpha = 1;
    legenda(`${curto(venc.nome)} VENCE`, COR.acao, cabe(`${curto(venc.nome)} VENCE`, 50, W - 80), PX);
    emitir();
  }
  // 4) final: card da lenda (2,6 s), pronto para virar capa
  if (R.final) {
    const card = await carregar(R.final);
    const cw = W, ch = card.height * W / card.width, cy = Math.round((H - ch) / 2);
    for (let f = 0; f < 78; f++) {
      const t = ease(f / 10);
      x.fillStyle = COR.fundo; x.fillRect(0, 0, W, H);
      x.globalAlpha = t; x.imageSmoothingEnabled = true; x.drawImage(card, 0, cy, cw, ch);
      txt('JOGUE GRÁTIS · LINK NA BIO', W / 2, cy + ch + 120, 34, COR.acao, 'center', PX, false);
      x.globalAlpha = 1;
      emitir();
    }
  } else
  for (let f = 0; f < 66; f++) {
    const t = ease(f / 12);
    x.fillStyle = COR.fundo; x.fillRect(0, 0, W, H);
    x.globalAlpha = t;
    const lw = 900, lh = lb.h * lw / lb.w; x.imageSmoothingEnabled = false; x.drawImage(logo, lb.x0, lb.y0, lb.w, lb.h, (W - lw) / 2, 440, lw, lh);
    txt('110 lendas, sorteadas', W / 2, 440 + lh + 160, 56, COR.sec, 'center', PS, false);
    txt('a cada luta', W / 2, 440 + lh + 236, 56, COR.sec, 'center', PS, false);
    const by = 440 + lh + 360, bw = 760, bh = 130, bx = (W - bw) / 2;
    x.fillStyle = COR.escuro; x.fillRect(bx - 6, by - 6, bw + 12, bh + 12); x.fillStyle = COR.acao; x.fillRect(bx, by, bw, bh); x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(bx, by + bh - 10, bw, 10);
    dado(bx + 56, by + 35, 5); txt('JOGUE GRÁTIS', bx + bw / 2 + 50, by + 84, 46, COR.escuro, 'center', PX, false);
    txt('link na bio', W / 2, by + bh + 110, 50, COR.texto, 'center', PS, false);
    x.globalAlpha = 1;
    emitir();
  }
  window.__SAIDA = saida;
  return saida.length;
}, roteiro);

// ---------- 3. vídeo ----------
console.log(`Montando ${total} quadros (${(total / 30).toFixed(1)} s)...`);
const ff = spawn(ffmpegPath, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'mjpeg', '-i', '-',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart', saida]);
let ffErro = ''; ff.stderr.on('data', d => ffErro += d);
const fim = new Promise(res => ff.on('close', res));
for (let i = 0; i < total; i += 20) {
  const lote = await pagina.evaluate(([a, b]) => window.__SAIDA.slice(a, b), [i, i + 20]);
  for (const d of lote) { const ok = ff.stdin.write(Buffer.from(d.split(',')[1], 'base64')); if (!ok) await new Promise(r => ff.stdin.once('drain', r)); }
}
ff.stdin.end();
const cod = await fim;
await navegador.close();
if (erros.length) console.log('Erros na página:\n' + erros.slice(0, 5).join('\n'));
if (cod !== 0) { console.error('ffmpeg falhou:\n' + ffErro); process.exit(1); }
console.log(`Pronto: ${saida}`);
