const test = require('node:test');
const assert = require('node:assert');
const { carregarLendas } = require('../dados');
const { resumoRaridade, maisProximas, SOMA_PADRAO } = require('../raridade');

const resumo = resumoRaridade(carregarLendas());

test('conta as lendas de cada raridade', () => {
  const qtd = Object.fromEntries(Object.entries(resumo).map(([r, x]) => [r, x.qtd]));
  assert.deepStrictEqual(qtd, { Comum: 38, Raro: 33, 'Épico': 25, 'Lendário': 14 });
});

test('média da soma fica entre o mínimo e o máximo', () => {
  for (const x of Object.values(resumo)) {
    assert.ok(x.min <= x.mediaSoma && x.mediaSoma <= x.max);
    assert.strictEqual(x.media.length, 5);
  }
});

test('acha as 3 lendas de perfil mais parecido na mesma raridade', () => {
  const p = maisProximas(carregarLendas(), 'Raro', [80, 70, 70, 80, 75]);
  assert.strictEqual(p.length, 3);
  assert.ok(p.every(l => l.r === 'Raro'));
  assert.strictEqual(p[0].n, 'Cabeça de Cuia');
});

test('toda lenda do jogo soma 375 (regra de equilíbrio)', () => {
  assert.strictEqual(SOMA_PADRAO, 375);
  for (const l of carregarLendas()) assert.strictEqual(l.s.reduce((a, b) => a + b, 0), SOMA_PADRAO, l.n);
});
