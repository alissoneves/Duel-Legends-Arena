// Lê as lendas direto do jogo (src/js/03-personagens.js), sem dependências.
const fs = require('fs');
const path = require('path');

const ARQUIVO = path.join(__dirname, '..', 'src', 'js', '03-personagens.js');

function carregarLendas() {
  const texto = fs.readFileSync(ARQUIVO, 'utf8');
  const marca = 'const DATA=';
  const inicio = texto.indexOf(marca);
  const fim = inicio < 0 ? -1 : texto.indexOf('];', inicio);
  try {
    if (fim < 0) throw new Error();
    const lendas = JSON.parse(texto.slice(inicio + marca.length, fim + 1));
    if (!Array.isArray(lendas) || !lendas.length) throw new Error();
    return lendas;
  } catch {
    throw new Error('Não consegui ler o DATA de src/js/03-personagens.js');
  }
}

function indiceDa(nome, lendas = carregarLendas()) {
  const i = lendas.findIndex(l => l.n === nome);
  if (i < 0) throw new Error(`Lenda não encontrada: ${nome}`);
  return i;
}

function numeroDa(nome) {
  return indiceDa(nome) + 1;
}

function acharLenda(nome) {
  const lendas = carregarLendas();
  return lendas[indiceDa(nome, lendas)];
}

module.exports = { carregarLendas, numeroDa, acharLenda };
