// ---------- SORTEIO DE LENDAS ----------
let prevState='title',bagBack='title',revealed=[false,false,false],lastMode='1x1',howPage=0,howNext='title';const DIFFN=['Fácil','Normal','Difícil'],DIFFM=[0.72,1,1.3];
function drawUnique(used){let c;do{c=CHARS[Math.floor(Math.random()*CHARS.length)];}while(used.has(c.id));used.add(c.id);return c;}
function newPick(mode,ranked){const used=new Set();const fx=!ranked&&save.useFixed!==false?fixedHero():null;const me=fx||weightedPick();used.add(me.id);const arena=ARENAS[Math.floor(Math.random()*ARENAS.length)];arena.bg=arena.bg||buildArena(arena);
 const allies=[],foes=[];if(mode==='ffa'){for(let i=0;i<5;i++)foes.push(drawUnique(used));}else{const n=MODES[mode].n;for(let i=1;i<n;i++)allies.push(drawUnique(used));for(let i=0;i<n;i++)foes.push(drawUnique(used));}
 pick={me,allies,foes,foe:foes[0],ally:allies[0],foe2:foes[1],arena,mode,ranked:!!ranked,fixed:!!fx};lastMode=ranked?'ranked':mode;state='draw';drawT=0;revealed=[false,false,false];}
function isMulti(){return pick&&pick.mode&&pick.mode!=='1x1';}
