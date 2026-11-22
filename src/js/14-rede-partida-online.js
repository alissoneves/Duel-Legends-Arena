// ---------- REDE: PARTIDA ONLINE ----------
function netAbort(msg){NET.on=false;NET.role=null;prepInfo=null;paused=false;modal={title:'PARTIDA ENCERRADA',lines:[msg],btns:[['mod:x','OK','#ffd23f']]};state='online';setTimeout(()=>{if(NET.room&&state==='online')state='room';},300);}
function netMsg(m){switch(m.t){
 case 'welcome':NET.id=m.id;NET.quick=m.quick||[];if(m.now)NET.tOff=m.now-Date.now();break;
 case 'rooms':NET.rooms=m.rooms;if(m.online!=null)NET.online=m.online;break;
 case 'room':NET.room=m;NET.queued=false;if(state==='online'||state==='lobby'||state==='queue')state='room';break;
 case 'chat':NET.chat.push(`${m.from}: ${m.msg}`);if(NET.chat.length>5)NET.chat.shift();sfx('beep');break;
 case 'error':NET.err=m.msg;NET.errT=performance.now();sfx('beep');break;
 case 'info':NET.err=m.msg;NET.errT=performance.now();sfx('go');break;
 case 'queued':NET.queued=true;NET.qT=performance.now();state='queue';break;
 case 'start':NET.chal=null;NET.chalTo=null;netBeginDraw(m);break;
 case 'prep':NET.prepReady=m.ready;break;
 case 'rpick':if(pick&&pick.choosing&&NET.ropts){const me=NET.mySlot,fs=NET.order.filter(i=>i!==me);pick.me=NET.ropts[me][m.picks[me]|0];pick.foes=fs.map(i=>NET.ropts[i][m.picks[i]|0]);pick.foe=pick.foes[0];pick.foe2=pick.foes[1];pick.choosing=false;drawT=1.65;revealed=[true,false,false];sfx('reveal');}break;
 case 'challenge':NET.chal={from:m.from,t:performance.now()};sfx('reveal');break;
 case 'chalsent':NET.chalTo=m.to;NET.err=`Desafio enviado para ${m.to}. Esperando resposta…`;NET.errT=performance.now();break;
 case 'go':NET.go=m;netStartMatch();break;
 case 'inp':NET.inputs[m.s]=m.i;break;
 case 'snap':if(NET.role==='client'&&G&&G.net)netApplySnap(m.s);break;
 case 'end':if(NET.role==='client'&&G&&G.net)netEnd(m);break;
 case 'aborted':if(NET.on)netAbort(m.msg);break;
 case 'left':NET.room=null;if(state==='room')state='online';break;
 case 'pong':NET.ping=Math.round(performance.now()-m.ts);break;
 case 'rank':if(m.seasonEnd)NET.seasonEnd=m.seasonEnd;if(m.name&&(m.rename||!/^Jogador\d*$/.test(m.name)))save.nick=m.name;NET.canRename=!!m.rename;if(m.rename&&!NET.renameAsked){NET.renameAsked=true;setTimeout(()=>askNick(false),300);}if(save.statQ&&save.statQ.length&&m.rank){netSend({t:'stat',list:save.statQ});save.statQ=[];}if(NET.autoJoin){netSend({t:'joincode',code:NET.autoJoin});NET.autoJoin=null;}if(m.rank){save.rank=Object.assign(save.rank||{},m.rank);save.user=m.user||null;persist();seasonEndCheck();}NET.ready=true;if(ACC.pending){netSend(ACC.pending);ACC.pending=null;}break;
 case 'auth':ACC.busy=false;
  if(m.expired){save.user=null;save.ident=null;persist();ACC.err='Sua sessão expirou. Entre na conta de novo.';netSend(helloMsg(save.nick||'Jogador'));break;}
  if(m.err){ACC.err=m.err;ACC.msg='';sfx('beep');break;}
  ACC.err='';
  if(m.ok==='register'){save.user=m.user;if(!save.nick){save.nick=m.user;netSend(helloMsg(save.nick));}ACC.msg='Conta criada! Seu elo agora fica salvo nela.';}
  else if(m.ok==='login'){save.ident={pid:m.pid,key:m.key};save.user=m.user;if(m.name)save.nick=m.name;if(m.rank)save.rank=Object.assign(save.rank||{},m.rank);ACC.msg='Bem-vindo de volta, '+m.user+'!';}
  else if(m.ok==='pass')ACC.msg='Senha alterada.';
  else if(m.ok==='deleted'){save.user=null;save.ident=null;save.rank=null;rankInit();ACC.msg='Pronto: seus dados online foram apagados.';persist();netSend(helloMsg(save.nick||'Jogador'));}
  persist();sfx('go');break;
 case 'rankres':{const k=NET.rkPending;NET.rkPending=null;if(m.void){if(k){k.pending=false;k.void=m.msg;}break;}save.rank=Object.assign(save.rank,m.rank);if(m.out&&m.out.box)save.boxes=(save.boxes||0)+1;persist();if(k){Object.assign(k,m.out,{pending:false,col:rankCol(save.rank)});}break;}
 case 'top':LB.loading=false;LB.list=m.list||[];LB.total=m.total||0;LB.me=m.me;LB.err=m.err||'';if(m.me&&m.me.pos){save.lastPos={s:save.rank.season||1,pos:m.me.pos,total:m.total||0};persist();}break;}}
// sorteio igual para todos (mesma semente)
function netBeginDraw(S){NET.start=S;NET.on=true;NET.mySlot=S.slots.findIndex(q=>q.pid===NET.id);NET.role=S.host===NET.id?'host':'client';NET.inputs={};NET.prepReady=[];NET.cnt={b:0,c:0,dash:0};
 const picks=withSeed(S.seed,()=>{const arena=ARENAS[Math.floor(Math.random()*ARENAS.length)];const used=new Set();const chars=S.slots.map(()=>drawUnique(used));return {arena,chars,opts:S.ranked?S.slots.map(()=>[drawUnique(used),drawUnique(used),drawUnique(used)]):null};});
 const me=NET.mySlot,myTeam=S.slots[me].team,ffa=S.mode==='ffa';
 const allySlots=ffa?[]:S.slots.map((q,i)=>i).filter(i=>i!==me&&S.slots[i].team===myTeam),foeSlots=S.slots.map((q,i)=>i).filter(i=>i!==me&&(ffa||S.slots[i].team!==myTeam));
 NET.order=ffa?[me,...foeSlots]:[me,...allySlots,...foeSlots];
 const arena=picks.arena;arena.bg=arena.bg||buildArena(arena);
 pick={me:picks.chars[me],allies:allySlots.map(i=>picks.chars[i]),foes:foeSlots.map(i=>picks.chars[i]),arena,mode:S.mode,online:true};pick.foe=pick.foes[0];pick.ally=pick.allies[0];pick.foe2=pick.foes[1];
 pick.ranked=!!S.ranked;pick.names=NET.order.map(i=>S.slots[i].bot?'Bot':S.slots[i].name);if(S.ranked&&picks.opts){NET.ropts=picks.opts;NET.rmy=null;pick.choosing=true;pick.chooseT0=performance.now();pick.opts=picks.opts[me];pick.me=pick.opts[0];}if(S.ranked){const o=S.slots.find((q,i)=>i!==me&&!q.bot);save.rank.oppMmr=o?o.mmr||1150:save.rank.mmr;pick.oppName=o?o.name:'';}
 lastMode=S.ranked?'ranked':'online';state='draw';drawT=0;revealed=[false,false,false];}
function enterNetPrep(){const S=NET.start;const players=NET.order.map(i=>({n:S.slots[i].bot?'Bot':S.slots[i].name,c:i===NET.mySlot?pick.me:null,slot:i,pid:S.slots[i].pid,me:i===NET.mySlot,team:S.slots[i].team===S.slots[NET.mySlot].team?0:1,bot:S.slots[i].bot}));
 const chars=[pick.me,...pick.allies,...pick.foes];players.forEach((q,k)=>q.c=chars[k]);
 prepInfo={t0:performance.now(),ready:false,net:true,players,next:()=>{}};prepSlot=null;state='prep';}
function netPrepReady(){if(!prepInfo||prepInfo.sent)return;prepInfo.ready=true;prepInfo.sent=true;netSend({t:'prepready',gear:myGear(!!pick.ranked),cos:save.cos.eq});sfx('go');}
function netStartMatch(){const S=NET.start;if(!S)return;prepInfo=null;
 withSeed(S.seed+7,()=>startMatch());
 G.net=true;const ffa=S.mode==='ffa';
 NET.order.forEach((slot,k)=>{const f=G.all[k];f.slot=slot;const q=S.slots[slot];f.remote=NET.role==='host'&&!q.bot&&slot!==NET.mySlot;if(f.remote)f.bot=false;f.netName=q.bot?'Bot':q.name;});
 // posições iguais em todas as telas (por lugar na sala)
 const cx0=(BX1+BX2)/2,cy0=(BY1+BY2)/2;const bySlot=[...G.all].sort((a,b)=>a.slot-b.slot);
 if(ffa)bySlot.forEach((f,i)=>{const ang=Math.PI+i*TAU/bySlot.length;f.x=cx0+Math.cos(ang)*(BX2-BX1)*0.38;f.y=cy0+Math.sin(ang)*(BY2-BY1)*0.36;});
 else for(const tm of [0,1]){const arr=bySlot.filter(f=>S.slots[f.slot].team===tm);arr.forEach((f,i)=>{f.x=BX1+(BX2-BX1)*(tm?0.84:0.16)+(i%2)*(tm?18:-18);f.y=BY1+50+(BY2-BY1-100)*(arr.length===1?0.5:i/(arr.length-1));});}
 for(const f of G.all){f.face=f.x<cx0?1:-1;f.aim=f.face>0?0:Math.PI;f.nx=f.x;f.ny=f.y;}
 G.covers=withSeed(S.seed+11,()=>buildCovers(G.all));
 // itens e visuais de quem é gente
 const gears=(NET.go&&NET.go.gears)||{},cos=(NET.go&&NET.go.cos)||{};
 for(const f of G.all){const q=S.slots[f.slot];f.cos=f===G.p?save.cos.eq:(cos[f.slot]||{});if(NET.role==='host'&&!q.bot&&f!==G.p&&gears[f.slot]){for(const k in f.gear||{})f.st[k]-=f.gear[k];applyGear(f,gears[f.slot]);}}
 G.cam={x:clamp(G.p.x-W/2,-8,WW-W+8),y:clamp(G.p.y-H/2-10,-46,WH-H+34)};G.tips={on:false,q:[],done:{}};NET.snapT=0;NET.newPops=[];}
function netSlotF(slot){return G.all.find(f=>f.slot===slot);}
// comandos de um jogador remoto (rodando no dono da sala)
function netRemoteInput(f){const I=NET.inputs[f.slot];if(!I)return {x:0,y:0};f.aim=I.aim;
 const wantBlock=!G.over&&f.stun<=0&&f.dashT<=0&&!f.channel&&!(f.broken>0)&&!!I.blk;if(wantBlock&&!f.blocking)f.blockStart=time;f.blocking=wantBlock;
 if(!G.over&&f.stun<=0){if(I.a)doA(f);if(I.b!==f._b){f._b=I.b;doB(f);}if(I.c!==f._c){f._c=I.c;doC(f);}if(I.d!==f._d){f._d=I.d;doDash(f,I.da);}if(I.e!==f._e){f._e=I.e;doEmote(f);}}
 return {x:I.mx||0,y:I.my||0};}
function localInput(f){let mv={x:0,y:0};if(keys.KeyW||keys.ArrowUp)mv.y-=1;if(keys.KeyS||keys.ArrowDown)mv.y+=1;if(keys.KeyA||keys.ArrowLeft)mv.x-=1;if(keys.KeyD||keys.ArrowRight)mv.x+=1;
 if(touch.joy!=null){mv.x=touch.joyV.x;mv.y=touch.joyV.y;}const l=Math.hypot(mv.x,mv.y);if(l>1){mv.x/=l;mv.y/=l;}
 const aim=isTouch?autoAim(f):Math.atan2(mouse.y+G.cam.y-(f.y-8),mouse.x+G.cam.x-f.x);return {mv,aim};}
// cliente: manda comandos, prevê o próprio movimento e suaviza o resto
function netClientUpdate(dt){const p=G.p;
 const L=localInput(p);if(pressed.b)NET.cnt.b++;if(pressed.c)NET.cnt.c++;if(pressed.dash)NET.cnt.dash++;
 const blk=!!(keys.ShiftLeft||keys.ShiftRight||mouse.right||touch.blk!=null);
 NET.inT+=dt;if(NET.inT>=1/30||pressed.b||pressed.c||pressed.dash){NET.inT=0;const ml=Math.hypot(L.mv.x,L.mv.y);netSend({t:'inp',i:{mx:+L.mv.x.toFixed(2),my:+L.mv.y.toFixed(2),aim:+L.aim.toFixed(2),a:!!(mouse.down||touch.aHeld!=null),blk,b:NET.cnt.b,c:NET.cnt.c,d:NET.cnt.dash,da:+(ml>0.2?Math.atan2(L.mv.y,L.mv.x):L.aim).toFixed(2),e:NET.cnt.e||0}});}
 pressed.b=pressed.c=pressed.dash=false;
 if(!p.dead&&!G.over){p.aim=blk?Math.atan2(p.foe.y-p.y,p.foe.x-p.x):L.aim;p.face=Math.cos(p.aim)>=0?1:-1;if(blk&&!p.blocking)p.blockStart=time;p.blocking=blk;
  if(!(p.stun>0)&&!(p.dashT>0)){const sp=p.speed*(blk?0.4:1);p.x+=L.mv.x*sp*dt;p.y+=L.mv.y*sp*dt;p.walk=Math.hypot(L.mv.x,L.mv.y)>0.2?(p.walk||0)+dt*12:0;}
  p.x=clamp(p.x,BX1+7,BX2-7);p.y=clamp(p.y,BY1+16,BY2-2);}
 for(const f of G.all){if(f.nx==null)continue;const k=f===p?clamp(dt*6,0,1):clamp(dt*14,0,1);if(Math.hypot(f.nx-f.x,f.ny-f.y)>60){f.x=f.nx;f.y=f.ny;}else{f.x=lerp(f.x,f.nx,k);f.y=lerp(f.y,f.ny,k);}
  f.flash=Math.max(0,(f.flash||0)-dt);if(f.dashT>0)f.trail.push({x:f.x,y:f.y,t:0});for(const tr of f.trail)tr.t+=dt;f.trail=f.trail.filter(tr=>tr.t<0.18);if(f!==p&&f.moving)f.walk=(f.walk||0)+dt*12;else if(f!==p)f.walk=0;}
 let best=null,bd=1e9;for(const e of G.all){if(e.team===p.team||e.dead)continue;const d=Math.hypot(e.x-p.x,e.y-p.y);if(d<bd){bd=d;best=e;}}if(best)p.foe=best;
 for(const q of G.proj){q.x+=q.vx*dt;q.y+=q.vy*dt;}for(const z of G.zones)z.t+=dt;for(const s2 of G.slashes)s2.t+=dt;G.slashes=G.slashes.filter(s2=>s2.t<0.14);for(const d of G.decoys)d.t-=dt;
 for(const pp of G.pops)pp.t+=dt;G.pops=G.pops.filter(pp=>pp.t<0.9);updateAmb(dt);G.shake=Math.max(0,G.shake-dt*20);
 for(const k of ['x1','y1','x2','y2'])G.zone[k]=lerp(G.zone[k],G.zt[k],clamp(dt*3,0,1));
 {const fo=p.dead?(G.all.find(x=>!x.dead&&x.team===p.team)||p):p;const tx=clamp(fo.x-W/2,-8,WW-W+8),ty=clamp(fo.y-H/2-10,-46,WH-H+34);G.cam.x=lerp(G.cam.x,tx,clamp(dt*6,0,1));G.cam.y=lerp(G.cam.y,ty,clamp(dt*6,0,1));}
 if(G.over){G.koT+=dt;if(G.koT>1.6){state='result';resultT=0;finishResult();}}}
const r1=v=>Math.round(v*10)/10,r2=v=>Math.round(v*100)/100;
function netHostTick(dt){NET.snapT+=dt;if(NET.snapT<0.05)return;NET.snapT=0;
 const F=G.all.map(f=>{const fl=(f.blocking?1:0)|(f.stun>0?2:0)|(f.freeze>0?4:0)|(f.shieldT>0?8:0)|(f.ghost>0?16:0)|(f.big>0?32:0)|(f.marked>0?64:0)|(f.reflect>0?128:0)|(f.inv>0?512:0)|(f.broken>0?1024:0)|(f.dead?2048:0)|(f.dashT>0?4096:0)|(Math.hypot(f.vx,f.vy)>15?8192:0)|(f.windT>0?16384:0);
  return [f.slot,r1(f.x),r1(f.y),Math.round(f.hp),Math.round(f.charge),f.face,r2(f.aim),fl,Math.round(f.guard),Math.round(f.guardMax),r2(f.cdA),r2(f.cdB),r2(f.cdDash),f.emoteT>0?f.emote:0,r2(f.revealT||0),f.cover,f.channel?[f.channel.kind,f.channel.col]:0,r2(f.blockStart-time)];});
 netSend({t:'snap',s:{pk:G.pk?[r1(G.pk.x),r1(G.pk.y),G.pk.k]:0,tm:r1(G.time),zt:[G.zt.x1,G.zt.y1,G.zt.x2,G.zt.y2].map(r1),f:F,
  p:G.proj.map(q=>[r1(q.x),r1(q.y),r1(q.vx),r1(q.vy),q.kind,q.col,q.r,r2(q.ang||0)]),
  z:G.zones.map(z=>[r1(z.x),r1(z.y),z.r,z.col,r2(z.t),z.delay,z.once?1:0,z.kind||'',z.dur||0,z.special?1:0]),
  d:G.decoys.map(d=>[d.owner.slot,r1(d.x),r1(d.y),d.face,r2(d.t)]),
  sl:G.slashes.filter(q=>q.t<0.05).map(q=>[r1(q.x),r1(q.y),r2(q.ang),r2(q.arc),q.r,q.col]),
  pp:NET.newPops.splice(0,30)}});}
function netApplySnap(S){NET.lastSnap=performance.now();G.pk=S.pk?{x:S.pk[0],y:S.pk[1],k:S.pk[2]}:null;G.time=S.tm;G.zt={x1:S.zt[0],y1:S.zt[1],x2:S.zt[2],y2:S.zt[3]};
 for(const e of S.f){const f=netSlotF(e[0]);if(!f)continue;f.nx=e[1];f.ny=e[2];if(e[3]<f.hp-0.5){f.flash=0.1;sparks(f.x,f.y-9,'#ffffff',5,80);sfx('hit');}f.hp=e[3];f.charge=e[4];
  if(f!==G.p){f.face=e[5];f.aim=e[6];f.blocking=!!(e[7]&1);f.blockStart=time+e[17];}const fl=e[7];f.stun=fl&2?0.1:0;f.freeze=fl&4?0.1:0;f.shieldT=fl&8?0.1:0;f.ghost=fl&16?0.1:0;f.big=fl&32?0.1:0;f.marked=fl&64?0.1:0;f.reflect=fl&128?0.1:0;f.inv=fl&512?0.1:0;f.broken=fl&1024?0.1:0;f.dashT=fl&4096?0.1:0;f.moving=!!(fl&8192);f.windT=fl&16384?0.1:0;
  if(fl&2048&&!f.dead){f.dead=true;f.hp=0;}f.guard=e[8];f.guardMax=e[9];f.cdA=e[10];f.cdB=e[11];f.cdDash=e[12];if(e[13]){f.emote=e[13];f.emoteT=0.3;}else f.emoteT=0;f.revealT=e[14];f.cover=e[15];f.channel=e[16]?{kind:e[16][0],col:e[16][1]}:null;}
 G.proj=S.p.map(q=>({x:q[0],y:q[1],vx:q[2],vy:q[3],kind:q[4],col:q[5],r:q[6],ang:q[7]}));
 G.zones=S.z.map(z=>({x:z[0],y:z[1],r:z[2],col:z[3],t:z[4],delay:z[5],once:!!z[6],kind:z[7],dur:z[8],special:!!z[9]}));
 G.decoys=S.d.map(d=>({owner:netSlotF(d[0])||G.p,x:d[1],y:d[2],face:d[3],t:d[4]}));
 for(const q of S.sl)G.slashes.push({x:q[0],y:q[1],ang:q[2],arc:q[3],r:q[4],col:q[5],t:0});
 for(const q of S.pp)G.pops.push({x:q[0],y:q[1],txt:q[2],col:q[3],sub:q[4],size:q[5],t:0});}
function netEnd(m){if(G.over)return;const w=netSlotF(m.w)||G.p;for(const k in (m.st||{})){const f=netSlotF(+k);if(f)f.stats=m.st[k];}G.over=true;G.winner=w;G.koT=0;G.shake=8;sfx('ko');}
function netHostEnd(){const st={};for(const f of G.all)st[f.slot]=f.stats||{};netSend({t:'end',w:G.winner.slot,st});}
// ---- telas online ----