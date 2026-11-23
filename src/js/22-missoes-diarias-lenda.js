// ---------- MISSÕES DIÁRIAS + LENDA DO FIM DE SEMANA ----------
function dayIdx(t){return Math.floor(((t===undefined?nowT():t)-BRT)/DAY);}
function weekDay(t){return ((dayIdx(t)+3)%7+7)%7;}   // 0 = segunda … 5 = sábado, 6 = domingo
function rng(seed){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
const MEL=['Fogo','Água','Gelo','Luz','Trevas','Natureza','Terra','Elétrico','Humano'];
const MPOOL=[
 {k:'win',n:[2,3],txt:n=>`Vença ${n} partidas`,gd:90},
 {k:'play',n:[3,5],txt:n=>`Jogue ${n} partidas`,gd:60},
 {k:'el',n:[1,1],txt:(n,e)=>`Vença com uma lenda de ${e}`,gd:110,el:true},
 {k:'spec',n:[4,6],txt:n=>`Acerte ${n} especiais (C)`,gd:80},
 {k:'perf',n:[2,3],txt:n=>`Faça ${n} bloqueios perfeitos`,gd:90},
 {k:'dodge',n:[8,12],txt:n=>`Esquive ${n} vezes`,gd:70},
 {k:'ko',n:[4,6],txt:n=>`Derrube ${n} lendas`,gd:90},
 {k:'online',n:[1,2],txt:n=>`Jogue ${pl(n,'partida','partidas')} online`,gd:100},
 {k:'ffa',n:[1,1],txt:n=>`Vença um Todos contra Todos`,gd:120},
 {k:'team',n:[2,2],txt:n=>`Jogue 2 partidas em equipe (2x2, 3x3 ou 5x5)`,gd:80},
];
function missToday(){const d=dayIdx();if(save.miss&&save.miss.day===d)return save.miss;
 const R=rng(d*7919+13),pool=MPOOL.slice(),list=[];while(list.length<3){const m=pool.splice(Math.floor(R()*pool.length),1)[0];const n=m.n[0]+Math.floor(R()*(m.n[1]-m.n[0]+1));list.push({k:m.k,n,p:0,el:m.el?MEL[Math.floor(R()*MEL.length)]:null,gd:Math.round((m.gd+(n-m.n[0])*20)*0.5/5)*5,po:R()<0.5?1:2,cl:false});}
 save.miss={day:d,list,all:false};persist();return save.miss;}
function missText(m){const P=MPOOL.find(x=>x.k===m.k);return P.txt(m.n,m.el);}
function weekState(){const w=weekIdx();if(!save.wk||save.wk.w!==w)save.wk={w,days:[],spun:false};return save.wk;}
function wkHeroActive(){const h=save.wkHero;return h&&h.w===weekIdx()&&weekDay()>=5?CHARS.find(c=>c.id===h.id):null;}
function canSpin(){const W_=weekState();return weekDay()>=5&&W_.days.length>=5&&!W_.spun;}
function missTrack(ev){const M=missToday();let changed=false;
 for(const m of M.list){if(m.p>=m.n)continue;let add=0;
  if(m.k==='win'&&ev.win)add=1;else if(m.k==='play')add=1;else if(m.k==='el'&&ev.win&&ev.el===m.el)add=1;else if(m.k==='spec')add=ev.spec;else if(m.k==='perf')add=ev.perf;else if(m.k==='dodge')add=ev.dodge;else if(m.k==='ko')add=ev.ko;else if(m.k==='online'&&ev.online)add=1;else if(m.k==='ffa'&&ev.win&&ev.ffa)add=1;else if(m.k==='team'&&ev.team)add=1;
  if(add>0){m.p=Math.min(m.n,m.p+add);changed=true;if(m.p>=m.n)ev.done=(ev.done||0)+1;}}
 if(M.list.every(m=>m.p>=m.n)&&!M.all){M.all=true;const W_=weekState();if(!W_.days.includes(M.day))W_.days.push(M.day);}
 if(changed)persist();return ev.done||0;}
function missClaimable(){const M=missToday();return M.list.filter(m=>m.p>=m.n&&!m.cl).length+(canSpin()?1:0);}
let MS={spinT:0,spinId:null,msg:''};
function weightedPick(){const pool=CHARS.map(c=>{const inR=CHARS.filter(x=>x.rar===c.rar).length;const bonus=(1+0.1*gemOf(save.mastery[c.id]||0))*(c.id===weekLegend().id?3:1);return {c,w:RAR[c.rar].p/inR*bonus};});
 let tot=pool.reduce((a,b)=>a+b.w,0),r=Math.random()*tot;for(const p of pool){r-=p.w;if(r<=0)return p.c;}return pool[0].c;}