// Duel Legends Arena — servidor online (saguão, salas, partida rápida e repasse da luta)
// Node.js puro, sem dependências: WebSocket implementado aqui mesmo.
// Rodar: node server.js   (porta pela variável PORT, padrão 8080)
'use strict';
const http = require('http');
const crypto = require('crypto');

const PORT = process.env.PORT || 8080;
const VERSION = '1.2';
const MAX = { '1x1': 2, '2x2': 4, '3x3': 6, '5x5': 10, 'ffa': 8 };
const QUICK = ['Oi!', 'Boa sorte!', 'Pronto!', 'Bora!', 'GG!', 'Revanche?', 'Valeu!'];
const PREP_TIME = 30000;

let nextId = 1;
const clients = new Map();   // id -> cliente
const rooms = new Map();     // id -> sala
let quickQueue = [];
let rankQueue = [];   // ranqueada: { c, mmr, t }

// ---------- ranqueada no servidor (o elo não fica mais só no aparelho) ----------
// Jogadores guardados no Supabase (variáveis SUPABASE_URL e SUPABASE_KEY no Render).
// Sem essas variáveis, guarda só na memória (serve para testes; some ao reiniciar).
const SB_URL = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const SB_KEY = process.env.SUPABASE_KEY || '';
const useDb = !!(SB_URL && SB_KEY);
const players = new Map();   // pid -> { pid, keyh, name, rank }
const TIER_N = ['Ferro', 'Bronze', 'Prata', 'Ouro', 'Platina', 'Esmeralda', 'Diamante', 'Mestre', 'Grão-Mestre', 'Desafiante'];
const ROMAN = ['IV', 'III', 'II', 'I'];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function newRank() { return { tier: -1, div: 0, lp: 0, mmr: 1150, placed: 0, w: 0, l: 0, shield: 0, streak: 0, peak: -1, peakName: '', season: 1, split: 1 }; }
function apexOf(r) { return r.tier < 7 ? r.tier : r.lp >= 500 ? 9 : r.lp >= 200 ? 8 : 7; }
function rankName(r) { if (r.tier < 0) return 'Sem elo'; const t = apexOf(r); return t >= 7 ? TIER_N[t] : `${TIER_N[t]} ${ROMAN[r.div]}`; }
function rankScore(r) { return r.tier < 0 ? -1 : r.tier >= 7 ? 2800 + r.lp : r.tier * 400 + r.div * 100 + r.lp; }
function fromScore(sc) { sc = Math.max(0, sc); if (sc >= 2800) return { tier: 7, div: 0, lp: 0 }; return { tier: Math.floor(sc / 400), div: Math.floor((sc % 400) / 100), lp: 0 }; }
function rankLabel(r) { if (r.tier < 0) return r.placed > 0 ? `Colocação ${r.placed}/5` : 'Sem elo'; return `${rankName(r)} · ${r.lp} PDL`; }
// mesma regra que o jogo usava (Elo/MMR oculto, colocação em 5 partidas, proteção de rebaixamento)
function rankedResult(r, win, opp) {
  const exp = 1 / (1 + Math.pow(10, (opp - r.mmr) / 400)); r.mmr = Math.round(r.mmr + (r.placed < 5 ? 60 : 28) * ((win ? 1 : 0) - exp));
  if (win) r.w++; else r.l++; r.streak = win ? Math.max(1, r.streak + 1) : Math.min(-1, r.streak - 1); const out = { win, d: 0 };
  if (r.placed < 5) { r.placed++; out.placement = r.placed; if (r.placed === 5) { const f = fromScore(r.mmr - 400 - 60); r.tier = f.tier; r.div = f.div; r.lp = f.tier >= 7 ? 0 : 10 + Math.floor(Math.random() * 31); out.placedNow = rankName(r); r.shield = 3; out.box = true; } }
  else {
    const gap = (r.mmr - 400 - rankScore(r)) / 20; const shieldWas = r.shield; r.shield = Math.max(0, r.shield - 1);
    if (win) {
      out.d = Math.round(clamp(21 + gap + (r.streak >= 3 ? 3 : 0), 14, 34)); r.lp += out.d;
      if (r.tier < 7) while (r.lp >= 100) { r.lp -= 100; if (r.div < 3) { r.div++; out.promo = rankName(r); } else { r.tier++; r.div = 0; r.shield = 3; out.promo = rankName(r); out.tierUp = true; out.box = true; if (r.tier >= 7) { r.lp = 0; break; } } }
    } else {
      out.d = -Math.round(clamp(18 - gap, 10, 28));
      if (r.tier >= 7) { r.lp += out.d; if (r.lp < 0) { if (shieldWas > 0) { r.lp = 0; out.shield = true; } else { r.tier = 6; r.div = 3; r.lp = 75; out.demo = rankName(r); } } }
      else if (r.lp > 0) r.lp = Math.max(0, r.lp + out.d);
      else if (r.div > 0) { r.div--; r.lp = 75; out.demo = rankName(r); }
      else if (r.tier > 0) { if (shieldWas > 0) out.shield = true; else { r.tier--; r.div = 3; r.lp = 75; out.demo = rankName(r); } }
    }
  }
  if (r.tier >= 0 && rankScore(r) > r.peak) { r.peak = rankScore(r); r.peakName = rankName(r); }
  out.after = rankLabel(r); return out;
}
async function sb(path, opt = {}) {
  const res = await fetch(SB_URL + '/rest/v1/' + path, { ...opt, headers: { apikey: SB_KEY, ...(SB_KEY.startsWith('eyJ') ? { Authorization: 'Bearer ' + SB_KEY } : {}), 'content-type': 'application/json', ...(opt.headers || {}) } });
  if (!res.ok) throw new Error('supabase ' + res.status + ' ' + (await res.text()).slice(0, 200));
  return res;
}
const hashKey = k => crypto.createHash('sha256').update(String(k)).digest('hex');
async function loadPlayer(pid) {
  if (players.has(pid)) return players.get(pid);
  if (!useDb) return null;
  const rows = await (await sb('players?select=' + COLS + '&pid=eq.' + encodeURIComponent(pid))).json();
  if (!rows.length) return null;
  return fromRow(rows[0]);
}
const COLS = 'pid,keyh,keys,name,rank,login,passh';
function fromRow(row) {
  if (players.has(row.pid)) return players.get(row.pid);
  const p = { pid: row.pid, keyh: row.keyh, keys: row.keys || [], name: row.name, rank: Object.assign(newRank(), row.rank || {}), login: row.login || null, passh: row.passh || null };
  players.set(p.pid, p); return p;
}
async function findLogin(login) {
  for (const p of players.values()) if (p.login === login) return p;
  if (!useDb) return null;
  const rows = await (await sb('players?select=' + COLS + '&login=eq.' + encodeURIComponent(login))).json();
  return rows.length ? fromRow(rows[0]) : null;
}
async function savePlayer(p) {
  topCache = null;
  if (!useDb) return;
  await sb('players', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({ pid: p.pid, keyh: p.keyh, keys: p.keys || [], name: p.name, rank: p.rank, score: rankScore(p.rank), login: p.login || null, passh: p.passh || null, updated: new Date().toISOString() }) });
}
// identifica o aparelho (id + chave anônimos gerados no jogo)
async function identify(c, pid, key) {
  if (!/^[a-z0-9-]{16,40}$/i.test(pid || '') || !key) return;
  let p = await loadPlayer(pid);
  const kh = hashKey(key);
  if (p && p.keyh !== kh && !(p.keys || []).includes(kh)) { send(c, { t: 'error', msg: 'Sessão inválida: entre na sua conta de novo.' }); send(c, { t: 'auth', expired: true }); return; }
  if (!p) { p = { pid, keyh: kh, keys: [], name: c.name, rank: newRank(), login: null, passh: null }; players.set(pid, p); }
  if (p.name !== c.name) p.name = c.name;
  c.player = p; await savePlayer(p);
  send(c, { t: 'rank', rank: p.rank, user: p.login || null });
}
// ---------- contas (usuário e senha) ----------
const USER_RE = /^[a-z0-9_.]{3,16}$/;
function hashPass(pass, salt) { salt = salt || crypto.randomBytes(16).toString('hex'); return salt + ':' + crypto.scryptSync(String(pass), salt, 32).toString('hex'); }
function checkPass(pass, stored) { if (!stored) return false; const [salt, h] = stored.split(':'); const a = Buffer.from(hashPass(pass, salt).split(':')[1], 'hex'), b = Buffer.from(h, 'hex'); return a.length === b.length && crypto.timingSafeEqual(a, b); }
const tries = new Map();   // limite de tentativas por endereço e por usuário
function tooMany(k) { const now = Date.now(); const t = (tries.get(k) || []).filter(x => now - x < 10 * 60000); tries.set(k, t); return t.length >= 8; }
function failed(k) { (tries.get(k) || tries.set(k, []).get(k)).push(Date.now()); }
async function register(c, user, pass) {
  const p = c.player; if (!p) return send(c, { t: 'auth', err: 'Conecte de novo e tente outra vez.' });
  if (p.login) return send(c, { t: 'auth', err: 'Este jogador já tem conta: ' + p.login });
  user = String(user || '').trim().toLowerCase(); pass = String(pass || '');
  if (!USER_RE.test(user)) return send(c, { t: 'auth', err: 'Usuário: 3 a 16 letras minúsculas, números, _ ou ponto.' });
  if (pass.length < 6 || pass.length > 64) return send(c, { t: 'auth', err: 'A senha precisa ter de 6 a 64 caracteres.' });
  if (await findLogin(user)) return send(c, { t: 'auth', err: 'Esse usuário já existe. Escolha outro.' });
  p.login = user; p.passh = hashPass(pass);
  try { await savePlayer(p); } catch (e) { p.login = null; p.passh = null; console.error('register', e.message); return send(c, { t: 'auth', err: /409|duplicate/.test(e.message) ? 'Esse usuário já existe. Escolha outro.' : 'Não deu para criar a conta agora.' }); }
  send(c, { t: 'auth', ok: 'register', user });
}
async function login(c, user, pass) {
  user = String(user || '').trim().toLowerCase(); pass = String(pass || '');
  const ip = c.ip || '?';
  if (tooMany('ip:' + ip) || tooMany('u:' + user)) return send(c, { t: 'auth', err: 'Muitas tentativas. Espere alguns minutos.' });
  const p = USER_RE.test(user) ? await findLogin(user) : null;
  if (!p || !checkPass(pass, p.passh)) { failed('ip:' + ip); failed('u:' + user); return send(c, { t: 'auth', err: 'Usuário ou senha incorretos.' }); }
  const key = crypto.randomBytes(16).toString('hex');
  p.keys = [...(p.keys || []), hashKey(key)].slice(-5);   // até 5 aparelhos conectados à conta
  await savePlayer(p);
  c.player = p; c.name = p.name || c.name; if (c.room) pushRoom(c.room);
  send(c, { t: 'auth', ok: 'login', user, pid: p.pid, key, name: p.name, rank: p.rank });
}
async function changePass(c, oldp, newp) {
  const p = c.player; if (!p || !p.login) return send(c, { t: 'auth', err: 'Entre na sua conta primeiro.' });
  if (tooMany('u:' + p.login)) return send(c, { t: 'auth', err: 'Muitas tentativas. Espere alguns minutos.' });
  if (!checkPass(oldp, p.passh)) { failed('u:' + p.login); return send(c, { t: 'auth', err: 'Senha atual incorreta.' }); }
  newp = String(newp || ''); if (newp.length < 6 || newp.length > 64) return send(c, { t: 'auth', err: 'A senha nova precisa ter de 6 a 64 caracteres.' });
  p.passh = hashPass(newp); await savePlayer(p); send(c, { t: 'auth', ok: 'pass', user: p.login });
}
let topCache = null, topT = 0;
async function topList() {
  if (topCache && Date.now() - topT < 20000) return topCache;
  let list;
  if (useDb) list = await (await sb('players?select=pid,name,rank,score&score=gte.0&order=score.desc&limit=50')).json();
  else list = [...players.values()].map(p => ({ pid: p.pid, name: p.name, rank: p.rank, score: rankScore(p.rank) })).filter(p => p.score >= 0).sort((a, b) => b.score - a.score).slice(0, 50);
  let total = list.length;
  if (useDb) { const res = await sb('players?select=pid&score=gte.0&limit=1', { headers: { Prefer: 'count=exact' } }); total = Number((res.headers.get('content-range') || '').split('/')[1]) || list.length; }
  topCache = { list: list.map(p => ({ pid: p.pid, n: p.name, r: { tier: p.rank.tier, div: p.rank.div, lp: p.rank.lp } })), total }; topT = Date.now();
  return topCache;
}
async function myPos(p) {
  const sc = rankScore(p.rank); if (sc < 0) return 0;
  if (!useDb) return [...players.values()].filter(q => rankScore(q.rank) > sc).length + 1;
  const res = await sb('players?select=pid&score=gt.' + sc + '&limit=1', { headers: { Prefer: 'count=exact' } });
  return (Number((res.headers.get('content-range') || '').split('/')[1]) || 0) + 1;
}
// resultado da ranqueada: os dois jogadores informam; só vale se concordarem
const matches = new Map();
function rankReport(c, win) {
  const M = c.match; if (!M || M.done || !c.player) return;
  M.rep[c.player.pid] = !!win;
  const pids = Object.keys(M.mmr);
  if (pids.every(p => p in M.rep)) settle(M);
}
async function settle(M) {
  if (M.done) return; M.done = true; clearTimeout(M.timer); matches.delete(M.id);
  const [a, b] = Object.keys(M.mmr); const ok = a in M.rep && b in M.rep && M.rep[a] !== M.rep[b];
  for (const pid of [a, b]) {
    const c = M.conns[pid]; if (c) c.match = null;
    if (!ok) { if (c && !c.closed) send(c, { t: 'rankres', void: true, msg: 'Resultado não confirmado: partida sem PDL.' }); continue; }
    const p = players.get(pid); if (!p) continue;
    const out = rankedResult(p.rank, M.rep[pid], M.mmr[pid === a ? b : a]);
    try { await savePlayer(p); } catch (e) { console.error(e.message); }
    if (c && !c.closed) send(c, { t: 'rankres', out, rank: p.rank });
  }
}

// ---------- WebSocket mínimo (RFC 6455) ----------
function wsAccept(key) {
  return crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
}
function wsFrame(str) {
  const data = Buffer.from(str, 'utf8');
  const len = data.length;
  let head;
  if (len < 126) { head = Buffer.alloc(2); head[1] = len; }
  else if (len < 65536) { head = Buffer.alloc(4); head[1] = 126; head.writeUInt16BE(len, 2); }
  else { head = Buffer.alloc(10); head[1] = 127; head.writeBigUInt64BE(BigInt(len), 2); }
  head[0] = 0x81;
  return Buffer.concat([head, data]);
}
function send(c, obj) {
  if (!c || c.closed) return;
  try { c.sock.write(wsFrame(JSON.stringify(obj))); } catch (e) { /* conexão caiu */ }
}
function onData(c, chunk) {
  c.buf = Buffer.concat([c.buf, chunk]);
  while (c.buf.length >= 2) {
    const b0 = c.buf[0], b1 = c.buf[1];
    const op = b0 & 0x0f, masked = (b1 & 0x80) !== 0;
    let len = b1 & 0x7f, off = 2;
    if (len === 126) { if (c.buf.length < 4) return; len = c.buf.readUInt16BE(2); off = 4; }
    else if (len === 127) { if (c.buf.length < 10) return; len = Number(c.buf.readBigUInt64BE(2)); off = 10; }
    if (len > 1 << 20) { close(c); return; }               // proteção: no máximo 1 MB por mensagem
    const need = off + (masked ? 4 : 0) + len;
    if (c.buf.length < need) return;
    let payload = c.buf.subarray(off + (masked ? 4 : 0), need);
    if (masked) {
      const m = c.buf.subarray(off, off + 4);
      payload = Buffer.from(payload);
      for (let i = 0; i < payload.length; i++) payload[i] ^= m[i & 3];
    }
    c.buf = c.buf.subarray(need);
    if (op === 0x8) { close(c); return; }
    if (op === 0x9) { try { c.sock.write(Buffer.concat([Buffer.from([0x8a, payload.length]), payload])); } catch (e) {} continue; }
    if (op === 0x1) {
      let msg; try { msg = JSON.parse(payload.toString('utf8')); } catch (e) { continue; }
      try { handle(c, msg); } catch (e) { console.error('erro ao tratar mensagem', e); }
    }
  }
}
function close(c) {
  if (c.closed) return;
  c.closed = true;
  try { c.sock.end(); } catch (e) {}
  clients.delete(c.id);
  quickQueue = quickQueue.filter(q => q !== c);
  rankQueue = rankQueue.filter(q => q.c !== c);
  if (c.match && !c.match.done) { const M = c.match; clearTimeout(M.timer); M.timer = setTimeout(() => settle(M), 20000); }
  leaveRoom(c);
}

// ---------- salas ----------
function roomInfo(r) {
  return { id: r.id, name: r.name, mode: r.mode, players: r.slots.filter(s => s).length, max: r.max, locked: !!r.pass, status: r.status };
}
function roomState(r) {
  return {
    t: 'room', id: r.id, name: r.name, mode: r.mode, host: r.host, status: r.status, max: r.max, locked: !!r.pass,
    slots: r.slots.map((s, i) => s ? { pid: s.id, name: s.name, team: teamOf(r, i), ready: !!r.ready[s.id] } : null),
  };
}
function teamOf(r, slot) { return r.mode === 'ffa' ? slot : slot % 2; }
function broadcastRoom(r, obj, except) { for (const s of r.slots) if (s && s !== except) send(s, obj); }
function pushRoom(r) { broadcastRoom(r, roomState(r)); }
function pushList() {
  const list = { t: 'rooms', rooms: [...rooms.values()].filter(r => !r.quick).map(roomInfo) };
  for (const c of clients.values()) if (!c.room) send(c, list);
}
function createRoom(c, name, mode, pass, quick) {
  if (!MAX[mode]) mode = '1x1';
  const r = { id: 'S' + (nextId++), name: String(name || 'Sala').slice(0, 24), mode, pass: pass ? String(pass).slice(0, 16) : '', max: MAX[mode],
    slots: new Array(MAX[mode]).fill(null), ready: {}, host: c.id, status: 'lobby', quick: !!quick, prep: null, gears: {}, cos: {} };
  rooms.set(r.id, r);
  return r;
}
function joinRoom(c, r, slotWanted) {
  if (c.room) leaveRoom(c);
  let slot = -1;
  if (slotWanted != null && !r.slots[slotWanted]) slot = slotWanted;
  else slot = r.slots.findIndex(s => !s);
  if (slot < 0) { send(c, { t: 'error', msg: 'Sala cheia' }); return false; }
  r.slots[slot] = c; c.room = r; c.slot = slot;
  pushRoom(r); pushList();
  return true;
}
function leaveRoom(c) {
  const r = c.room; if (!r) return;
  r.slots[c.slot] = null; delete r.ready[c.id]; c.room = null; c.slot = -1;
  const left = r.slots.filter(s => s);
  if (!left.length) { rooms.delete(r.id); pushList(); return; }
  if (r.status !== 'lobby') { broadcastRoom(r, { t: 'aborted', msg: c.id === r.host ? 'O dono da sala saiu. Partida encerrada.' : `${c.name} saiu da partida.` }); r.status = 'lobby'; r.ready = {}; r.prep = null; }
  if (r.quick) { for (const s of left) { s.room = null; s.slot = -1; send(s, { t: 'left' }); } rooms.delete(r.id); pushList(); return; }
  if (r.host === c.id) r.host = left[0].id;
  pushRoom(r); pushList();
}
function startRoom(r) {
  r.status = 'draw';
  r.seed = Math.floor(Math.random() * 2 ** 31);
  r.gears = {}; r.cos = {};
  const payload = { t: 'start', seed: r.seed, mode: r.mode, host: r.host,
    ranked: !!r.ranked, slots: r.slots.map((s, i) => ({ pid: s ? s.id : null, name: s ? s.name : 'Bot', team: teamOf(r, i), bot: !s, mmr: s ? s.mmr || 1150 : 0 })) };
  broadcastRoom(r, payload);
  if (r.ranked) {
    const people = r.slots.filter(s => s && s.player);
    if (people.length === 2) {
      const M = { id: r.id + ':' + r.seed, mmr: {}, rep: {}, conns: {}, done: false };
      for (const s of people) { M.mmr[s.player.pid] = s.player.rank.mmr; M.conns[s.player.pid] = s; s.match = M; }
      M.timer = setTimeout(() => settle(M), 15 * 60000);
      matches.set(M.id, M);
    }
  }
  r.prep = { ready: {}, timer: setTimeout(() => goRoom(r), PREP_TIME + 9000) };
  pushList();
}
function goRoom(r) {
  if (!r.prep || r.status === 'fight') return;
  clearTimeout(r.prep.timer); r.prep = null; r.status = 'fight';
  broadcastRoom(r, { t: 'go', gears: r.gears, cos: r.cos });
  pushList();
}

// ---------- mensagens ----------
function handle(c, m) {
  switch (m.t) {
    case 'hello':
      c.name = String(m.name || 'Jogador').replace(/[^\p{L}\p{N} _.-]/gu, '').slice(0, 16) || 'Jogador';
      send(c, { t: 'welcome', id: c.id, ver: VERSION, quick: QUICK });
      if (m.pid) identify(c, m.pid, m.key).catch(e => { console.error('identify', e.message); send(c, { t: 'error', msg: 'Ranqueada indisponível agora.' }); });
      else if (c.player && c.player.name !== c.name) { c.player.name = c.name; savePlayer(c.player).catch(() => {}); }
      if (c.room) pushRoom(c.room);
      pushList();
      break;
    case 'list': send(c, { t: 'rooms', rooms: [...rooms.values()].filter(r => !r.quick).map(roomInfo) }); break;
    case 'create': { const r = createRoom(c, m.name, m.mode, m.pass); joinRoom(c, r, 0); break; }
    case 'join': {
      const r = rooms.get(m.id);
      if (!r) return send(c, { t: 'error', msg: 'Sala não existe mais' });
      if (r.status !== 'lobby') return send(c, { t: 'error', msg: 'A partida já começou' });
      if (r.pass && r.pass !== String(m.pass || '')) return send(c, { t: 'error', msg: 'Senha errada' });
      joinRoom(c, r);
      break;
    }
    case 'leave': leaveRoom(c); send(c, { t: 'rooms', rooms: [...rooms.values()].filter(r => !r.quick).map(roomInfo) }); break;
    case 'slot': {  // trocar de lugar (e de equipe)
      const r = c.room; if (!r || r.status !== 'lobby') return;
      const to = m.slot | 0; if (to < 0 || to >= r.max || r.slots[to]) return;
      r.slots[c.slot] = null; r.slots[to] = c; c.slot = to; delete r.ready[c.id]; pushRoom(r); break;
    }
    case 'ready': { const r = c.room; if (!r || r.status !== 'lobby') return; r.ready[c.id] = !!m.v; pushRoom(r); break; }
    case 'quick': { const r = c.room; if (!r) return; const msg = QUICK[m.i | 0]; if (msg) broadcastRoom(r, { t: 'chat', from: c.name, msg }); break; }
    case 'start': {
      const r = c.room; if (!r || r.host !== c.id || r.status !== 'lobby') return;
      const humans = r.slots.filter(s => s);
      if (humans.some(s => s.id !== r.host && !r.ready[s.id])) return send(c, { t: 'error', msg: 'Espere todos ficarem PRONTOS' });
      startRoom(r); break;
    }
    case 'quickmatch': {
      if (c.room) leaveRoom(c);
      rankQueue = rankQueue.filter(q => q.c !== c);
      quickQueue = quickQueue.filter(q => q !== c && !q.closed);
      const other = quickQueue.shift();
      if (other) {
        const r = createRoom(other, 'Partida rápida', '1x1', '', true);
        joinRoom(other, r, 0); joinRoom(c, r, 1);
        r.ready[c.id] = true; r.ready[other.id] = true;
        startRoom(r);
      } else { quickQueue.push(c); send(c, { t: 'queued' }); }
      break;
    }
    case 'rankqueue': {
      if (c.room) leaveRoom(c);
      quickQueue = quickQueue.filter(q => q !== c);
      rankQueue = rankQueue.filter(q => q.c !== c && !q.c.closed);
      if (!c.player) { send(c, { t: 'error', msg: 'Atualize o jogo para jogar a ranqueada.' }); return; }
      c.mmr = c.player.rank.mmr;
      // rival de nível mais próximo; quem espera há mais tempo aceita diferença maior
      let best = -1, bd = 1e9;
      rankQueue.forEach((q, i) => { const d = Math.abs(q.mmr - c.mmr) - (Date.now() - q.t) / 100; if (d < bd) { bd = d; best = i; } });
      if (best >= 0) {
        const other = rankQueue.splice(best, 1)[0].c;
        const r = createRoom(other, 'Ranqueada', '1x1', '', true); r.ranked = true;
        joinRoom(other, r, 0); joinRoom(c, r, 1);
        r.ready[c.id] = true; r.ready[other.id] = true;
        startRoom(r);
      } else { rankQueue.push({ c, mmr: c.mmr, t: Date.now() }); send(c, { t: 'queued', ranked: true }); }
      break;
    }
    case 'unqueue': quickQueue = quickQueue.filter(q => q !== c); rankQueue = rankQueue.filter(q => q.c !== c); break;
    case 'prepready': {
      const r = c.room; if (!r || !r.prep) return;
      r.prep.ready[c.id] = true; r.gears[c.slot] = m.gear || {}; r.cos[c.slot] = m.cos || {};
      broadcastRoom(r, { t: 'prep', ready: Object.keys(r.prep.ready).map(Number) });
      if (r.slots.filter(s => s).every(s => r.prep.ready[s.id])) goRoom(r);
      break;
    }
    // durante a luta: comandos vão para o dono da sala; o estado do dono vai para os outros
    case 'inp': { const r = c.room; if (!r || r.status !== 'fight') return; const h = clients.get(r.host); if (h && h !== c) send(h, { t: 'inp', s: c.slot, i: m.i }); break; }
    case 'snap': { const r = c.room; if (!r || r.host !== c.id) return; broadcastRoom(r, { t: 'snap', s: m.s }, c); break; }
    case 'end': {
      const r = c.room; if (!r || r.host !== c.id) return;
      broadcastRoom(r, { t: 'end', w: m.w, st: m.st }, c);
      r.status = 'lobby'; r.ready = {}; r.prep = null;
      if (r.quick) { for (const s of r.slots) if (s) { s.room = null; s.slot = -1; } rooms.delete(r.id); }
      else pushRoom(r);
      pushList();
      break;
    }
    case 'rres': rankReport(c, m.win); break;
    case 'register': register(c, m.user, m.pass).catch(e => { console.error('register', e.message); send(c, { t: 'auth', err: 'Não deu para criar a conta agora.' }); }); break;
    case 'login': login(c, m.user, m.pass).catch(e => { console.error('login', e.message); send(c, { t: 'auth', err: 'Não deu para entrar agora.' }); }); break;
    case 'passwd': changePass(c, m.old, m.pass).catch(e => { console.error('passwd', e.message); send(c, { t: 'auth', err: 'Não deu para trocar a senha agora.' }); }); break;
    case 'top': {
      topList().then(async T => send(c, { t: 'top', list: T.list, total: T.total, me: c.player ? { pid: c.player.pid, pos: await myPos(c.player) } : null }))
        .catch(e => { console.error('top', e.message); send(c, { t: 'top', list: [], total: 0, err: 'Ranking indisponível agora.' }); });
      break;
    }
    case 'ping': send(c, { t: 'pong', ts: m.ts }); break;
  }
}

// ---------- HTTP + upgrade ----------
const server = http.createServer((req, res) => {
  if (req.url === '/status') {
    res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' });
    res.end(JSON.stringify({ ok: true, ver: VERSION, players: clients.size, rooms: rooms.size, db: useDb }));
    return;
  }
  res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
  res.end(`Duel Legends Arena — servidor online v${VERSION} funcionando. Jogadores conectados: ${clients.size}`);
});
server.on('upgrade', (req, sock) => {
  const key = req.headers['sec-websocket-key'];
  if (!key || (req.headers.upgrade || '').toLowerCase() !== 'websocket') { sock.destroy(); return; }
  sock.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + wsAccept(key) + '\r\n\r\n');
  sock.setNoDelay(true);
  const c = { id: nextId++, ip: String(req.headers['x-forwarded-for'] || sock.remoteAddress || '').split(',')[0].trim(), sock, buf: Buffer.alloc(0), name: 'Jogador', room: null, slot: -1, closed: false, alive: true };
  clients.set(c.id, c);
  sock.on('data', d => { c.alive = true; onData(c, d); });
  sock.on('close', () => close(c));
  sock.on('error', () => close(c));
});
// derruba conexões mortas
setInterval(() => {
  for (const c of clients.values()) {
    if (!c.alive) { close(c); continue; }
    c.alive = false;
    try { c.sock.write(Buffer.from([0x89, 0])); } catch (e) { close(c); }
  }
}, 30000);
server.listen(PORT, () => console.log(`Duel Legends Arena — servidor v${VERSION} na porta ${PORT}`));
