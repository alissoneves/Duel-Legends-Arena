// ---------- PRÊMIO DIÁRIO, PRÓXIMO OBJETIVO E DESAFIOS ----------
const STREAK=[{gd:50},{gd:70,po:1},{gd:90},{gd:110,po:2},{gd:140},{gd:180,po:3},{hero:true}];
const SK={spinT:0,spinId:null,done:false,msg:'',shown:-1};
function streakInfo(){const s=save.streak||{last:-99,n:0},d=dayIdx(),can=s.last!==d,n=can?(s.last===d-1?s.n%7+1:1):s.n;return {can,n,lost:can&&s.last<d-1&&s.n>0};}
function dayHeroActive(){const h=save.dayHero;return h&&nowT()<h.until?CHARS.find(c=>c.id===h.id):null;}
function fixedHero(){return dayHeroActive()||wkHeroActive();}
function hoursLeft(t){const m=Math.max(0,Math.round((t-nowT())/60000));return m>=60?`${Math.floor(m/60)}h${String(m%60).padStart(2,'0')}`:`${m} min`;}
function streakClaim(){const I=streakInfo();if(!I.can)return;const r=STREAK[I.n-1];save.streak={last:dayIdx(),n:I.n};
 if(r.hero){const L=CHARS[Math.floor(Math.random()*CHARS.length)];save.dayHero={id:L.id,until:nowT()+DAY};save.useFixed=true;SK.spinT=performance.now();SK.spinId=L.id;SK.done=false;SK.msg=`${L.name} é sua lenda fixa por 24 horas!`;}
 else{save.gd+=r.gd||0;save.po+=r.po||0;SK.msg=`+${r.gd} GD${r.po?` e +${r.po} Pó Mágico`:''}!`;sfx('go');}
 persist();}
function renderStreak(){screenBg();const I=streakInfo();text('PRÊMIO DIÁRIO',W/2,24,12,'#ffd23f','center','#0b0c14');
 text(I.lost?'Você perdeu a sequência. Começando de novo!':'Entre todos os dias. No 7º dia, uma roleta sorteia uma lenda fixa por 24 horas!',W/2,40,8,I.lost?'#ff9a9a':'#c9cbe6','center',null,PS);
 const cur=I.n-1;
 for(let i=0;i<7;i++){const x=22+i*64,y=56,w=58,h=92,r=STREAK[i],got=i<cur||(!I.can&&i===cur),now=I.can&&i===cur;
  ctx.fillStyle=got?'#1c3a26':now?'#3a3f66':'#141626';ctx.fillRect(x,y,w,h);ctx.strokeStyle=now?'#ffd23f':r.hero?'#4fd1ff':'#2e3358';ctx.lineWidth=now?2:1;ctx.strokeRect(x+0.5,y+0.5,w-1,h-1);
  text(`DIA ${i+1}`,x+w/2,y+12,6,now?'#ffd23f':'#c9cbe6','center');
  if(r.hero){const c=CHARS[Math.floor(time*6+i)%CHARS.length];drawSprite(c.id,x+w/2,y+58,1.6,1,false,0.75);text('?',x+w/2,y+46,10,'#4fd1ff','center','#0b0c14');text('LENDA',x+w/2,y+72,7,'#4fd1ff','center',null,PS);text('por 24h',x+w/2,y+82,7,'#4fd1ff','center',null,PS);}
  else{text(String(r.gd),x+w/2,y+44,12,'#ffd23f','center','#0b0c14',PS);text('GD',x+w/2,y+56,7,'#ffd23f','center',null,PS);if(r.po)text(`+${r.po} Pó`,x+w/2,y+72,8,'#c77dff','center',null,PS);}
  if(got){ctx.fillStyle='rgba(11,12,20,0.45)';ctx.fillRect(x,y,w,h);text('✓',x+w/2,y+50,16,'#8ef0a0','center','#0b0c14');}}
 const H=dayHeroActive();
 if(SK.spinT){const el=(performance.now()-SK.spinT)/1000,L=el<2.4?CHARS[Math.floor(el*(16-el*5))%CHARS.length]:CHARS.find(c=>c.id===SK.spinId);panel(W/2-70,154,140,70);drawSprite(L.id,W/2,204,2.4,1);if(el>=2.4){text(L.name,W/2,218,9,'#ffd23f','center','#0b0c14',PS);if(!SK.done){SK.done=true;sfx('win');}}}
 else if(I.can)btn('skclaim',W/2-70,166,140,28,`RESGATAR DIA ${I.n}`,'#8ef0a0','#0b0c14',8);
 else if(H){drawSprite(H.id,W/2-90,206,2,1);text(`Lenda fixa: ${H.name}`,W/2-60,178,9,'#4fd1ff','left',null,PS);text(`termina em ${hoursLeft(save.dayHero.until)}`,W/2-60,192,8,'#8a8fb8','left',null,PS);
  btn('usefix',W/2-60,198,120,16,save.useFixed===false?'USAR NAS PARTIDAS':'VOLTAR AO SORTEIO',save.useFixed===false?'#4fd1ff':'#2e3358',save.useFixed===false?'#0b0c14':'#ffffff',5);text('vale contra bots e na partida casual',W/2-60,226,7,'#8a8fb8','left',null,PS);}
 else text('Volte amanhã para o próximo prêmio!',W/2,180,10,'#8ef0a0','center',null,PS);
 if(SK.msg&&!(SK.spinT&&!SK.done))text(SK.msg,W/2,240,9,'#8ef0a0','center',null,PS);
 btn('menu',8,244,80,20,'VOLTAR','#2e3358','#ffffff',7);}
// ---- próximo objetivo (menu principal) ----
function nextGoal(){const d=dayIdx(),M=missToday();
 if(streakInfo().can)return ['streak',`Prêmio diário: resgate o dia ${streakInfo().n}`];
 if(missClaimable())return ['missions','Você tem missões para resgatar!'];
 if(save.fwd!==d)return ['play','1ª vitória do dia vale GD em dobro!'];
 const m=M.list.find(x=>x.p<x.n);if(m)return ['missions',`Missão: ${missText(m)} (${m.p}/${m.n})`];
 const r=save.rank;if(save.user&&r.tier<0)return ['online',`Ranqueada: faltam ${5-(r.placed||0)} partidas de colocação`];
 if(save.user&&r.tier>=0&&r.tier<7){const nx=rankName(Object.assign(fromScore(rankScore(r)+100-r.lp),{lp:0}));return ['online',`Ranqueada: faltam ${100-r.lp} PDL para ${nx}`];}
 const tot=Object.keys(save.seen).length;if(tot<CHARS.length)return ['play',`Coleção ${tot}/${CHARS.length}: jogue para conhecer novas lendas`];
 return ['play','Jogue e suba no ranking!'];}
function drawGoal(y){const [act,t]=nextGoal();y=y||222;ctx.font=`8px ${PS}`;const w=Math.min(340,Math.round(ctx.measureText(tr(t)).width)+28),x=Math.round(W/2-w/2);
 ctx.fillStyle='rgba(11,12,20,0.85)';ctx.fillRect(x,y,w,16);ctx.strokeStyle='#ffd23f';ctx.lineWidth=1;ctx.strokeRect(x+0.5,y+0.5,w-1,15);
 text(t,x+10,y+11,8,'#ffffff','left',null,PS);text('>',x+w-9,y+11,8,'#ffd23f','left',null,PS);buttons.push({id:'goal:'+act,x,y,w,h:16});}
// ---- desafio / revanche ----
function rivalAdd(names,win){save.rivals=(save.rivals||[]).filter(r=>!names.includes(r.n));for(const n of names)save.rivals.unshift({n,t:Date.now(),w:win});save.rivals=save.rivals.slice(0,6);}
function rematchBtn(x){const o=oppHuman();if(!o)return;const acc=NET.chal&&NET.chal.from===o,sent=NET.chalTo===o&&!acc;btn('rematch',x,224,104,24,acc?'ACEITAR REVANCHE':sent?'PEDIDO ENVIADO':'REVANCHE',acc?'#46d160':sent?'#2e3358':'#c77dff',acc?'#0b0c14':'#ffffff',6);if(sent&&NET.err&&performance.now()-NET.errT<4000)text('esperando o rival…',x+52,258,7,'#c9cbe6','center',null,PS);}
function oppHuman(){const S=NET.start;if(!S)return null;const o=(S.slots||[]).filter(x=>x&&!x.bot&&x.pid!==NET.id);return o.length===1?o[0].name:null;}
function challenge(name){if(NET.status!=='on'){NET.err='Conecte ao servidor para desafiar.';NET.errT=performance.now();return;}netSend({t:'challenge',name});}
function drawChal(){const C=NET.chal;if(!C||['fight','countdown','prep','draw'].includes(state))return;if(performance.now()-C.t>60000){NET.chal=null;return;}
 const y=2,w=300,x=W/2-w/2;ctx.fillStyle='#2a1f4a';ctx.fillRect(x,y,w,30);ctx.strokeStyle='#ffd23f';ctx.lineWidth=2;ctx.strokeRect(x+1,y+1,w-2,28);
 text(`${C.from} te desafiou para um 1x1!`,x+10,y+19,9,'#ffffff','left',null,PS);btn('chalok',x+w-112,y+6,62,18,'ACEITAR','#46d160','#0b0c14',6);btn('chalno',x+w-46,y+6,40,18,'NÃO','#5a2a36','#ffffff',6);}
// ---- fim de temporada: mostra o resultado da temporada que acabou (uma vez) ----
function seasonEndCheck(){const L=save.rank&&save.rank.lastSeason;if(!L||save.seasonSeen===L.s)return;SE.data=L;if(['title','online','rankLobby'].includes(state))state='seasonEnd';}
const SE={data:null};
function renderSeasonEnd(){screenBg();const L=SE.data||(save.rank&&save.rank.lastSeason);if(!L){state='title';return;}
 const p=0.6+0.4*Math.sin(time*3);text(`FIM DA TEMPORADA ${L.s}`,W/2,26,13,'#ffd23f','center','#0b0c14');text('Obrigado por jogar! Veja como foi sua temporada.',W/2,40,8,'#c9cbe6','center',null,PS);
 panel(W/2-150,50,300,170);
 if(L.f){portrait(W/2-38,62,76,L.f);text('Borda conquistada:',W/2,156,8,'#c9cbe6','center',null,PS);text(frameName(L.f.t,L.f.d),W/2,170,12,`rgba(255,210,63,${p})`,'center','#0b0c14',PS);}
 else{portrait(W/2-38,62,76,null);text('Sem elo nesta temporada',W/2,162,10,'#8a8fb8','center',null,PS);}
 text(`Elo máximo: ${L.peakName||'—'}`,W/2,188,9,'#ffffff','center',null,PS);
 const pos=save.lastPos&&save.lastPos.s===L.s?save.lastPos:null;
 text(`Vitórias ${L.w||0} · Derrotas ${L.l||0}${pos?` · ${pos.pos}º no ranking`:''}`,W/2,202,9,'#8ef0a0','center',null,PS);
 text('A borda fica no seu perfil para sempre. A nova temporada começa com 5 partidas de colocação.',W/2,232,7,'#8a8fb8','center',null,PS);
 btn('seshare',W/2-150,244,140,20,'COPIAR RESULTADO','#2e3358','#ffffff',6);btn('seok',W/2+10,244,140,20,'NOVA TEMPORADA!','#ffd23f','#0b0c14',7);}
function seasonShare(){const L=SE.data||{};const pos=save.lastPos&&save.lastPos.s===L.s?` · ${save.lastPos.pos}º no ranking`:'';
 const t=`🏆 Temporada ${L.s} do Duel Legends Arena: ${L.peakName||'sem elo'}${pos}! Vitórias ${L.w||0}.\n${GAME_URL}`;try{navigator.clipboard.writeText(t);NET.err='Resultado copiado! Cole onde quiser.';NET.errT=performance.now();}catch(e){}}
