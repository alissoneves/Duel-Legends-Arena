// ---------- LENDA DA SEMANA ----------
// muda toda segunda-feira 00h (horário de Brasília); igual para todos os jogadores
const DAY=86400000,WEEK=7*DAY,BRT=3*3600000;
function nowT(){return Date.now()+(NET.tOff||0);}
function weekIdx(t){return Math.floor((((t===undefined?nowT():t))-BRT-4*DAY)/WEEK);}
function weekLegend(w){w=w===undefined?weekIdx():w;const n=w<2968?108:CHARS.length;return CHARS[(((w*41+7)%n)+n)%n];}
const WEEK_BONUS=0.3;
function weekLeft(){const t=nowT(),end=(weekIdx(t)+1)*WEEK+BRT+4*DAY,d=end-t;const dd=Math.floor(d/DAY),hh=Math.floor(d%DAY/3600000);return dd>0?`${dd}d ${hh}h`:`${hh}h ${Math.floor(d%3600000/60000)}min`;}