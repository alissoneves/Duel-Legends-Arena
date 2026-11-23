const test = require('node:test');
const assert = require('node:assert');
const { carregarLendas, numeroDa, acharLenda } = require('../dados');

test('lê as 110 lendas do jogo', () => {
  assert.strictEqual(carregarLendas().length, 110);
});

test('número da lenda é a posição + 1 (o "Lenda nº" dos posts)', () => {
  assert.strictEqual(numeroDa('Saci'), 35);
  assert.strictEqual(numeroDa('Iara'), 37);
  assert.strictEqual(numeroDa('Zeus'), 22);
});

test('acha lendas com acento e vírgula no nome', () => {
  assert.strictEqual(acharLenda('Cabeça de Cuia').e, 'Água');
  assert.strictEqual(acharLenda('Nerojor, The Knight').r, 'Épico');
});

test('lenda que não existe dá erro claro', () => {
  assert.throws(() => acharLenda('Ninguém'), /Lenda não encontrada: Ninguém/);
  assert.throws(() => numeroDa('Ninguém'), /Lenda não encontrada: Ninguém/);
});
