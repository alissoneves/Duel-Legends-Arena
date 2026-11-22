// ---------- TELAS DO ONLINE ----------
let lobbyPage=0,createMode='1x1';
const QBOT_WAIT=20;
function onlineHeader(t){screenBg();text(t,W/2,22,12,'#4fd1ff','center','#0b0c14');text(`${save.nick||'Jogador'} · ${NET.status==='on'?`online · ${NET.ping}ms${NET.online?` · ${NET.online} jogando`:''}`:NET.status==='connecting'?'conectando…':'desconectado'}`,W-8,14,8,NET.status==='on'?'#46d160':'#ff9a9a','right','#0b0c14',PS);
 if(NET.err&&performance.now()-(NET.errT||0)<4000)text(NET.err,W/2,240,9,'#ff9a9a','center','#0b0c14',PS);}
function renderOnline(){onlineHeader('ONLINE');
 if(NET.status!=='on'){text(NET.status==='connecting'?'Conectando ao servidor…':'Você está desconectado.',W/2,90,10,'#ffffff','center',null,PS);if(NET.err)text(NET.err,W/2,108,8,'#ff9a9a','center',null,PS);
  if(NET.status!=='connecting')btn('netconn',W/2-60,124,120,22,'CONECTAR','#4fd1ff','#0b0c14',8);text('Servidor: '+serverUrl(),W/2,164,7,'#8a8fb8','center',null,PS);btn('netsrv',W/2-60,172,120,14,'TROCAR SERVIDOR','#2e3358','#ffffff',5);}
 else{panel(40,50,400,170);btn('quickmatch',52,64,120,40,'PARTIDA RÁPIDA','#ffd23f','#0b0c14',6);text('1x1 casual',112,116,8,'#c9cbe6','center',null,PS);
  btn('ranked',180,64,120,40,'RANQUEADA','#ff8a3d','#0b0c14',7);text(rankLabel(save.rank),240,116,8,rankCol(save.rank),'center',null,PS);text('1x1 valendo elo',240,127,7,'#8a8fb8','center',null,PS);
  btn('lobby',308,64,120,40,'SALAS','#4fd1ff','#0b0c14',8);text('Até 10 pessoas, com senha',368,116,8,'#c9cbe6','center',null,PS);
  btn(save.nick&&!NET.canRename?'icons':'netnick',52,150,116,18,save.nick&&!NET.canRename?'MEU ÍCONE':'ESCOLHER NOME','#2e3358','#ffffff',6);btn('account',182,150,116,18,save.user?'CONTA: '+save.user.slice(0,8):'CRIAR CONTA','#7a5af0','#ffffff',6);btn('netsrv',312,150,116,18,'SERVIDOR','#2e3358','#ffffff',6);
  const RV=(save.rivals||[]).slice(0,3);if(RV.length){text('ÚLTIMOS RIVAIS · toque para desafiar',W/2,184,6,'#ffd23f','center');RV.forEach((r,i)=>{const x=W/2-RV.length*64+i*128+4;btn('rival:'+i,x,190,120,18,r.n.slice(0,14),r.w?'#1c3a26':'#3a1c22','#ffffff',6);});}
  else text('Itens valem online com o mesmo teto dos modos normais. Chat só com mensagens prontas.',W/2,196,8,'#8a8fb8','center',null,PS);}
 btn('menu',8,248,70,16,'VOLTAR','#2e3358','#ffffff',6);renderModal();}
function renderQueue(){onlineHeader(NET.rankQ?'RANQUEADA':'PARTIDA RÁPIDA');if(NET.rankQ)text(`${rankLabel(save.rank)} · procurando rival do seu nível`,W/2,80,9,rankCol(save.rank),'center',null,PS);text('Procurando outro jogador'+'.'.repeat(1+Math.floor(time*2)%3),W/2,110,11,'#ffffff','center',null,PS);if(NET.online)text(`${NET.online} ${NET.online===1?'pessoa':'pessoas'} online agora`,W/2,126,9,'#46d160','center',null,PS);
 if(!NET.rankQ&&NET.qT){const left=Math.ceil(QBOT_WAIT-(performance.now()-NET.qT)/1000);if(left<=0){NET.qT=0;netSend({t:'unqueue'});NET.queued=false;newPick('1x1');pick.qbot=true;NET.err='Ninguém apareceu. Treine contra um bot enquanto isso!';NET.errT=performance.now();return;}text(`Sem rival em ${left}s, você luta contra um bot`,W/2,232,8,'#c9cbe6','center',null,PS);}drawSprite('saci',W/2,170,2,Math.sin(time*3)>0?1:-1);btn('unqueue',W/2-50,200,100,18,'CANCELAR','#2e3358','#ffffff',6);}
function renderLobby(){onlineHeader('SALAS');const R=NET.rooms||[];panel(10,32,330,204);
 if(!R.length)text('Nenhuma sala aberta. Crie a primeira!',175,130,9,'#8a8fb8','center',null,PS);
 R.slice(lobbyPage*8,lobbyPage*8+8).forEach((r,i)=>{const y=36+i*25;ctx.fillStyle='#1d2140';ctx.fillRect(14,y,322,22);text((r.locked?'🔒 ':'')+r.name,20,y+10,9,'#ffffff','left',null,PS);text(`${MODES[r.mode]?MODES[r.mode].lab:r.mode} · ${r.players}/${r.max}`,20,y+19,7,'#8a8fb8','left',null,PS);
  if(r.status==='lobby'&&r.players<r.max)btn('join:'+r.id,276,y+3,56,16,'ENTRAR','#46d160','#0b0c14',6);else text(r.status==='lobby'?'CHEIA':'JOGANDO',304,y+14,6,'#ff8a3d','center');});
 panel(348,32,122,204);text('CRIAR SALA',409,44,7,'#ffd23f','center');[['1x1','1x1'],['2x2','2x2'],['3x3','3x3'],['5x5','5x5'],['ffa','TODOS']].forEach((m,i)=>btn('cmode:'+m[0],354+(i%2)*56,52+Math.floor(i/2)*20,54,17,m[1],createMode===m[0]?'#ffd23f':'#2e3358',createMode===m[0]?'#0b0c14':'#ffffff',6));
 btn('createroom',354,116,110,20,'CRIAR','#46d160','#0b0c14',7);btn('createlock',354,140,110,16,'CRIAR COM SENHA','#2e3358','#ffffff',5);text(`Até ${{'1x1':2,'2x2':4,'3x3':6,'5x5':10,ffa:8}[createMode]} pessoas`,409,168,7,'#ffd23f','center',null,PS);text('Vagas sem gente viram bots',409,180,7,'#8a8fb8','center',null,PS);
 btn('netlist',354,192,110,16,'ATUALIZAR','#2e3358','#ffffff',6);btn('joincode',354,212,110,18,'ENTRAR COM CÓDIGO','#4fd1ff','#0b0c14',5);
 btn('online',8,248,70,16,'VOLTAR','#2e3358','#ffffff',6);renderModal();}
// convite: abre o compartilhamento do celular (ou o WhatsApp) com o código da sala
const GAME_URL='https://alissoneves.github.io/Duel-Legends-Arena/';   // página própria do jogo (GitHub Pages)
function gameUrl(){if(GAME_URL)return GAME_URL;try{const r=document.referrer;if(/itch\.io/.test(r)){const u=new URL(r);return u.origin+u.pathname;}}catch(e){}return location.protocol.startsWith('http')&&!/itch\.zone|hwcdn/.test(location.host)?location.origin+location.pathname:'';}
function inviteFriend(){const r=NET.room;if(!r||!r.code)return;const url=gameUrl();
 const txt=`⚔️ Bora duelar no Duel Legends Arena!\nEntre na minha sala (${MODES[r.mode]?MODES[r.mode].lab:r.mode}):\n${url?url+'?sala='+r.code:''}\n\nOu abra o jogo e vá em ONLINE → SALAS → ENTRAR COM CÓDIGO: ${r.code}`;
 if(navigator.share){navigator.share({text:txt}).catch(()=>{});return;}
 const w=window.open('https://wa.me/?text='+encodeURIComponent(txt),'_blank');if(!w){try{navigator.clipboard.writeText(txt);NET.err='Convite copiado! Cole no WhatsApp.';NET.errT=performance.now();}catch(e){}}}
function renderRoom(){const r=NET.room;if(!r){state='online';return;}onlineHeader(r.name);text(`${MODES[r.mode]?MODES[r.mode].lab:r.mode}${r.locked?' · com senha':''}`,W/2,34,9,'#c9cbe6','center','#0b0c14',PS);
 const host=r.host===NET.id,ffa=r.mode==='ffa';
 const cols=[r.slots.map((q,i)=>i).filter(i=>i%2===0),r.slots.map((q,i)=>i).filter(i=>i%2===1)],rows=cols[0].length,rh=rows>3?20:rows>2?26:30,bh=rh-3;
 if(ffa)text(`TODOS CONTRA TODOS · ${r.slots.filter(q=>q).length}/${r.max} pessoas`,W/2,48,7,'#ffd23f','center');
 cols.forEach((list,ci)=>{const x=20+ci*230,w=210;if(!ffa)text(ci?'EQUIPE B':'EQUIPE A',x+w/2,48,7,ci?'#ff9a9a':'#7fc8ff','center');
  list.forEach((sl,k)=>{const y=54+k*rh,q=r.slots[sl],ty=y+bh/2+4;ctx.fillStyle=q&&q.pid===NET.id?'#2a3a60':'#1d2140';ctx.fillRect(x,y,w,bh);
   if(q){if(q.pid!==NET.id)btn('rep:'+q.pid,x+w-96,y+(bh-12)/2,12,12,'!','#5a2a36','#ff9a9a',5);if(q.icon)drawSprite(q.icon,x+14,y+bh-1,bh>=24?1:0.7,1);text((q.pid===r.host?'♛ ':'')+q.name,x+(q.icon?26:8),ty-(q.title&&bh>=20?3:0),rows>3?9:10,'#ffffff','left',null,PS);if(q.title&&bh>=20)text(q.title,x+(q.icon?26:8),ty+6,6,'#ffd23f','left',null,PS);text(q.pid===r.host?'DONO':q.ready?'PRONTO':'esperando',x+w-8,ty,8,q.pid===r.host?'#ffd23f':q.ready?'#46d160':'#8a8fb8','right',null,PS);}
   else{text('vaga livre (bot)',x+8,ty,9,'#6a6f98','left',null,PS);btn('slot:'+sl,x+w-58,y+(bh-15)/2,52,15,'IR AQUI','#2e3358','#ffffff',5);}});});
 // chat de mensagens prontas
 const cy=Math.max(150,58+rows*rh);NET.chat.slice(-3).forEach((c,i)=>text(c,20,cy+i*11,8,'#ffe2d0','left',null,PS));
 (NET.quick||[]).forEach((q,i)=>btn('qc:'+i,20+i*64,cy+36,60,14,q,'#2e3358','#ffffff',5));
 if(host){const others=r.slots.filter(q=>q&&q.pid!==NET.id),ok=others.every(q=>q.ready);btn('netstart',W/2-70,226,140,20,ok?'INICIAR PARTIDA':'ESPERANDO PRONTOS',ok?'#ffd23f':'#3a3f66',ok?'#0b0c14':'#8a8fb8',7);}
 else{const me=r.slots.find(q=>q&&q.pid===NET.id);btn('netready',W/2-70,226,140,20,me&&me.ready?'CANCELAR PRONTO':'PRONTO!',me&&me.ready?'#2e3358':'#46d160',me&&me.ready?'#ffffff':'#0b0c14',8);}
 btn('netleave',8,248,70,16,'SAIR','#2e3358','#ffffff',6);
 if(r.code){text('CÓDIGO: '+r.code,W-90,240,8,'#ffd23f','center','#0b0c14');btn('invite',W-140,247,100,18,'CONVIDAR AMIGO','#46d160','#0b0c14',5);}
 renderModal();}
// ---- CAIXA DA SORTE (só se ganha jogando: subir de elo ou terminar a colocação) ----
let boxAnim=null;
function boxOpen(){if(!(save.boxes>0)||boxAnim)return;save.boxes--;const KB=Object.keys(BASES),r=rollOdds(BOX_ODDS),win=newItem(KB[Math.floor(Math.random()*KB.length)],r);save.inv.push(win);let icon=null;{const left=ICON_BOX.map(idOf).filter(id=>id&&!iconOwned(id));if(left.length&&Math.random()<0.5){icon=left[Math.floor(Math.random()*left.length)];giveIcon(icon);}}persist();
 const strip=[];for(let i=0;i<46;i++){strip.push(i===38?win:{b:KB[Math.floor(Math.random()*KB.length)],r:rollOdds([0.42,0.28,0.16,0.08,0.04,0.02]),up:0});}
 boxAnim={strip,win,icon,t0:performance.now(),dur:5.2,done:false,lastIdx:-1,target:38+rnd(-0.32,0.32)};sfx('reveal');}
function renderBox(){screenBg();text('CAIXA DA SORTE',W/2,22,12,'#ffd23f','center','#0b0c14');text(`Você tem ${save.boxes||0} caixa(s) · ganhe subindo de elo na ranqueada`,W/2,36,9,'#c9cbe6','center','#0b0c14',PS);
 const cx=W/2,y=62,cw=44,ch=54;panel(16,y-6,W-32,ch+12);
 if(boxAnim){const A=boxAnim,el=(performance.now()-A.t0)/1000,k=Math.min(1,el/A.dur),e=1-Math.pow(1-k,4),pos=e*A.target;
  ctx.save();ctx.beginPath();ctx.rect(18,y-4,W-36,ch+8);ctx.clip();
  A.strip.forEach((it,i)=>{const x=cx+(i-pos)*cw-cw/2+2;if(x<-cw||x>W)return;itemCard(it,x,y,cw-4,ch,false);ctx.fillStyle=RARI[it.r].col;ctx.globalAlpha=0.25;ctx.fillRect(x,y,cw-4,ch);ctx.globalAlpha=1;drawIcon(it.b,x+(cw-4-24)/2,y+12,3,RARI[it.r].col);});
  ctx.restore();const idx=Math.round(pos);if(idx!==A.lastIdx&&!A.done){A.lastIdx=idx;sfx('beep');}
  ctx.fillStyle='#ffd23f';ctx.fillRect(cx-1,y-10,2,ch+20);ctx.beginPath();ctx.moveTo(cx-6,y-10);ctx.lineTo(cx+6,y-10);ctx.lineTo(cx,y-3);ctx.fill();
  if(k>=1){if(!A.done){A.done=true;A.doneT=performance.now();sfx(A.win.r>=3?'win':'go');if(A.win.r>=3)G&&0;}
   const w=A.win,R=RARI[w.r],gl=Math.min(1,(performance.now()-A.doneT)/400);panel(W/2-110,130,220,92);ctx.globalAlpha=gl;ctx.fillStyle=R.col;ctx.fillRect(W/2-110,130,220,3);
   drawIcon(w.b,W/2-100,142,5,R.col);text(R.n.toUpperCase()+'!',W/2+30,150,9,R.col,'center');text(BASES[w.b].names[w.r],W/2+30,166,10,'#ffffff','center',null,PS);text(statLine(itemStats(w)),W/2+30,180,9,'#8ef0a0','center',null,PS);text('Foi para a sua mochila',W/2+30,196,8,'#c9cbe6','center',null,PS);ctx.globalAlpha=1;
   btn('boxok',W/2-50,206,100,16,'PEGAR','#ffd23f','#0b0c14',7);}}
 else{for(let i=0;i<9;i++){const it={b:Object.keys(BASES)[(i*7)%34],r:Math.min(5,Math.floor(i/1.6)),up:0};const x=cx+(i-4)*cw-cw/2+2;itemCard(it,x,y,cw-4,ch,false);drawIcon(it.b,x+(cw-4-24)/2,y+12,3,RARI[it.r].col);}
  ctx.fillStyle='rgba(11,12,20,0.55)';ctx.fillRect(18,y-4,W-36,ch+8);
  // chances
  panel(W/2-110,130,220,92);text('CHANCES',W/2,140,6,'#ffd23f','center');RARI.forEach((R,i)=>{const yy=152+i*11;text(R.n,W/2-96,yy,9,R.col,'left',null,PS);const pc=BOX_ODDS[i]*100;text((pc<1?pc.toFixed(1):pc.toFixed(pc%1?1:0)).replace('.',',')+'%',W/2+96,yy,9,'#ffffff','right',null,PS);ctx.fillStyle=R.col;ctx.fillRect(W/2-24,yy-5,Math.max(1,BOX_ODDS[i]*110),4);});
  if(boxAnim&&boxAnim.icon&&(performance.now()-boxAnim.t0)/1000>boxAnim.dur){const nm=(CHARS.find(c=>c.id===boxAnim.icon)||{}).name;ctx.fillStyle='#0b0c14';ctx.fillRect(W/2-112,108,224,20);ctx.fillStyle='#ff7ad9';ctx.fillRect(W/2-110,110,220,16);text('BÔNUS: ícone de perfil '+nm+'!',W/2,121,7,'#0b0c14','center');}
  btn('boxopen',W/2-70,228,140,22,save.boxes>0?'GIRAR!':'SEM CAIXAS',save.boxes>0?'#ffd23f':'#3a3f66',save.boxes>0?'#0b0c14':'#8a8fb8',9);}
 btn('menu',8,248,70,16,'VOLTAR','#2e3358','#ffffff',6);}
// ---- PREPARAÇÃO (equipar e PRONTO) ----
function prepPlayers(){const L=[{n:'Você',c:pick.me,me:true,team:0}];if(pick.allies)pick.allies.forEach(c=>L.push({n:'Aliado',c,team:0}));const fs=pick.foes||[pick.foe];fs.forEach(c=>L.push({n:pick.mode==='ffa'?'Rival':'Bot',c,team:1}));return L;}
function enterPrep(next){prepInfo={t0:performance.now(),ready:false,next,players:prepPlayers().map((q,i)=>Object.assign(q,{at:q.me?1e9:rnd(1.2,5.5)+i*0.25}))};prepSlot=null;state='prep';}
function prepUpdate(){if(!prepInfo)return;if(prepInfo.net){const el=(performance.now()-prepInfo.t0)/1000;if(el>=30)netPrepReady();for(const q of prepInfo.players)q.at=(q.bot||NET.prepReady.includes(q.pid))?0:1e9;return;}const el=(performance.now()-prepInfo.t0)/1000;if(el>=30&&!prepInfo.ready){prepInfo.ready=true;prepInfo.readyAt=el;}
 if(prepInfo.ready&&prepInfo.players.every(q=>q.me||q.at<=el)&&el-prepInfo.readyAt>0.6){const nx=prepInfo.next;prepInfo=null;nx();}}
function renderPrep(){prepUpdate();if(state!=='prep'||!prepInfo)return;const a=pick.arena;ctx.drawImage(a.bg,0,0);ctx.fillStyle='rgba(11,12,20,0.84)';ctx.fillRect(0,0,W,H);
 const el=(performance.now()-prepInfo.t0)/1000,ranked=!!pick.ranked;if(prepInfo.net)for(const q of prepInfo.players)if(q.me)q.at=prepInfo.ready?0:1e9;text('PREPARAÇÃO',W/2,18,11,'#ffd23f','center','#0b0c14');text(`Equipe seu herói e aperte PRONTO · ${Math.max(0,Math.ceil(30-el))}s`,W/2,31,9,'#c9cbe6','center','#0b0c14',PS);
 // herói + atributos
 panel(8,40,128,196);const c=pick.me;drawSprite(c.id,72,96,2.4,1);text(shortN(c,16),72,108,9,'#ffffff','center',null,PS);text(c.el,72,118,8,ELCOL[c.el]||'#ffffff','center',null,PS);
 const g=myGear(ranked),m=arenaMod(a,c.el);[['atk','ATQ','#ff6a3d'],['def','DEF','#9aa3c7'],['vel','VEL','#ffd23f'],['esp','ESP','#4fc3ff'],['esq','ESQ','#8ef0a0']].forEach((r,i)=>{const y=128+i*14,base=Math.round(c[r[0]]*m),bon=g[r[0]]||0;
  text(r[1],14,y+6,7,'#c9cbe6','left');ctx.fillStyle='#0b0c14';ctx.fillRect(38,y,70,6);ctx.fillStyle=r[2];ctx.fillRect(38,y,Math.min(70,base/150*70),6);ctx.fillStyle='#ffffff';ctx.fillRect(38+Math.min(70,base/150*70),y,Math.min(70-Math.min(70,base/150*70),bon/150*70),6);
  text(`${base}${bon?'+'+bon:''}`,132,y+6,7,bon?'#8ef0a0':'#ffffff','right',null,PS);});
 const tot=gearTotal(gearRaw()),capd=gearTotal(g);text(`Poder dos itens: ${capd}${capd<tot?` (de ${tot})`:''}`,72,206,8,'#ffd23f','center',null,PS);text(ranked?`Ranqueada: máximo ${ITEM_CAP_RANK}`:`Máximo ${ITEM_CAP}`,72,216,7,'#8a8fb8','center',null,PS);
 // espaços
 panel(144,40,170,196);text('EQUIPAMENTO',229,50,6,'#ffd23f','center');
 SLOTS.forEach((sl,i)=>{const x=150+(i%2)*82,y=58+Math.floor(i/2)*58,it=invById(save.equip[sl.id]);const on=prepSlot===sl.id;ctx.fillStyle=on?'#3a3f66':'#1d2140';ctx.fillRect(x,y,78,54);
  if(on){ctx.strokeStyle='#ffd23f';ctx.lineWidth=1;ctx.strokeRect(x+0.5,y+0.5,77,53);}text(sl.n,x+39,y+8,7,'#8a8fb8','center',null,PS);
  if(!prepInfo.ready)buttons.push({id:'pslot:'+sl.id,x,y,w:78,h:54});
  if(it){ctx.fillStyle='#46d160';ctx.fillRect(x+2,y+11,30,7);text('EQUIPADO',x+17,y+17,4,'#0b0c14','center');drawIcon(it.b,x+31,y+16,2,RARI[it.r].col);text(BASES[it.b].names[it.r].slice(0,14)+(it.up?' +'+it.up:''),x+39,y+42,7,RARI[it.r].col,'center',null,PS);text(statLine(itemStats(it)).slice(0,20),x+39,y+51,6,'#8ef0a0','center',null,PS);
   if(!prepInfo.ready)btn('punq:'+sl.id,x+66,y+2,10,10,'X','#ff4d5e','#ffffff',5);}
  else{text('vazio',x+39,y+28,8,'#4a4f7a','center',null,PS);text('toque para equipar',x+39,y+40,6,'#6a6f98','center',null,PS);}});
 // direita: escolher item ou jogadores
 panel(322,40,150,196);
 if(prepSlot&&!prepInfo.ready){const cur=invById(save.equip[prepSlot]),L=save.inv.filter(it=>BASES[it.b].slot===prepSlot&&it!==cur).sort((a,b)=>itemPower(b)-itemPower(a));text(SLOTS.find(q=>q.id===prepSlot).n.toUpperCase(),397,50,6,'#ffd23f','center');
  text('EQUIPADO AGORA',330,61,5,'#46d160','left');ctx.fillStyle='#1c3a26';ctx.fillRect(326,64,142,22);
  if(cur){drawIcon(cur.b,328,67,2,RARI[cur.r].col);text(BASES[cur.b].names[cur.r].slice(0,15)+(cur.up?' +'+cur.up:''),346,73,7,RARI[cur.r].col,'left',null,PS);text(statLine(itemStats(cur)),346,82,6,'#8ef0a0','left',null,PS);btn('punq:'+prepSlot,430,88,38,11,'TIRAR','#ff4d5e','#ffffff',5);}
  else text('nada equipado',397,78,8,'#8a8fb8','center',null,PS);
  text(L.length?'TROCAR POR:':'Sem outros itens deste tipo',330,106,5,'#ffd23f','left');
  L.slice(0,6).forEach((it,i)=>{const y=110+i*19;ctx.fillStyle='#141626';ctx.fillRect(326,y,142,17);drawIcon(it.b,328,y+1,2,RARI[it.r].col);text(BASES[it.b].names[it.r].slice(0,15)+(it.up?' +'+it.up:''),346,y+8,7,RARI[it.r].col,'left',null,PS);text(statLine(itemStats(it)),346,y+15,6,'#8ef0a0','left',null,PS);buttons.push({id:'pitem:'+it.id,x:326,y,w:142,h:17});});
  if(L.length>6)text(`+${L.length-6} na mochila`,397,234,7,'#8a8fb8','center',null,PS);}
 else{text('JOGADORES',397,50,6,'#ffd23f','center');prepInfo.players.slice(0,10).forEach((q,i)=>{const y=56+i*17,rd=q.me?prepInfo.ready:q.at<=el;ctx.fillStyle=q.team===0?'#1c2a40':'#3a1c22';ctx.fillRect(326,y,142,15);
   text(`${q.n}: ${shortN(q.c,14)}`.slice(0,22),330,y+10,7,q.me?'#8ef0a0':'#ffffff','left',null,PS);ctx.fillStyle=rd?'#46d160':'#3a3f66';ctx.fillRect(452,y+3,12,9);text(rd?'✓':'…',458,y+11,7,rd?'#0b0c14':'#c9cbe6','center',null,PS);});}
 if(!prepInfo.ready)btn('ready',W/2-70,242,140,22,'PRONTO!','#46d160','#0b0c14',9);else text('Aguardando os outros jogadores…',W/2,256,10,'#8ef0a0','center','#0b0c14',PS);
 if(!prepInfo.ready)btn('bag',8,244,70,18,'MOCHILA','#2e3358','#ffffff',6);}
itemsInit();cosInit();
