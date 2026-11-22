// ---------- RENDER ----------
function render(){buttons=[];ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#0b0c14';ctx.fillRect(0,0,W,H);
 if(state==='title')renderTitle();else if(state==='draw')renderDraw();else if(state==='bracket')renderBracket();else if(state==='album')renderAlbum();else if(state==='modes')renderModes();else if(state==='howto')renderHowto();else if(state==='shop')renderShop();else if(state==='bag')renderBag();else if(state==='box')renderBox();else if(state==='pass')renderPass();else if(state==='online')renderOnline();else if(state==='lobby')renderLobby();else if(state==='room')renderRoom();else if(state==='queue')renderQueue();else if(state==='prep')renderPrep();else if(state==='options')renderOptions();else if(state==='rankLobby')renderRankLobby();else if(state==='leader')renderLeader();else if(state==='account')renderAccount();else if(state==='missions')renderMissions();else if(state==='borders')renderBorders();else if(state==='ach')renderAch();else if(state==='icons')renderIcons();else if(state==='profile')renderProfile();else if(state==='streak')renderStreak();else if(state==='seasonEnd')renderSeasonEnd();else{renderGame();if(G&&G.flashT>0){ctx.fillStyle=`rgba(255,255,255,${Math.min(0.55,G.flashT*3)})`;ctx.fillRect(0,0,W,H);G.flashT-=1/60;}if(state==='countdown')renderCountdown();if(state==='result')renderResult();if(paused)renderPause();if(G&&G.tut&&(state==='fight'||state==='countdown'))drawTut();}drawAchToast();drawChal();}
function logo(cx,y,s){const sc=s||1;
 // dado
 ctx.save();ctx.translate(cx-82*sc,y+10*sc);ctx.rotate(-0.2);const d=22*sc;ctx.fillStyle='#0b0c14';ctx.fillRect(-d/2-2,-d/2-2,d+4,d+4);ctx.fillStyle='#ffffff';ctx.fillRect(-d/2,-d/2,d,d);ctx.fillStyle='#c9cbe6';ctx.fillRect(-d/2,d/2-3*sc,d,3*sc);
 ctx.fillStyle='#e0393e';ctx.fillRect(-d/2+3*sc,-d/2+3*sc,5*sc,5*sc);ctx.fillStyle='#0b0c14';ctx.fillRect(d/2-8*sc,-d/2+3*sc,5*sc,5*sc);ctx.fillRect(-2.5*sc,-2.5*sc,5*sc,5*sc);ctx.fillRect(-d/2+3*sc,d/2-8*sc,5*sc,4*sc);ctx.fillRect(d/2-8*sc,d/2-8*sc,5*sc,4*sc);ctx.restore();
 ctx.save();ctx.font=`${Math.round(20*sc)}px ${PX}`;
 text('DUEL',cx-60*sc+3,y+12*sc+3,Math.round(20*sc),'#e0393e','left',null);text('DUEL',cx-60*sc,y+12*sc,Math.round(20*sc),'#ffd23f','left','#0b0c14');
 text('LEGENDS',cx-60*sc+3,y+30*sc+3,Math.round(14*sc),'#4f3f8f','left',null);text('LEGENDS',cx-60*sc,y+30*sc,Math.round(14*sc),'#ffffff','left','#0b0c14');
 const bw=70*sc,bh=14*sc,bx=cx-bw/2+8*sc,by=y+37*sc;ctx.fillStyle='#0b0c14';ctx.fillRect(bx+2,by+2,bw+4,bh+4);ctx.fillRect(bx-2,by-2,bw+4,bh+4);ctx.fillStyle='#e0393e';ctx.fillRect(bx,by,bw,bh);
 text('ARENA',bx+bw/2,by+bh/2+4*sc,Math.round(8*sc),'#ffffff','center',null);ctx.restore();}
let titleArena=null;
function screenBg(){if(!titleArena){titleArena=ARENAS[0];titleArena.bg=titleArena.bg||buildArena(titleArena);}ctx.drawImage(titleArena.bg,0,0);ctx.fillStyle='rgba(11,12,20,0.85)';ctx.fillRect(0,0,W,H);}
function panel(x,y,w,h){ctx.fillStyle='#0b0c14';ctx.fillRect(x-2,y-2,w+4,h+4);ctx.fillStyle='#141626';ctx.fillRect(x,y,w,h);}
function renderModes(){screenBg();text('CONTRA BOTS',W/2,30,12,'#ffd23f','center','#0b0c14');text('Seu lutador é sempre sorteado',W/2,44,10,'#c9cbe6','center','#0b0c14',PS);
 const M=[['m:1x1','DUELO 1x1','Você contra uma lenda','#ffd23f',['saci']],['m:2x2','DUPLAS 2x2','Você + 1 aliado bot','#7fc8ff',['saci','iara']],['m:3x3','TRIOS 3x3','Você + 2 aliados bots','#7fe0c8',['saci','iara','zeus']],
  ['m:5x5','EQUIPES 5x5','Batalha de 10 lendas','#b07aff',['saci','iara','zeus','yeti','saci']],['m:ffa','TODOS x TODOS','6 lendas, só 1 sobrevive','#ff6a3d',['zeus','yeti','iara']],['tour','TORNEIO','16 vagas, mata-mata','#ff8a3d',['zeus']]];
 M.forEach((m,i)=>{const x=24+(i%3)*148,y=58+Math.floor(i/3)*92,w=136,h=82;panel(x,y,w,h);ctx.strokeStyle=m[3];ctx.lineWidth=1;ctx.strokeRect(x+0.5,y+0.5,w-1,h-1);
  const n=m[4].length;m[4].forEach((id,k)=>drawSprite(id,x+w/2+(k-(n-1)/2)*Math.min(22,110/n),y+38,1,k%2?-1:1));
  btn(m[0],x+8,y+44,w-16,18,m[1],m[3],'#0b0c14',m[1].length>11?6:7);text(m[2],x+w/2,y+74,9,'#ffe2d0','center',null,PS);});
 btn('menu',W/2-48,244,96,20,'VOLTAR','#2e3358','#ffffff',7);}
function renderLeader(){screenBg();text('RANKING GLOBAL',W/2,22,12,'#ff8a3d','center','#0b0c14');text(`Temporada ${save.rank.season} · ${LB.total} jogadores com elo`,W/2,36,9,'#c9cbe6','center','#0b0c14',PS);
 panel(40,44,400,174);
 if(LB.loading)text('Carregando…',W/2,130,10,'#c9cbe6','center',null,PS);
 else if(LB.err)text(LB.err,W/2,130,9,'#ff9a9a','center',null,PS);
 else if(!LB.list.length)text('Ninguém terminou a colocação ainda. Seja o primeiro!',W/2,130,9,'#ffe2d0','center',null,PS);
 else{const I=ident();LB.list.slice(LB.page*10,LB.page*10+10).forEach((p,i)=>{const pos=LB.page*10+i+1,y=58+i*16,me=p.pid===I.pid;
  if(me){ctx.fillStyle='rgba(255,210,63,0.18)';ctx.fillRect(44,y-9,392,15);}
  text(`${pos}º`,64,y+2,9,pos<=3?['#ffd23f','#c9cbe6','#d9a04a'][pos-1]:'#9aa3c7','center',null,PS);
  {const fk=frameKey(Object.assign({placed:5},p.r));if(fk)rankFrame(83,y-9,15,fk.t,fk.d,(ix,iy,is)=>{ctx.fillStyle='#23264a';ctx.fillRect(ix,iy,is,is);if(p.i){ctx.save();ctx.beginPath();ctx.rect(ix,iy,is,is);ctx.clip();drawSprite(p.i,ix+is/2,iy+is+1,0.55,1);ctx.restore();}else emblem(ix+is/2,iy+is/2,is*0.45,p.r);});}text(p.n,106,y+2,9,me?'#ffd23f':'#ffffff','left',null,PS);
  const rr=Object.assign({placed:5},p.r);text(rankLabel(rr),430,y+2,9,rankCol(rr),'right',null,PS);});}
 const pages=Math.max(1,Math.ceil(LB.list.length/10));text(`${LB.page+1}/${pages}`,W/2,232,8,'#c9cbe6','center',null,PS);
 btn('ldp',W/2-60,224,26,14,'<','#2e3358','#ffffff',7);btn('ldn',W/2+34,224,26,14,'>','#2e3358','#ffffff',7);
 const R=save.rank;text(LB.me&&LB.me.pos?`Você: ${LB.me.pos}º de ${LB.total} · ${rankLabel(R)}`:R.tier<0?`Termine a colocação (${R.placed}/5) para entrar no ranking`:`Você: ${rankLabel(R)}`,W/2,252,9,'#ffd23f','center','#0b0c14',PS);
 btn('ldback',8,244,60,18,'VOLTAR','#2e3358','#ffffff',6);btn('ldr',W-82,244,74,18,'ATUALIZAR','#4fd1ff','#0b0c14',6);}
function renderRankLobby(){screenBg();const R=save.rank;text('RANQUEADA ONLINE',W/2,24,12,'#ff8a3d','center','#0b0c14');text(`Temporada ${R.season} · Etapa ${R.split}`,W/2,38,9,'#c9cbe6','center','#0b0c14',PS);
 panel(140,48,200,120);emblem(W/2,92,34,R);text(R.tier<0?'SEM ELO':rankName(R).toUpperCase(),W/2,138,10,rankCol(R),'center','#0b0c14');
 if(R.tier<0)text(`Partidas de colocação: ${R.placed}/5`,W/2,152,9,'#ffe2d0','center',null,PS);else if(R.tier<7){bar(170,146,140,5,R.lp/100,rankCol(R));text(`${R.lp}/100 PDL`,W/2,162,8,'#ffffff','center',null,PS);}else text(`${R.lp} PDL${apexOf(R)<9?' · '+(apexOf(R)===7?200:500)+' para '+TIERS[apexOf(R)+1].n:''}`,W/2,156,9,'#ffffff','center',null,PS);
 // escada de elos
 for(let i=0;i<TIERS.length;i++){const x=24+i*48,cur=R.tier>=0&&apexOf(R)===i;emblem(x,196,cur?12:9,{tier:i<7?i:7,lp:i===8?200:i===9?500:0,div:0});text(TIERS[i].n.replace('Grão-Mestre','Grão-M.'),x,216,7,cur?TIERS[i].col:'#6a6f98','center',null,PS);}
 text('1x1 contra pessoas · itens com teto · a cada 100 PDL sobe uma divisão',W/2,230,8,'#c9cbe6','center',null,PS);
 btn('rankgo',W/2-70,238,140,22,'PROCURAR PARTIDA','#ffd23f','#0b0c14',7);btn('leader',W-84,238,76,22,'RANKING','#4fd1ff','#0b0c14',7);btn('online',8,244,60,18,'VOLTAR','#2e3358','#ffffff',6);text(NET.status==='on'?'online':NET.status==='connecting'?'conectando…':'desconectado',W-8,14,8,NET.status==='on'?'#46d160':'#ff9a9a','right','#0b0c14',PS);if(NET.err&&performance.now()-(NET.errT||0)<4000)text(NET.err,W/2,44,8,'#ff9a9a','center','#0b0c14',PS);
 if(R.shield>0&&R.tier>0)text(`Proteção de rebaixamento: ${R.shield}`,W-8,28,8,'#bfeaff','right',null,PS);}