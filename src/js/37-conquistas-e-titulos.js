// ---------- CONQUISTAS E TÍTULOS ----------
function stx(){return save.st||(save.st={kos:0,spec:0,perf:0,dodge:0,ffa:0,tour:0,online:0,miss:0,winsBy:{},winsVs:{},elWins:{}});}
const ELS_ALL=['Fogo','Água','Gelo','Luz','Trevas','Vampiro','Natureza','Elfo','Terra','Humano','Máquina','Elétrico','Neutro'];
const bestBy=()=>{let b=null,n=0;for(const [k,v] of Object.entries(stx().winsBy))if(v>n){n=v;b=k;}return {id:b,n};};
const charName=id=>{const c=CHARS.find(x=>x.id===id);return c?c.name:'?';};
const ACH=[
 {k:'w1',n:'Primeira vitória',d:'Vença 1 partida',ti:'Novato da Arena',v:()=>save.wins||0,goal:1},
 {k:'w10',n:'Duelista',d:'Vença 10 partidas',ti:'Duelista',v:()=>save.wins||0,goal:10},
 {k:'w50',n:'Veterano',d:'Vença 50 partidas',ti:'Veterano',v:()=>save.wins||0,goal:50},
 {k:'w200',n:'Lenda viva',d:'Vença 200 partidas',ti:'Lenda Viva',v:()=>save.wins||0,goal:200},
 {k:'g100',n:'Incansável',d:'Jogue 100 partidas',ti:'Incansável',v:()=>save.games||0,goal:100},
 {k:'c25',n:'Colecionador',d:'Descubra 25 lendas',ti:'Colecionador',v:()=>Object.keys(save.seen).length,goal:25},
 {k:'c60',n:'Curador',d:'Descubra 60 lendas',ti:'Curador',v:()=>Object.keys(save.seen).length,goal:60},
 {k:'c108',n:'Enciclopédia',d:'Descubra todas as lendas',ti:'Enciclopédia das Lendas',v:()=>Object.keys(save.seen).length,goal:110},
 {k:'ko100',n:'Derrubador',d:'Derrube 100 lendas',ti:'Derrubador',v:()=>stx().kos,goal:100},
 {k:'pf50',n:'Muralha',d:'Faça 50 bloqueios perfeitos',ti:'Muralha',v:()=>stx().perf,goal:50},
 {k:'dg200',n:'Intocável',d:'Esquive 200 vezes',ti:'Intocável',v:()=>stx().dodge,goal:200},
 {k:'sp100',n:'Especialista',d:'Acerte 100 especiais',ti:'Mestre dos Especiais',v:()=>stx().spec,goal:100},
 {k:'ffa10',n:'Último de pé',d:'Vença 10 Todos contra Todos',ti:'Último de Pé',v:()=>stx().ffa,goal:10},
 {k:'tour1',n:'Campeão',d:'Vença um torneio',ti:'Campeão',v:()=>stx().tour,goal:1},
 {k:'tour5',n:'Dinastia',d:'Vença 5 torneios',ti:'Dinastia',v:()=>stx().tour,goal:5},
 {k:'on20',n:'Conectado',d:'Jogue 20 partidas online',ti:'Conectado',v:()=>stx().online,goal:20},
 {k:'saci',n:'Caçador de Sacis',d:'Vença 10 partidas contra o Saci',ti:'Caçador de Sacis',v:()=>stx().winsVs.saci||0,goal:10},
 {k:'zeus',n:'Desafiou o Olimpo',d:'Vença 10 partidas contra Zeus',ti:'Desafiante do Olimpo',v:()=>stx().winsVs.zeus||0,goal:10},
 {k:'one100',n:'Alma gêmea',d:'Vença 100 partidas com a mesma lenda',ti:()=>'Mestre de '+charName(bestBy().id),v:()=>bestBy().n,goal:100},
 {k:'els',n:'Senhor dos elementos',d:'Vença com lendas de todos os 13 elementos',ti:'Senhor dos Elementos',v:()=>Object.keys(stx().elWins).length,goal:13},
 {k:'gold',n:'Dourado',d:'Chegue ao Ouro na ranqueada',ti:'Dourado',v:()=>Math.max(save.rank.peak||-1,rankScore(save.rank))>=1200?1:0,goal:1},
 {k:'dia',n:'Diamante bruto',d:'Chegue ao Diamante na ranqueada',ti:'Diamante Bruto',v:()=>Math.max(save.rank.peak||-1,rankScore(save.rank))>=2400?1:0,goal:1},
 {k:'des',n:'Topo do mundo',d:'Chegue a Desafiante',ti:'Desafiante',v:()=>Math.max(save.rank.peak||-1,rankScore(save.rank))>=3300?1:0,goal:1},
 {k:'m30',n:'Dedicado',d:'Resgate 30 missões diárias',ti:'Dedicado',v:()=>stx().miss,goal:30},
];
const achTitle=a=>typeof a.ti==='function'?a.ti():a.ti;
function achCheck(){save.ach=save.ach||{};const got=[];for(const a of ACH)if(!save.ach[a.k]&&a.v()>=a.goal){save.ach[a.k]=Date.now();got.push(a);}if(got.length)persist();return got;}
let ACHP={page:0,toast:null,toastT:0};
function achToast(list){if(list&&list.length){ACHP.toast=list.map(a=>a.n).join(' · ');ACHP.toastT=performance.now();}}
function drawAchToast(){if(!ACHP.toast)return;const e=(performance.now()-ACHP.toastT)/1000;if(e>4){ACHP.toast=null;return;}const y=e<0.3?-24+e/0.3*30:e>3.6?6-(e-3.6)/0.4*30:6;
 ctx.fillStyle='#0b0c14';ctx.fillRect(W/2-150,y-2,300,24);ctx.fillStyle='#ffd23f';ctx.fillRect(W/2-148,y,296,20);text('CONQUISTA: '+ACHP.toast,W/2,y+13,7,'#0b0c14','center');}