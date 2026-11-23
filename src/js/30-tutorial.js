// ---------- TUTORIAL ----------
const TUT=[
 {t:'Ande pela arena',d:()=>isTouch?'Use o joystick à esquerda':'Use as teclas W, A, S, D',ok:T=>Math.hypot(G.p.x-T.sx,G.p.y-T.sy)>70},
 {t:'Ataque básico (A)',d:()=>isTouch?'Toque no botão A três vezes':'Clique com o mouse três vezes',ok:T=>T.a>=3},
 {t:'Habilidade (B)',d:()=>isTouch?'Toque no botão B':'Aperte a tecla E',ok:T=>T.b>=1},
 {t:'Esquiva (DASH)',d:()=>isTouch?'Toque em DASH para escapar de golpes':'Aperte Espaço para escapar de golpes',ok:T=>T.dash>=1},
 {t:'Bloqueio',d:()=>isTouch?'Segure BLOQ por um instante':'Segure Shift ou o botão direito do mouse',ok:T=>T.blk>0.6},
 {t:'Especial (C)',d:()=>isTouch?'A barra encheu! Toque em C':'A barra encheu! Aperte Q',ok:T=>T.c>=1,go:()=>{G.p.charge=100;}},
 {t:'Agora derrote o rival!',d:()=>'Use tudo o que aprendeu',ok:()=>false,go:()=>{G.b.dummy=false;G.b.hp=Math.min(G.b.hp,350);G.time=60;}},
];
function startTutorial(){fev('tut',1);const me=CHARS.find(c=>c.id==='saci')||CHARS[0],foe=CHARS.find(c=>c.name==='Golem')||CHARS[1];const arena=ARENAS.find(a=>a.id==='coliseu')||ARENAS[0];arena.bg=arena.bg||buildArena(arena);
 pick={me,allies:[],foes:[foe],foe,arena,mode:'1x1',ranked:false,tut:true};lastMode='1x1';startMatch();
 G.tut={step:0,a:0,b:0,c:0,dash:0,blk:0,sx:G.p.x,sy:G.p.y,okT:0};G.tips.on=false;G.b.dummy=true;G.time=999;G.shrinkT=99999;cdT=1;}
function tutEv(f,k){if(G&&G.tut&&f===G.p)G.tut[k]=(G.tut[k]||0)+1;}
function updateTut(dt){const T=G.tut,S=TUT[T.step];if(!S)return;if(G.p.blocking)T.blk+=dt;
 if(T.okT>0){T.okT-=dt;if(T.okT<=0){T.step++;const N=TUT[T.step];if(N&&N.go)N.go();T.sx=G.p.x;T.sy=G.p.y;}return;}
 if(S.ok(T)){T.okT=0.7;sfx('go');popup(G.p.x,G.p.y-40,'BOA!','#8ef0a0','',8);}}
function drawTut(){const T=G.tut;if(!T||G.over)return;const S=TUT[Math.min(T.step,TUT.length-1)];
 ctx.fillStyle='rgba(11,12,20,0.85)';ctx.fillRect(W/2-150,40,300,34);ctx.strokeStyle='#ffd23f';ctx.lineWidth=1.5;ctx.strokeRect(W/2-150,40,300,34);
 const tt=`TUTORIAL ${Math.min(T.step+1,TUT.length)}/${TUT.length} · ${S.t}`;let ts=7;ctx.font=`${ts}px ${PX}`;const tw=ctx.measureText(tr(tt)).width;if(tw>288)ts=Math.max(5,Math.floor(7*288/tw));// o texto cabe na caixa em qualquer idioma
 text(tt,W/2,52,ts,T.okT>0?'#8ef0a0':'#ffd23f','center');text(S.d(),W/2,66,8,'#ffffff','center',null,PS);
 for(let i=0;i<TUT.length;i++){ctx.fillStyle=i<T.step?'#8ef0a0':i===T.step?'#ffd23f':'#3a3f66';ctx.fillRect(W/2-46+i*14,77,10,3);}
 btn('tutskip',W/2+156,44,40,14,'PULAR','#2e3358','#ffffff',5);}