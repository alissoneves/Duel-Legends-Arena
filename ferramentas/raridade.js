// Compara atributos de lendas por raridade.
// Uso: node ferramentas/raridade.js <Raridade> [ATQ DEF VEL ESP ESQ]
const { carregarLendas } = require('./dados');

const SOMA_PADRAO = 375; // todas as lendas do jogo somam 375 (ATQ+DEF+VEL+ESP+ESQ)
const soma = s => s.reduce((a, b) => a + b, 0);
const distancia = (a, b) => Math.hypot(...a.map((v, i) => v - b[i]));

function resumoRaridade(lendas) {
  const grupos = {};
  for (const l of lendas) (grupos[l.r] = grupos[l.r] || []).push(l);
  const resumo = {};
  for (const [r, ls] of Object.entries(grupos)) {
    const somas = ls.map(l => soma(l.s));
    resumo[r] = {
      qtd: ls.length,
      mediaSoma: Math.round(soma(somas) / ls.length),
      min: Math.min(...somas),
      max: Math.max(...somas),
      media: [0, 1, 2, 3, 4].map(i => Math.round(soma(ls.map(l => l.s[i])) / ls.length)),
    };
  }
  return resumo;
}

function maisProximas(lendas, raridade, atributos, qtd = 3) {
  const alvo = soma(atributos);
  return lendas.filter(l => l.r === raridade)
    .sort((a, b) => Math.abs(soma(a.s) - alvo) - Math.abs(soma(b.s) - alvo) || distancia(a.s, atributos) - distancia(b.s, atributos))
    .slice(0, qtd);
}

if (require.main === module) {
  const [raridade, ...nums] = process.argv.slice(2);
  const lendas = carregarLendas();
  const resumo = resumoRaridade(lendas);
  const x = resumo[raridade];
  if (!x) {
    console.error(`Raridade inválida. Use uma destas: ${Object.keys(resumo).join(', ')}`);
    process.exit(1);
  }
  console.log(`${raridade}: ${x.qtd} lendas · soma média ${x.mediaSoma} (mín ${x.min}, máx ${x.max})`);
  console.log(`Média por atributo: ATQ ${x.media[0]} · DEF ${x.media[1]} · VEL ${x.media[2]} · ESP ${x.media[3]} · ESQ ${x.media[4]}`);
  if (nums.length) {
    const atr = nums.map(Number);
    if (atr.length !== 5 || atr.some(Number.isNaN)) {
      console.error('Passe os 5 atributos: ATQ DEF VEL ESP ESQ');
      process.exit(1);
    }
    console.log(`Proposta: soma ${soma(atr)}` + (soma(atr) === SOMA_PADRAO ? ' (ok)' : ` — ATENÇÃO: todas as lendas somam ${SOMA_PADRAO}`));
    for (const l of maisProximas(lendas, raridade, atr)) console.log(`  parecida: ${l.n} [${l.s.join(', ')}] soma ${soma(l.s)}`);
  }
}

module.exports = { resumoRaridade, maisProximas, SOMA_PADRAO };
