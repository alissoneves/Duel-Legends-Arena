const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { legendaLenda, legendaConfronto, grupoDaLegenda, chamadaDaLegenda, origemDaLegenda } = require('../insta/legenda');

const calendario = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'insta', 'calendario.json'), 'utf8'));
const posts = calendario.flatMap(d => ['09:00', '15:00', '18:00'].map(h => ({ dia: d.dia, h, ...d[h] })));

test('as legendas de lenda do calendário saem idênticas', () => {
  const lendas = posts.filter(p => p.tipo === 'lenda');
  assert.ok(lendas.length >= 60);
  for (const p of lendas) assert.strictEqual(legendaLenda(p.n, p.nome, grupoDaLegenda(p.legenda), { chamada: chamadaDaLegenda(p.legenda), origem: origemDaLegenda(p.legenda) }), p.legenda, `post #${p.n} ${p.nome}`);
});

test('chamada longa é o padrão (estilo das 3 primeiras postagens)', () => {
  assert.match(legendaLenda(2, 'Iara', 'base'), /Conta aqui nos comentários! 👇/);
  assert.match(legendaLenda(2, 'Iara', 'base', { chamada: 'curta' }), /Já tirou Iara\? Conta aqui! 👇/);
  assert.throws(() => legendaLenda(2, 'Iara', 'base', { chamada: 'média' }), /Chamada deve ser longa ou curta/);
});

test('origem opcional entra na linha da raridade', () => {
  assert.match(legendaLenda(27, 'Valquíria', 'mito', { origem: 'Mitologia nórdica' }), /\nLendário · Luz · Mitologia nórdica\n/);
  assert.match(legendaLenda(27, 'Valquíria', 'mito'), /\nLendário · Luz\n/);
});

test('legenda de confronto igual à de Curupira x Medusa', () => {
  const p = posts.find(x => x.dia === '2026-11-24' && x.h === '15:00');
  assert.strictEqual(legendaConfronto('Curupira', 'Medusa'), p.legenda);
});

test('lenda inexistente e grupo inválido dão erro claro', () => {
  assert.throws(() => legendaLenda(1, 'Ninguém', 'base'), /Lenda não encontrada/);
  assert.throws(() => legendaLenda(1, 'Saci', 'outro'), /Grupo deve ser base, mito ou br/);
});
