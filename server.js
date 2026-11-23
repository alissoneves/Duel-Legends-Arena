// Duel Legends Arena — servidor online (saguão, salas, partida rápida e repasse da luta)
// Node.js puro, sem dependências: WebSocket implementado aqui mesmo.
// Rodar: node server.js   (porta pela variável PORT, padrão 8080)
'use strict';
const http = require('http');
const crypto = require('crypto');

const PORT = process.env.PORT || 8080;
const VERSION = '2.2';
const MIN_VER = 2.1;   // 110 lendas: versões antigas sorteiam diferente
const RPICK_TIME = 15000;
const MAX = { '1x1': 2, '2x2': 4, '3x3': 6, '5x5': 10, 'ffa': 8 };
const QUICK = ['Oi!', 'Boa sorte!', 'Pronto!', 'Bora!', 'GG!', 'Revanche?', 'Valeu!'];
const PREP_TIME = 30000;

let nextId = 1;
const clients = new Map();   // id -> cliente
const rooms = new Map();     // id -> sala
let quickQueue = [];
let rankQueue = [];   // ranqueada: { c, mmr, t }

// filtro de nomes: bloqueia palavrões, ofensas e termos de ódio (português e inglês)
// normaliza acentos, números no lugar de letras (4=a, 3=e, 1=i, 0=o, 5=s, 7=t, @=a, $=s) e letras repetidas
const BAD_ROOTS = ['porra', 'caralh', 'karalh', 'buceta', 'bucet', 'xoxota', 'xereca', 'xota', 'puta', 'puto', 'putinha', 'viado', 'viadinh', 'bixa', 'bicha',
  'vagabund', 'arrombad', 'cuzao', 'cusao', 'cuzinh', 'fdp', 'filhodaput', 'foder', 'fodase', 'fodas', 'fodid', 'merd', 'bosta', 'bostinh', 'porrinh', 'caralinh', 'cuzinho', 'piroca', 'pirok', 'rola',
  'punheta', 'siririca', 'boquete', 'chupaminha', 'pauno', 'paunocu', 'corno', 'otario', 'babaca', 'retardad', 'mongoloid', 'estupr', 'pedofil', 'nazi', 'hitler',
  'crioulo', 'fuck', 'fuk', 'shit', 'bitch', 'cunt', 'dick', 'pussy', 'whore', 'slut', 'nigg', 'nigga', 'faggot', 'retard', 'sexo', 'porn', 'xvideo', 'peitud', 'gostos'];
// palavras normais que contêm um trecho acima e não devem ser bloqueadas
const OK_WORDS = ['computa', 'disputa', 'reputa', 'imputa', 'deputad', 'amputa', 'putamen', 'rolamento', 'rolando', 'rolagem', 'controla', 'escola', 'carola', 'crola',
  'marola', 'corola', 'pirola', 'patrola', 'petrola', 'pintor', 'pintura', 'pintado', 'pintassilgo', 'shitake', 'dickens', 'bichano', 'sexton',
  'consexo', 'sussex', 'essex', 'scunthorpe', 'pintinho', 'rolao', 'rolinha', 'otaku', 'diaspora', 'espora', 'merdeka'];
function normName(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[4@]/g, 'a').replace(/3/g, 'e').replace(/[1!|]/g, 'i').replace(/0/g, 'o').replace(/[5$]/g, 's').replace(/7/g, 't')
    .replace(/[^a-z]/g, '').replace(/(.)\1+/g, '$1');
}
function badName(s) {
  let n = normName(s);
  for (const w of OK_WORDS) n = n.split(normName(w)).join('#');
  return BAD_ROOTS.some(r => n.includes(normName(r)));
}


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
function newRank() { return { tier: -1, div: 0, lp: 0, mmr: 1150, placed: 0, w: 0, l: 0, shield: 0, streak: 0, peak: -1, peakName: '', season: seasonNow(), split: 1, borders: [] }; }
function apexOf(r) { return r.tier < 7 ? r.tier : r.lp >= 500 ? 9 : r.lp >= 200 ? 8 : 7; }
function rankName(r) { if (r.tier < 0) return 'Sem elo'; const t = apexOf(r); return t >= 7 ? TIER_N[t] : `${TIER_N[t]} ${ROMAN[r.div]}`; }
function rankScore(r) { return r.tier < 0 ? -1 : r.tier >= 7 ? 2800 + r.lp : r.tier * 400 + r.div * 100 + r.lp; }
function fromScore(sc) { sc = Math.max(0, sc); if (sc >= 2800) return { tier: 7, div: 0, lp: 0 }; return { tier: Math.floor(sc / 400), div: Math.floor((sc % 400) / 100), lp: 0 }; }
function rankLabel(r) { if (r.tier < 0) return r.placed > 0 ? `Colocação ${r.placed}/5` : 'Sem elo'; return `${rankName(r)} · ${r.lp} PDL`; }
// mesma regra que o jogo usava (Elo/MMR oculto, colocação em 5 partidas, proteção de rebaixamento)
function rankedResult(r, win, opp) {
  const exp = 1 / (1 + Math.pow(10, (opp - r.mmr) / 400)); r.mmr = Math.round(r.mmr + (r.placed < 5 ? 60 : 28) * ((win ? 1 : 0) - exp));
  if (win) r.w++; else r.l++; r.streak = win ? Math.max(1, r.streak + 1) : Math.min(-1, r.streak - 1); const out = { win, d: 0 };
  if (r.placed < 5) { r.placed++; out.placement = r.placed; if (r.placed === 5) { const f = fromScore(r.mmr - 400 - 60); r.tier = f.tier; r.div = f.div; r.lp = f.tier >= 7 ? 0 : 10 + Math.floor(Math.random() * 31); out.placedNow = rankName(r); r.shield = 3; out.box = true; r.boxT = [r.tier]; } }
  else {
    const gap = (r.mmr - 400 - rankScore(r)) / 20; const shieldWas = r.shield; r.shield = Math.max(0, r.shield - 1);
    if (win) {
      out.d = Math.round(clamp(21 + gap + (r.streak >= 3 ? 3 : 0), 14, 34)); r.lp += out.d;
      if (r.tier < 7) while (r.lp >= 100) { r.lp -= 100; if (r.div < 3) { r.div++; out.promo = rankName(r); } else { r.tier++; r.div = 0; r.shield = 3; out.promo = rankName(r); out.tierUp = true; r.boxT = r.boxT || []; if (!r.boxT.includes(r.tier)) { r.boxT.push(r.tier); out.box = true; } if (r.tier >= 7) { r.lp = 0; break; } } }
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
// ---------- temporadas de 3 meses (T1 vai até 1º/mar/2027, meia-noite de Brasília) ----------
const S_START = Date.UTC(2026, 11, 1, 3);   // 1º/dez/2026 00h BRT
function seasonEndOf(n) { const d = new Date(S_START); d.setUTCMonth(d.getUTCMonth() + 3 * n); return d.getTime(); }
function seasonNow(t = Date.now()) { let n = 1; while (t >= seasonEndOf(n)) n++; return n; }
function frameOfScore(sc) { if (sc >= 2800) return { t: apexOf({ tier: 7, lp: sc - 2800 }), d: 3 }; return { t: Math.floor(sc / 400), d: Math.floor((sc % 400) / 100) }; }
// na primeira conexão da temporada nova: dá a borda do maior elo da anterior e faz o reinício suave
function seasonRoll(p) {
  const r = p.rank, cur = seasonNow(); if ((r.season || 1) >= cur) return false;
  r.borders = r.borders || [];
  if (r.peak >= 0 && !r.borders.some(b => b.s === r.season)) r.borders.push({ s: r.season || 1, ...frameOfScore(r.peak) });
  r.lastSeason = { s: r.season || 1, peakName: r.peakName || '', w: r.w || 0, l: r.l || 0, f: r.peak >= 0 ? frameOfScore(r.peak) : null };
  Object.assign(r, { tier: -1, div: 0, lp: 0, placed: 0, w: 0, l: 0, shield: 0, streak: 0, peak: -1, peakName: '', season: cur, boxT: [], mmr: Math.round((r.mmr + 1150) / 2) });
  return true;
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
  p.rename = !!p.rank.rename;
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
  if (!useDb || p.deleted) return;
  await sb('players', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({ pid: p.pid, keyh: p.keyh, keys: p.keys || [], name: p.name, rank: Object.assign(p.rank, { rename: !!p.rename }), score: rankScore(p.rank), login: p.login || null, passh: p.passh || null, updated: new Date().toISOString() }) });
}
// identifica o aparelho (id + chave anônimos gerados no jogo)
async function identify(c, pid, key) {
  if (!/^[a-z0-9-]{16,40}$/i.test(pid || '') || !key) return;
  let p = await loadPlayer(pid);
  const kh = hashKey(key);
  if (p && p.keyh !== kh && !(p.keys || []).includes(kh)) { send(c, { t: 'error', msg: 'Sessão inválida: entre na sua conta de novo.' }); send(c, { t: 'auth', expired: true }); return; }
  if (!p) { p = { pid, keyh: kh, keys: [], name: c.name, rank: newRank(), login: null, passh: null, rename: !!c.badName }; players.set(pid, p); }
  // o nome fica fixo depois de escolhido; só muda se a moderação liberar (rename)
  if (p.rename || !p.name || /^Jogador\d*$/.test(p.name)) { if (!c.badName && !/^Jogador\d*$/.test(c.name)) { p.name = c.name; p.rename = false; } }
  c.name = p.name || c.name;
  p.rank.prof = { icon: c.icon || (p.rank.prof && p.rank.prof.icon) || '', title: c.title || '' };
  c.icon = p.rank.prof.icon;
  seasonRoll(p); c.player = p; c.actT = Date.now(); actRow(p.pid); await savePlayer(p);
  send(c, { t: 'rank', rank: p.rank, user: p.login || null, seasonEnd: seasonEndOf(p.rank.season || 1), name: p.name, rename: !!p.rename });
  if (c.room) pushRoom(c.room);
}
// ---------- denúncias ----------
// 3 pessoas diferentes denunciando o nome de alguém em 24h: o nome é trocado e a pessoa escolhe outro
const reportsMem = [];   // { at, from, to, reason }
const REASONS = { nome: 'Nome ofensivo', trapaca: 'Trapaça', comport: 'Comportamento ruim' };
async function report(c, targetConnId, reason) {
  if (!c.player) return send(c, { t: 'error', msg: 'Conecte de novo para denunciar.' });
  if (!REASONS[reason]) return;
  if (tooMany('rep:' + c.player.pid)) return send(c, { t: 'error', msg: 'Você já enviou muitas denúncias. Espere um pouco.' });
  const tc = clients.get(Number(targetConnId));
  if (!tc || !tc.player || tc === c) return send(c, { t: 'error', msg: 'Jogador não encontrado.' });
  failed('rep:' + c.player.pid);
  const now = Date.now(), tp = tc.player;
  reportsMem.push({ at: now, from: c.player.pid, to: tp.pid, reason });
  while (reportsMem.length && now - reportsMem[0].at > 86400000) reportsMem.shift();
  console.log(`denúncia: ${c.name} -> ${tc.name} (${REASONS[reason]})`);
  if (useDb) sb('reports', { method: 'POST', body: JSON.stringify({ reporter: c.player.pid, reporter_name: c.name, target: tp.pid, target_name: tp.name, reason }) }).catch(e => console.error('report', e.message));
  send(c, { t: 'info', msg: 'Denúncia enviada. Obrigado por ajudar a arena!' });
  if (reason === 'nome') {
    const who = new Set(reportsMem.filter(x => x.to === tp.pid && x.reason === 'nome').map(x => x.from));
    if (who.size >= 3 && !tp.rename) {
      tp.name = 'Jogador' + (1000 + crypto.randomInt(9000)); tp.rename = true;
      savePlayer(tp).catch(() => {});
      for (const x of clients.values()) if (x.player === tp) { x.name = tp.name; send(x, { t: 'rank', rank: tp.rank, user: tp.login || null, name: tp.name, rename: true }); send(x, { t: 'error', msg: 'Seu nome foi denunciado e trocado. Escolha um novo nome.' }); if (x.room) pushRoom(x.room); }
    }
  }
}

// ---------- dados de balanceamento ----------
// cada partida terminada conta para a lenda usada: jogos e vitórias por modo
const bal = new Map();   // 'lenda|modo' -> { legend, mode, games, wins, dirty }
async function balLoad() {
  if (!useDb) return;
  try { for (const r of await (await sb('legend_stats?select=legend,mode,games,wins&limit=5000')).json()) bal.set(r.legend + '|' + r.mode, { ...r, dirty: false }); console.log('balanceamento: ' + bal.size + ' linhas'); }
  catch (e) { console.error('legend_stats', e.message); }
}
// só aceita lendas e modos que existem no jogo (senão qualquer um enche a tabela com nomes inventados)
const MODES = new Set(['bots_1x1', 'online_1x1', 'ranked', 'equipe', 'ffa']);
let LEGENDS = null;
try { LEGENDS = new Set(require('./ferramentas/dados').carregarLendas().map(l => l.n)); console.log('lendas conhecidas: ' + LEGENDS.size); }
catch (e) { console.error('lista de lendas indisponível; usando só o limite de tamanho', e.message); }
function balAdd(legend, mode, win) {
  if (!/^[\p{L}\p{N} .,'-]{1,40}$/u.test(legend) || !MODES.has(mode)) return;
  if (LEGENDS ? !LEGENDS.has(legend) : bal.size >= 1000) return;
  const k = legend + '|' + mode; const e = bal.get(k) || { legend, mode, games: 0, wins: 0 };
  e.games++; if (win) e.wins++; e.dirty = true; bal.set(k, e);
}
async function balFlush() {
  if (!useDb) return;
  const rows = [...bal.values()].filter(e => e.dirty); if (!rows.length) return;
  try { await sb('legend_stats', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify(rows.map(e => ({ legend: e.legend, mode: e.mode, games: e.games, wins: e.wins }))) }); rows.forEach(e => e.dirty = false); }
  catch (e) { console.error('balFlush', e.message); }
}
setInterval(balFlush, 5 * 60000);
function balPage(names) {
  const by = new Map();
  for (const e of bal.values()) { const t = by.get(e.legend) || { legend: e.legend, games: 0, wins: 0, modes: {} }; t.games += e.games; t.wins += e.wins; t.modes[e.mode] = e; by.set(e.legend, t); }
  const rows = [...by.values()].sort((a, b) => b.wins / Math.max(1, b.games) - a.wins / Math.max(1, a.games));
  const total = rows.reduce((a, r) => a + r.games, 0);
  const esc = x => String(x).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  const tr = rows.map(r => { const wr = r.games ? r.wins / r.games * 100 : 0; const few = r.games < 30;
    const col = few ? '#8a8fb8' : wr > 58 ? '#ff6a6a' : wr < 42 ? '#7fc8ff' : '#8ef0a0';
    const md = ['bots_1x1', 'online_1x1', 'ranked', 'equipe', 'ffa'].map(k => { const e = r.modes[k]; return `<td>${e ? Math.round(e.wins / e.games * 100) + '% <small>(' + e.games + ')</small>' : '—'}</td>`; }).join('');
    return `<tr><td>${esc(r.legend)}</td><td style="color:${col};font-weight:700">${wr.toFixed(1)}%</td><td>${r.games}</td>${md}</tr>`; }).join('');
  return `<!doctype html><html lang="pt-br"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Balanceamento · Duel Legends Arena</title>
<style>body{font-family:system-ui,sans-serif;background:#0b0c14;color:#e8e8f4;margin:16px}h1{color:#ffd23f;font-size:20px}table{border-collapse:collapse;width:100%;font-size:13px}th,td{padding:6px 8px;border-bottom:1px solid #2e3358;text-align:left}th{color:#ffd23f;position:sticky;top:0;background:#141626}small{color:#8a8fb8}p{color:#c9cbe6;font-size:13px}</style></head>
<body><h1>Balanceamento das lendas</h1><p>${total} partidas registradas. <b style="color:#ff6a6a">Vermelho</b>: vence demais (acima de 58%). <b style="color:#7fc8ff">Azul</b>: vence pouco (abaixo de 42%). Cinza: menos de 30 partidas, ainda sem dado suficiente.</p>
<table><tr><th>Lenda</th><th>Vitórias</th><th>Partidas</th><th>Bots 1x1</th><th>Online 1x1</th><th>Ranqueada</th><th>Equipe</th><th>Todos x Todos</th></tr>${tr}</table></body></html>`;
}

// ---------- retenção ----------
// uma linha por jogador por dia em que ele abriu o jogo online: minutos jogados e partidas
const DAYMS = 86400000, BRT = 3 * 3600000;
function dayNow(t = Date.now()) { return Math.floor((t - BRT) / DAYMS); }
const act = new Map();   // 'pid|dia' -> { pid, day, secs, games, dirty }
async function actLoad() {
  if (!useDb) return;
  try { for (const r of await (await sb('activity?select=pid,day,secs,games&limit=100000')).json()) act.set(r.pid + '|' + r.day, { ...r, dirty: false }); console.log('retenção: ' + act.size + ' linhas'); }
  catch (e) { console.error('activity', e.message); }
}
function actRow(pid) { const d = dayNow(), k = pid + '|' + d; let e = act.get(k); if (!e) { e = { pid, day: d, secs: 0, games: 0, dirty: true }; act.set(k, e); } return e; }
function actSecs(c) { if (!c.player || !c.actT) return; const now = Date.now(); actRow(c.player.pid).secs += Math.round((now - c.actT) / 1000); actRow(c.player.pid).dirty = true; c.actT = now; }
async function actFlush() {
  for (const c of clients.values()) actSecs(c);
  if (!useDb) return;
  const rows = [...act.values()].filter(e => e.dirty); if (!rows.length) return;
  try { await sb('activity', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify(rows.map(e => ({ pid: e.pid, day: e.day, secs: e.secs, games: e.games }))) }); rows.forEach(e => e.dirty = false); }
  catch (e) { console.error('actFlush', e.message); }
}
setInterval(actFlush, 5 * 60000);
function retPage() {
  const first = new Map(), byDay = new Map();
  for (const e of act.values()) { if (!first.has(e.pid) || e.day < first.get(e.pid)) first.set(e.pid, e.day); const d = byDay.get(e.day) || { pids: new Set(), secs: 0, games: 0 }; d.pids.add(e.pid); d.secs += e.secs; d.games += e.games; byDay.set(e.day, d); }
  const played = (pid, day) => act.has(pid + '|' + day);
  const today = dayNow(), pct = (a, b) => b ? Math.round(a / b * 100) + '%' : '—';
  const cohort = d => [...first.entries()].filter(([, f]) => f === d).map(([pid]) => pid);
  const ret = (d, k) => { if (d + k > today) return null; const c = cohort(d); return [c.filter(pid => played(pid, d + k)).length, c.length]; };
  let sum = { 1: [0, 0], 7: [0, 0], 30: [0, 0] };
  for (const d of new Set(first.values())) for (const k of [1, 7, 30]) { const r = ret(d, k); if (r) { sum[k][0] += r[0]; sum[k][1] += r[1]; } }
  const dateOf = d => new Date(d * DAYMS + BRT).toISOString().slice(5, 10).split('-').reverse().join('/');
  let tr = '';
  for (let d = today; d > today - 21; d--) {
    const D = byDay.get(d); if (!D) continue; const n = cohort(d).length, r1 = ret(d, 1), r7 = ret(d, 7);
    tr += `<tr><td>${dateOf(d)}</td><td>${D.pids.size}</td><td>${n}</td><td>${r1 ? pct(...r1) : '…'}</td><td>${r7 ? pct(...r7) : '…'}</td><td>${(D.secs / 60 / D.pids.size).toFixed(1)}</td><td>${D.games}</td></tr>`;
  }
  const box = (lab, k, meta) => `<div class="b"><div class="n">${pct(...sum[k])}</div><div>${lab}</div><small>${sum[k][1]} jogadores medidos · bom: ${meta}</small></div>`;
  return `<!doctype html><html lang="pt-br"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Retenção · Duel Legends Arena</title>
<style>body{font-family:system-ui,sans-serif;background:#0b0c14;color:#e8e8f4;margin:16px}h1{color:#ffd23f;font-size:20px}table{border-collapse:collapse;width:100%;font-size:13px}th,td{padding:6px 8px;border-bottom:1px solid #2e3358;text-align:left}th{color:#ffd23f;background:#141626}small{color:#8a8fb8}p{color:#c9cbe6;font-size:13px}.bs{display:flex;gap:10px;flex-wrap:wrap;margin:12px 0}.b{background:#141626;border:1px solid #2e3358;border-radius:8px;padding:10px 14px;min-width:140px}.n{font-size:26px;font-weight:700;color:#8ef0a0}</style></head>
<body><h1>Retenção de jogadores</h1><p>Conta quem abriu o modo online (conectou ao servidor). Partidas contra bots só entram quando o jogo conecta.</p>
<div class="bs">${box('voltam no dia seguinte (D1)', 1, '30% ou mais')}${box('voltam após 7 dias (D7)', 7, '10% ou mais')}${box('voltam após 30 dias (D30)', 30, '4% ou mais')}</div>
<table><tr><th>Dia</th><th>Ativos</th><th>Novos</th><th>D1 dos novos</th><th>D7 dos novos</th><th>Min. por jogador</th><th>Partidas</th></tr>${tr}</table></body></html>`;
}

// ---------- funil (anônimo): em que etapa os jogadores novos desistem ----------
// O jogo manda por sendBeacon (POST /ev), mesmo sem estar no online. Uma linha por aparelho, etapa e dia.
const EVS = new Set(['new', 'open', 'tut', 'tut_skip', 'f_start', 'f_end', 'g5']);
const fun = new Map();   // 'pid|ev|dia' -> { pid, ev, day, dirty }
let funLimpo = -1;
async function funLoad() {
  if (!useDb) return;
  try { for (const r of await (await sb('funnel?select=pid,ev,day&day=gte.' + (dayNow() - 60) + '&limit=200000')).json()) fun.set(r.pid + '|' + r.ev + '|' + r.day, { ...r, dirty: false }); console.log('funil: ' + fun.size + ' linhas'); }
  catch (e) { console.error('funnel (rodou o SQL da tabela funnel?)', e.message); }
}
function funAdd(pid, ev) { const d = dayNow(), k = pid + '|' + ev + '|' + d; if (!fun.has(k)) fun.set(k, { pid, ev, day: d, dirty: true }); }
async function funFlush() {
  const velho = dayNow() - 60; for (const [k, e] of fun) if (e.day < velho && !e.dirty) fun.delete(k);
  if (!useDb) return;
  // a política de privacidade promete no máximo 60 dias: apaga do banco uma vez por dia
  if (funLimpo !== dayNow()) { funLimpo = dayNow(); sb('funnel?day=lt.' + velho, { method: 'DELETE' }).catch(e => console.error('funnel limpeza', e.message)); }
  const rows = [...fun.values()].filter(e => e.dirty); if (!rows.length) return;
  try { await sb('funnel', { method: 'POST', headers: { Prefer: 'resolution=ignore-duplicates' }, body: JSON.stringify(rows.map(e => ({ pid: e.pid, ev: e.ev, day: e.day }))) }); rows.forEach(e => e.dirty = false); }
  catch (e) { console.error('funFlush', e.message); }
}
setInterval(funFlush, 5 * 60000);
const evHits = new Map();   // limite por endereço: 120 envios a cada 10 min
setInterval(() => evHits.clear(), 10 * 60000);
function evReq(req, res) {
  const fim = code => { res.writeHead(code, { 'access-control-allow-origin': '*' }); res.end(); };
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',').pop().trim();
  const n = (evHits.get(ip) || 0) + 1; evHits.set(ip, n); if (n > 120) { req.resume(); return fim(429); }
  let body = '', grande = false;
  req.on('data', d => { body += d; if (body.length > 8192) { grande = true; req.destroy(); } });
  req.on('end', () => {
    if (grande) return;
    let o; try { o = JSON.parse(body); } catch (e) { return fim(400); }
    const pid = String(o.p || '');
    if (!/^[a-f0-9]{16,40}$/.test(pid)) return fim(400);
    if (EVS.has(o.e)) funAdd(pid, o.e);
    if (Array.isArray(o.err)) for (const x of o.err.slice(0, 10)) if (x && typeof x === 'object') errAdd(x, '');
    fim(204);
  });
}
function funPage() {
  const today = dayNow(), byPid = new Map();
  for (const e of fun.values()) { let m = byPid.get(e.pid); if (!m) byPid.set(e.pid, m = {}); (m[e.ev] = m[e.ev] || []).push(e.day); }
  const novos = [...byPid.entries()].filter(([, m]) => m.new).map(([pid, m]) => ({ pid, d: Math.min(...m.new), m }));
  const tem = (m, ev) => !!m[ev], voltou = (m, d, k) => (m.open || []).includes(d + k);
  const pct = (a, b) => b ? Math.round(a / b * 100) + '%' : '—';
  const dateOf = d => new Date(d * DAYMS + BRT).toISOString().slice(5, 10).split('-').reverse().join('/');
  const linha = (lab, L, d1ok, d7ok) => { const n = L.length, c = ev => L.filter(x => tem(x.m, ev)).length;
    const r1 = d1ok ? L.filter(x => x.d + 1 <= today) : [], r7 = d7ok ? L.filter(x => x.d + 7 <= today) : [];
    return `<tr><td>${lab}</td><td>${n}</td><td>${pct(c('f_start'), n)}</td><td>${pct(c('f_end'), n)}</td><td>${pct(c('g5'), n)}</td><td>${pct(c('tut_skip'), c('tut'))}</td><td>${r1.length ? pct(r1.filter(x => voltou(x.m, x.d, 1)).length, r1.length) : '…'}</td><td>${r7.length ? pct(r7.filter(x => voltou(x.m, x.d, 7)).length, r7.length) : '…'}</td></tr>`; };
  let tr = linha('<b>Total</b>', novos, true, true);
  for (let d = today; d > today - 21; d--) { const L = novos.filter(x => x.d === d); if (L.length) tr += linha(dateOf(d), L, true, true); }
  const abriram = new Set([...fun.values()].filter(e => e.ev === 'open' && e.day === today).map(e => e.pid)).size;
  return `<!doctype html><html lang="pt-br"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Funil · Duel Legends Arena</title>
<style>body{font-family:system-ui,sans-serif;background:#0b0c14;color:#e8e8f4;margin:16px}h1{color:#ffd23f;font-size:20px}table{border-collapse:collapse;width:100%;font-size:13px}th,td{padding:6px 8px;border-bottom:1px solid #2e3358;text-align:left}th{color:#ffd23f;background:#141626}p{color:#c9cbe6;font-size:13px}</style></head>
<body><h1>Funil de jogadores novos</h1><p>Conta todos os aparelhos novos, com ou sem online (desde a versão 2.5.4). Hoje ${abriram} aparelho(s) abriram o jogo. Cada linha é o grupo que abriu o jogo pela primeira vez naquele dia; as porcentagens são desse grupo.</p>
<table><tr><th>Primeiro dia</th><th>Novos</th><th>Começou a 1ª luta</th><th>Terminou a 1ª</th><th>Chegou à 5ª</th><th>Pulou o tutorial</th><th>Voltou no dia seguinte</th><th>Voltou após 7 dias</th></tr>${tr}</table></body></html>`;
}

// ---------- contas (usuário e senha) ----------
const USER_RE = /^[a-z0-9_.]{3,16}$/;
function hashPass(pass, salt) { salt = salt || crypto.randomBytes(16).toString('hex'); return salt + ':' + crypto.scryptSync(String(pass), salt, 32).toString('hex'); }
function checkPass(pass, stored) { if (!stored) return false; const [salt, h] = stored.split(':'); const a = Buffer.from(hashPass(pass, salt).split(':')[1], 'hex'), b = Buffer.from(h, 'hex'); return a.length === b.length && crypto.timingSafeEqual(a, b); }
const tries = new Map();   // limite de tentativas por endereço e por usuário
function tooMany(k) { const now = Date.now(); const t = (tries.get(k) || []).filter(x => now - x < 10 * 60000); tries.set(k, t); return t.length >= 8; }
function failed(k) { (tries.get(k) || tries.set(k, []).get(k)).push(Date.now()); }
// limpa as tentativas antigas (senão o mapa só cresce)
setInterval(() => { const now = Date.now(); for (const [k, t] of tries) if (!t.some(x => now - x < 10 * 60000)) tries.delete(k); }, 10 * 60000);
async function register(c, user, pass) {
  const p = c.player; if (!p) return send(c, { t: 'auth', err: 'Conecte de novo e tente outra vez.' });
  if (p.login) return send(c, { t: 'auth', err: 'Este jogador já tem conta: ' + p.login });
  user = String(user || '').trim().toLowerCase(); pass = String(pass || '');
  if (!USER_RE.test(user)) return send(c, { t: 'auth', err: 'Usuário: 3 a 16 letras minúsculas, números, _ ou ponto.' });
  if (badName(user)) return send(c, { t: 'auth', err: 'Esse usuário não é permitido. Escolha outro.' });
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
// ---------- excluir conta (exigência da Google Play e da LGPD) ----------
async function deleteAccount(c, pass) {
  const p = c.player; if (!p) return send(c, { t: 'auth', err: 'Conecte-se primeiro.' });
  if (p.login) {
    if (tooMany('u:' + p.login)) return send(c, { t: 'auth', err: 'Muitas tentativas. Espere alguns minutos.' });
    if (!checkPass(pass, p.passh)) { failed('u:' + p.login); return send(c, { t: 'auth', err: 'Senha incorreta.' }); }
  }
  p.deleted = true; players.delete(p.pid); topCache = null;
  for (const k of [...act.keys()]) if (k.startsWith(p.pid + '|')) act.delete(k);
  for (const k of [...fun.keys()]) if (k.startsWith(p.pid + '|')) fun.delete(k);
  if (useDb) { await sb('players?pid=eq.' + encodeURIComponent(p.pid), { method: 'DELETE' }); await sb('activity?pid=eq.' + encodeURIComponent(p.pid), { method: 'DELETE' }); await sb('funnel?pid=eq.' + encodeURIComponent(p.pid), { method: 'DELETE' }).catch(e => console.error('funnel delete', e.message)); }
  for (const o of clients.values()) if (o.player === p) { o.player = null; if (o !== c) send(o, { t: 'auth', expired: true }); }
  console.log('conta excluída', p.login || '(sem login)');
  send(c, { t: 'auth', ok: 'deleted' });
}
// ---------- erros enviados pelos jogos ----------
const errs = new Map();   // mensagem -> { msg, stack, ver, state, n, first, last, dirty }
async function errLoad() {
  if (!useDb) return;
  try { for (const r of await (await sb('client_errors?select=msg,stack,ver,state,n,first_at,last_at&limit=500')).json()) errs.set(r.msg, { msg: r.msg, stack: r.stack, ver: r.ver, state: r.state, n: r.n, first: Date.parse(r.first_at), last: Date.parse(r.last_at), dirty: false }); }
  catch (e) { console.error('client_errors', e.message); }
}
function errAdd(x, ver) {
  const msg = String(x.m || '').slice(0, 200); if (!msg) return;
  if (!errs.has(msg) && errs.size >= 300) return;   // limite: no máximo 300 erros diferentes guardados
  const e = errs.get(msg) || { msg, stack: '', ver: '', state: '', n: 0, first: Date.now() };
  e.n += Math.max(1, Math.min(50, x.n | 0)); e.stack = String(x.s || '').slice(0, 800); e.ver = String(ver || '').slice(0, 8); e.state = String(x.w || '').slice(0, 20); e.last = Date.now(); e.dirty = true; errs.set(msg, e);
}
async function errFlush() {
  if (!useDb) return;
  const rows = [...errs.values()].filter(e => e.dirty); if (!rows.length) return;
  try { await sb('client_errors', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify(rows.map(e => ({ msg: e.msg, stack: e.stack, ver: e.ver, state: e.state, n: e.n, first_at: new Date(e.first).toISOString(), last_at: new Date(e.last).toISOString() }))) }); rows.forEach(e => e.dirty = false); }
  catch (e) { console.error('errFlush', e.message); }
}
setInterval(errFlush, 5 * 60000);
function errPage() {
  const esc = x => String(x).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  const when = t => new Date(t - 3 * 3600000).toISOString().slice(0, 16).replace('T', ' ');
  const rows = [...errs.values()].sort((a, b) => b.last - a.last).slice(0, 100);
  const tr = rows.map(e => `<tr><td><b>${esc(e.msg)}</b><pre>${esc(e.stack)}</pre></td><td>${e.n}</td><td>${esc(e.ver)}</td><td>${esc(e.state)}</td><td>${when(e.last)}</td></tr>`).join('');
  return `<!doctype html><html lang="pt-br"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Erros · Duel Legends Arena</title>
<style>body{font-family:system-ui,sans-serif;background:#0b0c14;color:#e8e8f4;margin:16px}h1{color:#ffd23f;font-size:20px}table{border-collapse:collapse;width:100%;font-size:13px}th,td{padding:6px 8px;border-bottom:1px solid #2e3358;text-align:left;vertical-align:top}th{color:#ffd23f;background:#141626}pre{white-space:pre-wrap;color:#8a8fb8;font-size:11px;margin:4px 0 0}p{color:#c9cbe6;font-size:13px}</style></head>
<body><h1>Erros nos aparelhos dos jogadores</h1><p>${rows.length ? 'Mais recentes primeiro. "Vezes" soma todos os aparelhos.' : 'Nenhum erro registrado. Ótimo sinal!'}</p>
<table><tr><th>Erro</th><th>Vezes</th><th>Versão</th><th>Tela</th><th>Último (Brasília)</th></tr>${tr}</table></body></html>`;
}
let topCache = null, topT = 0;
async function topList() {
  if (topCache && Date.now() - topT < 20000) return topCache;
  let list;
  if (useDb) list = (await (await sb('players?select=pid,name,rank,score&score=gte.0&order=score.desc&limit=80')).json()).filter(p => (p.rank.season || 1) === seasonNow()).slice(0, 50);
  else list = [...players.values()].map(p => ({ pid: p.pid, name: p.name, rank: p.rank, score: rankScore(p.rank) })).filter(p => p.score >= 0 && (p.rank.season || 1) === seasonNow()).sort((a, b) => b.score - a.score).slice(0, 50);
  let total = list.length;
  if (useDb) { const res = await sb('players?select=pid&score=gte.0&limit=1', { headers: { Prefer: 'count=exact' } }); total = Number((res.headers.get('content-range') || '').split('/')[1]) || list.length; }
  topCache = { list: list.map(p => ({ pid: p.pid, n: p.name, i: (p.rank.prof && p.rank.prof.icon) || '', r: { tier: p.rank.tier, div: p.rank.div, lp: p.rank.lp } })), total }; topT = Date.now();
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
  const [a, b] = Object.keys(M.mmr); let ok = a in M.rep && b in M.rep && M.rep[a] !== M.rep[b];
  // sem resultado combinado e só um saiu da partida: quem saiu perde (senão bastava fechar o jogo para nunca perder PDL)
  // (se quem ficou já informou o resultado, vale o dele: o vencedor pode fechar o jogo logo depois de vencer)
  if (!ok && M.left && !!M.left[a] !== !!M.left[b]) {
    const fled = M.left[a] ? a : b, stay = fled === a ? b : a, stayWon = stay in M.rep ? M.rep[stay] : true;
    M.rep = { [stay]: stayWon, [fled]: !stayWon }; ok = true;
  }
  for (const pid of [a, b]) {
    const c = M.conns[pid]; if (c) c.match = null;
    if (!ok) { if (c && !c.closed) send(c, { t: 'rankres', void: true, msg: 'Resultado não confirmado: partida sem PDL.' }); continue; }
    const p = players.get(pid); if (!p) continue;
    seasonRoll(p);
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
    if (op === 0x9) { if (payload.length > 125) continue; try { c.sock.write(Buffer.concat([Buffer.from([0x8a, payload.length]), payload])); } catch (e) {} continue; }
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
  actSecs(c);
  clients.delete(c.id);
  quickQueue = quickQueue.filter(q => q !== c);
  rankQueue = rankQueue.filter(q => q.c !== c);
  if (c.match && !c.match.done) { const M = c.match; if (c.player) M.left[c.player.pid] = true; clearTimeout(M.timer); M.timer = setTimeout(() => settle(M), 20000); }
  leaveRoom(c);
}

// ---------- salas ----------
function roomInfo(r) {
  return { id: r.id, name: r.name, mode: r.mode, players: r.slots.filter(s => s).length, max: r.max, locked: !!r.pass, status: r.status };
}
function roomState(r) {
  return {
    t: 'room', id: r.id, name: r.name, mode: r.mode, host: r.host, status: r.status, max: r.max, locked: !!r.pass, code: r.code || '',
    slots: r.slots.map((s, i) => s ? { pid: s.id, name: s.name, title: s.title || '', icon: s.icon || '', team: teamOf(r, i), ready: !!r.ready[s.id] } : null),
  };
}
function teamOf(r, slot) { return r.mode === 'ffa' ? slot : slot % 2; }
function broadcastRoom(r, obj, except) { for (const s of r.slots) if (s && s !== except) send(s, obj); }
function pushRoom(r) { broadcastRoom(r, roomState(r)); }
function listMsg() { return { t: 'rooms', rooms: [...rooms.values()].filter(r => !r.quick).map(roomInfo), online: clients.size }; }
function pushList() {
  const list = listMsg();
  for (const c of clients.values()) if (!c.room) send(c, list);
}
// código de convite da sala (5 letras sem caracteres confusos); quem tem o código entra sem senha
const CODE_ABC = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function newCode() { let k; do { k = ''; for (let i = 0; i < 5; i++) k += CODE_ABC[crypto.randomInt(CODE_ABC.length)]; } while ([...rooms.values()].some(r => r.code === k)); return k; }
function createRoom(c, name, mode, pass, quick) {
  if (!MAX[mode]) mode = '1x1';
  name = String(name || 'Sala').slice(0, 24); if (badName(name)) name = 'Sala de ' + (c.name || 'Jogador');
  const r = { id: 'S' + (nextId++), name, mode, pass: pass ? String(pass).slice(0, 16) : '', max: MAX[mode],
    slots: new Array(MAX[mode]).fill(null), ready: {}, host: c.id, status: 'lobby', quick: !!quick, prep: null, gears: {}, cos: {}, code: quick ? '' : newCode() };
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
  if (r.status !== 'lobby') { broadcastRoom(r, { t: 'aborted', msg: c.id === r.host ? 'O dono da sala saiu. Partida encerrada.' : `${c.name} saiu da partida.` }); r.status = 'lobby'; r.ready = {}; r.prep = null; clearTimeout(r.rpickTimer); r.rpick = null; }
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
      const M = { id: r.id + ':' + r.seed, mmr: {}, rep: {}, conns: {}, left: {}, done: false };
      for (const s of people) { M.mmr[s.player.pid] = s.player.rank.mmr; M.conns[s.player.pid] = s; s.match = M; }
      M.timer = setTimeout(() => settle(M), 15 * 60000);
      matches.set(M.id, M);
    }
  }
  if (r.ranked) { r.rpick = {}; r.rpickTimer = setTimeout(() => rpickDone(r), RPICK_TIME); }
  r.prep = { ready: {}, timer: setTimeout(() => goRoom(r), PREP_TIME + 9000 + (r.ranked ? RPICK_TIME : 0)) };
  pushList();
}
// ranqueada: cada um escolhe 1 de 3 lendas; as escolhas só aparecem quando os dois escolheram
function rpickDone(r) {
  if (!r.rpick || r.rpick.done) return;
  clearTimeout(r.rpickTimer);
  const picks = {}; r.slots.forEach((s, i) => { picks[i] = r.rpick[i] == null ? 0 : r.rpick[i]; });
  r.rpick = { done: true }; broadcastRoom(r, { t: 'rpick', picks });
}
function goRoom(r) {
  if (!r.prep || r.status === 'fight') return;
  clearTimeout(r.prep.timer); r.prep = null; r.status = 'fight';
  broadcastRoom(r, { t: 'go', gears: r.gears, cos: r.cos });
  pushList();
}

// ---------- mensagens ----------
function handle(c, m) {
  if (['quickmatch', 'rankqueue', 'create', 'join', 'joincode', 'challenge'].includes(m.t) && (c.ver || 0) < MIN_VER) { send(c, { t: 'error', msg: 'Jogo desatualizado: recarregue a página para jogar online.' }); return; }
  switch (m.t) {
    case 'hello':
      c.name = String(m.name || 'Jogador').replace(/[^\p{L}\p{N} _.-]/gu, '').slice(0, 16) || 'Jogador';
      c.badName = badName(c.name);
      if (c.badName) { c.name = 'Jogador' + (1000 + (c.id * 7919) % 9000); send(c, { t: 'error', msg: 'Esse nome não é permitido. Escolha outro.' }); }
      c.ver = parseFloat(m.ver) || 0;
      c.icon = /^[a-z0-9_]{1,24}$/i.test(String(m.icon || '')) ? String(m.icon) : '';
      c.title = String(m.title || '').replace(/[^\p{L}\p{N} _.-]/gu, '').slice(0, 28);
      send(c, { t: 'welcome', id: c.id, ver: VERSION, quick: QUICK, now: Date.now() });
      if (m.pid) identify(c, m.pid, m.key).catch(e => { console.error('identify', e.message); send(c, { t: 'error', msg: 'Ranqueada indisponível agora.' }); });
      else if (c.player) c.name = c.player.name || c.name;
      if (c.room) pushRoom(c.room);
      pushList();
      break;
    case 'list': send(c, listMsg()); break;
    case 'create': { const r = createRoom(c, m.name, m.mode, m.pass); joinRoom(c, r, 0); break; }
    case 'join': {
      const r = rooms.get(m.id);
      if (!r) return send(c, { t: 'error', msg: 'Sala não existe mais' });
      if (r.status !== 'lobby') return send(c, { t: 'error', msg: 'A partida já começou' });
      if (r.pass && tooMany('rp:' + c.ip)) return send(c, { t: 'error', msg: 'Muitas tentativas. Espere alguns minutos.' });
      if (r.pass && r.pass !== String(m.pass || '')) { failed('rp:' + c.ip); return send(c, { t: 'error', msg: 'Senha errada' }); }
      joinRoom(c, r);
      break;
    }
    case 'joincode': {
      const k = String(m.code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (tooMany('jc:' + c.ip)) return send(c, { t: 'error', msg: 'Muitas tentativas. Espere alguns minutos.' });
      const r = [...rooms.values()].find(x => x.code && x.code === k);
      if (!r) { failed('jc:' + c.ip); return send(c, { t: 'error', msg: 'Código não encontrado. A sala pode ter fechado.' }); }
      if (r.status !== 'lobby') return send(c, { t: 'error', msg: 'A partida dessa sala já começou' });
      if (r.slots.every(x => x)) return send(c, { t: 'error', msg: 'A sala está cheia' });
      if (c.room) leaveRoom(c);
      joinRoom(c, r);
      break;
    }
    case 'leave': leaveRoom(c); send(c, listMsg()); break;
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
      if (!c.player.login) { send(c, { t: 'error', msg: 'Crie uma conta para jogar a ranqueada.' }); return; }
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
    case 'rpick': {
      const r = c.room; if (!r || !r.rpick || r.rpick.done) return;
      r.rpick[c.slot] = Math.max(0, Math.min(2, m.i | 0));
      if (r.slots.every((s, i) => !s || r.rpick[i] != null)) rpickDone(r);
      break;
    }
    case 'challenge': {
      // desafiar alguém pelo nome (revanche ou rival recente); quem recebe aceita desafiando de volta
      const nm = String(m.name || '').slice(0, 16);
      const o = [...clients.values()].find(x => x !== c && !x.closed && x.name === nm && x.player);
      if (!o) { send(c, { t: 'error', msg: `${nm} não está online agora.` }); break; }
      if (o.room) { send(c, { t: 'error', msg: `${nm} está numa partida. Tente daqui a pouco.` }); break; }
      if (o.chal && o.chal.to === c.id && Date.now() - o.chal.t < 60000) {
        o.chal = null; c.chal = null; if (c.room) leaveRoom(c);
        quickQueue = quickQueue.filter(q => q !== c && q !== o); rankQueue = rankQueue.filter(q => q.c !== c && q.c !== o);
        const r = createRoom(o, 'Desafio', '1x1', '', true); joinRoom(o, r, 0); joinRoom(c, r, 1);
        r.ready[c.id] = true; r.ready[o.id] = true; startRoom(r); break;
      }
      if (tooMany('chal:' + c.id)) { send(c, { t: 'error', msg: 'Espere um pouco antes de desafiar de novo.' }); break; }
      failed('chal:' + c.id);
      c.chal = { to: o.id, t: Date.now() };
      send(o, { t: 'challenge', from: c.name }); send(c, { t: 'chalsent', to: o.name });
      break;
    }
    case 'delacc': deleteAccount(c, m.pass).catch(e => { console.error('delacc', e.message); send(c, { t: 'auth', err: 'Não deu para excluir agora. Tente de novo.' }); }); break;
    case 'err': {
      if (tooMany('err:' + (c.ip || '?'))) break; failed('err:' + (c.ip || '?'));
      for (const x of (Array.isArray(m.list) ? m.list.slice(0, 10) : [])) errAdd(x, c.ver);
      break;
    }
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
    case 'report': report(c, m.pid, m.reason).catch(e => console.error('report', e.message)); break;
    case 'stat': {
      // resultados das partidas (inclusive contra bots, enviados quando o jogo conecta)
      const list = Array.isArray(m.list) ? m.list.slice(0, 60) : [];
      if (tooMany('stat:' + (c.ip || '?'))) break; failed('stat:' + (c.ip || '?'));
      for (const x of list) balAdd(String(x.c || ''), String(x.m || ''), !!x.w);
      if (c.player && list.length) { const e = actRow(c.player.pid); e.games += list.length; e.dirty = true; }
      break;
    }
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
  if (req.method === 'OPTIONS') { res.writeHead(204, { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'POST', 'access-control-allow-headers': 'content-type' }); res.end(); return; }
  if (req.method === 'POST' && req.url.split('?')[0] === '/ev') { evReq(req, res); return; }
  if (req.url === '/status') {
    res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' });
    res.end(JSON.stringify({ ok: true, ver: VERSION, players: clients.size, rooms: rooms.size, db: useDb }));
    return;
  }
  // páginas internas: só com ?k=<ADMIN_KEY> (variável no Render). Sem a variável, ficam desligadas.
  const rota = req.url.split('?')[0];
  if (['/erros', '/retencao', '/balanceamento', '/funil'].includes(rota)) {
    const k = new URL(req.url, 'http://x').searchParams.get('k') || '';
    const ADMIN = process.env.ADMIN_KEY || '';
    const kb = Buffer.from(k), ab = Buffer.from(ADMIN);
    const ok = ab.length >= 12 && kb.length === ab.length && crypto.timingSafeEqual(kb, ab);
    if (!ok) { res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }); res.end('Não encontrado'); return; }
  }
  if (req.url.split('?')[0] === '/erros') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end(errPage());
    return;
  }
  if (req.url.split('?')[0] === '/retencao') {
    actFlush().finally(() => { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end(retPage()); });
    return;
  }
  if (rota === '/funil') { funFlush().finally(() => { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end(funPage()); }); return; }
  if (req.url.split('?')[0] === '/balanceamento') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(balPage());
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
  // o proxy do Render acrescenta o endereço real no FIM do X-Forwarded-For; o começo pode ser escrito pelo próprio cliente
  const c = { id: nextId++, ip: String(req.headers['x-forwarded-for'] || sock.remoteAddress || '').split(',').pop().trim(), sock, buf: Buffer.alloc(0), name: 'Jogador', room: null, slot: -1, closed: false, alive: true };
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
server.listen(PORT, () => { console.log(`Duel Legends Arena — servidor v${VERSION} na porta ${PORT}`); balLoad(); actLoad(); errLoad(); funLoad(); });
process.on('SIGTERM', () => { Promise.all([balFlush(), actFlush(), errFlush(), funFlush()]).finally(() => process.exit(0)); });
