// Gera as legendas do Instagram no estilo das postagens já publicadas.
// Uso:
//   node ferramentas/insta/legenda.js lenda <post> "<Nome>" <base|mito|br> [longa|curta] ["origem"]
//   node ferramentas/insta/legenda.js confronto "<A>" "<B>"
const { acharLenda, numeroDa } = require('../dados');

const EMOJI = {
  'Água': '🌊', 'Luz': '☀️', 'Elétrico': '⚡', 'Elfo': '🍃', 'Fogo': '🔥', 'Terra': '⛰️', 'Natureza': '🌿',
  'Trevas': '🌑', 'Humano': '⚔️', 'Neutro': '🎲', 'Gelo': '❄️', 'Vampiro': '🦇', 'Máquina': '⚙️',
};

const TAGS_BASE = '#DuelLegendsArena #LendaDoDia #pixelart #indiegame #jogoindie #gamedevbrasil #jogobrasileiro';
const TAGS = { base: TAGS_BASE, mito: `${TAGS_BASE} #mitologia #lendas`, br: `${TAGS_BASE} #culturabrasileira` };
const CHAMADA = { longa: 'Conta aqui nos comentários! 👇', curta: 'Conta aqui! 👇' };
const TAGS_VIDEO = '#DuelLegendsArena #jogoindie #pixelart #gamedevbrasil #indiegame';

// Golpe com descrição quando o jogo tem uma (texto depois dos dois-pontos).
function golpe(texto) {
  const i = texto.indexOf(':');
  const nome = (i < 0 ? texto : texto.slice(0, i)).trim();
  const desc = i < 0 ? '' : texto.slice(i + 1).trim();
  return desc ? `${nome} — ${desc}` : nome;
}

// opcoes.chamada: 'longa' (padrão) ou 'curta'
// opcoes.origem: texto opcional na linha da raridade (ex.: 'Mitologia nórdica', 'Criação original')
function legendaLenda(post, nome, grupo, { chamada = 'longa', origem = '' } = {}) {
  const l = acharLenda(nome);
  if (!TAGS[grupo]) throw new Error('Grupo deve ser base, mito ou br');
  if (!CHAMADA[chamada]) throw new Error('Chamada deve ser longa ou curta');
  const emoji = EMOJI[l.e];
  if (!emoji) throw new Error(`Elemento sem emoji: ${l.e}`);
  const [atq, def, vel, esp, esq] = l.s;
  return [
    `LENDA DO DIA #${post} ✨`,
    `${emoji} Lenda nº ${numeroDa(nome)}: ${nome}!`,
    [l.r, l.e, origem].filter(Boolean).join(' · '),
    '',
    `A · ${golpe(l.p[0])}`,
    `B · ${golpe(l.p[1])}`,
    `C · ${golpe(l.p[2])}`,
    '',
    `ATQ ${atq} · DEF ${def} · VEL ${vel} · ESP ${esp} · ESQ ${esq}`,
    '',
    `No Duel Legends Arena você não escolhe: o lutador é sorteado. Já tirou ${nome}? ${CHAMADA[chamada]}`,
    '🎮 Jogue no navegador: link na bio',
    '',
    TAGS[grupo],
  ].join('\n');
}

function legendaConfronto(a, b) {
  return [
    `⚔️ ${a} x ${b}! Quem vence essa luta?`,
    'Quem você acha que vence? Comenta aí 👇',
    '',
    '🎮 Jogue grátis no navegador: link na bio',
    '',
    TAGS_VIDEO,
  ].join('\n');
}

function grupoDaLegenda(texto) {
  const tags = texto.split('\n').at(-1);
  if (tags.includes('#mitologia')) return 'mito';
  if (tags.includes('#culturabrasileira')) return 'br';
  return 'base';
}

function chamadaDaLegenda(texto) {
  return texto.includes(CHAMADA.longa) ? 'longa' : 'curta';
}

function origemDaLegenda(texto) {
  return texto.split('\n')[2].split(' · ')[2] || '';
}

if (require.main === module) {
  const [tipo, ...args] = process.argv.slice(2);
  try {
    if (tipo === 'lenda') console.log(legendaLenda(Number(args[0]), args[1], args[2], { chamada: args[3] || 'longa', origem: args[4] || '' }));
    else if (tipo === 'confronto') console.log(legendaConfronto(args[0], args[1]));
    else throw new Error('Use: lenda <post> "<Nome>" <base|mito|br> [longa|curta] ["origem"]  ou  confronto "<A>" "<B>"');
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}

module.exports = { legendaLenda, legendaConfronto, grupoDaLegenda, chamadaDaLegenda, origemDaLegenda };
