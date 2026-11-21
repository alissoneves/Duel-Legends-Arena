// Duel Legends Arena — servidor online (saguão, salas, partida rápida e repasse da luta)
// Node.js puro, sem dependências: WebSocket implementado aqui mesmo.
// Rodar: node server.js   (porta pela variável PORT, padrão 8080)
'use strict';
const http = require('http');
const crypto = require('crypto');

const PORT = process.env.PORT || 8080;
const VERSION = '0.8';
const MAX = { '1x1': 2, '2x2': 4, '3x3': 6, 'ffa': 6 };
const QUICK = ['Oi!', 'Boa sorte!', 'Pronto!', 'Bora!', 'GG!', 'Revanche?', 'Valeu!'];
const PREP_TIME = 30000;

let nextId = 1;
const clients = new Map();   // id -> cliente
const rooms = new Map();     // id -> sala
let quickQueue = [];

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
    slots: r.slots.map((s, i) => ({ pid: s ? s.id : null, name: s ? s.name : 'Bot', team: teamOf(r, i), bot: !s })) };
  broadcastRoom(r, payload);
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
    case 'unqueue': quickQueue = quickQueue.filter(q => q !== c); break;
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
    case 'ping': send(c, { t: 'pong', ts: m.ts }); break;
  }
}

// ---------- HTTP + upgrade ----------
const server = http.createServer((req, res) => {
  if (req.url === '/status') {
    res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' });
    res.end(JSON.stringify({ ok: true, ver: VERSION, players: clients.size, rooms: rooms.size }));
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
  const c = { id: nextId++, sock, buf: Buffer.alloc(0), name: 'Jogador', room: null, slot: -1, closed: false, alive: true };
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
