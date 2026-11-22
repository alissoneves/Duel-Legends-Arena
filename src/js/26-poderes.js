// ---------- PODERES ----------
function shoot(f,ang,o){const pr=(Object.assign({x:f.x+Math.cos(ang)*8,y:f.y-8+Math.sin(ang)*8,vx:Math.cos(ang)*o.sp,vy:Math.sin(ang)*o.sp,owner:f,life:o.life||1.2,t:0,hitSet:new Set(),ang},o));sfx('shoot');pr.vx*=BAL.proj;pr.vy*=BAL.proj;pr.life=(o.life||1.2)/BAL.proj;G.proj.push(pr);}
const TUNE={'Apolo':0.8,'Fênix':0.85,'Rainha da Neve':0.9,'Rei Arthur':0.93,'Kraken':0.95,'Saci':0.92,'Lobisomem':0.93,'Gênio da Lâmpada':0.93,'Guardiã Celestial':0.93,'Valquíria':1.1,'Árvore Ancestral':1.1,'Sherlock Holmes':1.12,'Drácula':1.1,'Merlin':1.18,'Rasga-Mortalha':1.12,'Benzedeira':1.15,'Mecânica Engenhoca':1.18,'Mímico':1.1};
// ritmo: move/proj = velocidade de movimento e de projéteis; atkRate/bRate/chargeRate = rapidez das recargas; react = tempo de reação dos bots
// corpo a corpo x distância: fireSlow = lentidão de quem atira; meleeDash = dash maior e mais frequente; meleeProj = dano de tiro recebido por corpo a corpo; stick = lentidão do golpe corpo a corpo
const BAL={fireSlow:[0.28,0.68],meleeDash:[80,0.7],meleeProj:0.88,stick:[0.35,0.78],move:0.75,proj:0.72,atkRate:0.72,bRate:0.8,chargeRate:0.8,react:1.3,meleeMul:1.3,meleeRange:5,lunge:100,meleeSpeed:1.15,projNear:0.8,projFar:0.65,healC:150,buffB:50,drain:0.85,gapDash:0.04};
function melee(f,range,arc,base,o){base*=BAL.meleeMul;range+=BAL.meleeRange;f.vx+=Math.cos(f.aim)*BAL.lunge;f.vy+=Math.sin(f.aim)*BAL.lunge;G.slashes.push({x:f.x,y:f.y-8,ang:f.aim,arc,r:range+6,t:0,col:o.col||'#ffffff'});sfx('shoot');
 for(const t of enemiesOf(f)){const d=Math.hypot(t.x-f.x,t.y-f.y);const a=Math.atan2(t.y-f.y,t.x-f.x);if(d<=range+8&&angDiff(a,f.aim)<=arc/2+0.2)hit(f,t,base,Object.assign({from:{x:f.x,y:f.y-8}},o));}}
function zone(f,x,y,r,o){G.zones.push(Object.assign({x,y,r,owner:f,t:0,delay:0,dur:0.01,tick:0,tickT:0,once:true,done:false},o));}
function dashAtk(f,ang,dist,dur,base,o){f.dashT=dur;f.dvx=Math.cos(ang)*dist/dur;f.dvy=Math.sin(ang)*dist/dur;f.inv=Math.max(f.inv,dur);f.dashAtk={base,o,done:false};sfx('dash');}
const POW={
 saci:{
  a(f){shoot(f,f.aim,{sp:230,r:3,base:55,kind:'fire',col:'#ff6a13',fall:true});f.cdA=0.4;},
  b(f){dashAtk(f,f.aim,90,0.28,90,{col:'#c9cbe6',kb:120});f.spin=0.28;f.cdB=5;},
  c(f){const t=f.foe;const px=f.x,py=f.y;sparks(px,py-8,'#e0393e',20,120);sparks(t.x,t.y-8,'#e0393e',20,120);f.x=t.x;f.y=t.y;t.x=px;t.y=py;
       const stolen=Math.min(40,t.charge);t.charge-=stolen;hit(f,t,200,{special:true,stun:0.6,col:'#e0393e'});f.charge=Math.min(100,stolen);popup(f.x,f.y-34,'TRAVESSURA!','#ff7a7a');}},
 iara:{
  a(f){shoot(f,f.aim,{sp:150,r:4,base:60,kind:'bubble',col:'#7fd0ff',slow:[0.7,1],fall:true});f.cdA=0.45;},
  b(f){shoot(f,f.aim,{sp:200,r:6,base:70,kind:'ring',col:'#7fe0c8',pull:220,stun:0.4,life:0.9});f.cdB=5;},
  c(f){shoot(f,f.aim,{sp:150,r:24,base:250,kind:'wave',col:'#4fa8ff',special:true,pierce:true,kb:260,life:2.4});f.charge=0;}},
 mula:{
  a(f){melee(f,26,1.9,75,{col:'#ff8a3d',kb:80});f.cdA=0.5;},
  b(f){dashAtk(f,f.aim,110,0.3,100,{col:'#ff6a13',kb:220});f.cdB=5;},
  c(f){f.channel={t:1.6,tick:0,kind:'flame'};f.charge=0;sfx('special');}},
 yeti:{
  a(f){melee(f,28,1.8,80,{col:'#dff3ff',kb:90});f.cdA=0.55;},
  b(f){shoot(f,f.aim,{sp:130,r:8,base:100,kind:'snow',col:'#ffffff',stun:0.7,life:1.6});f.cdB=5;},
  c(f){const t=f.foe;zone(f,t.x,t.y,40,{delay:0.9,base:250,special:true,freeze:1.5,col:'#9fe3ff',kind:'avalanche'});f.charge=0;sfx('special');}},
 zeus:{
  a(f){shoot(f,f.aim,{sp:280,r:3,base:50,kind:'spark',col:'#ffe14d',fall:true});f.cdA=0.35;},
  b(f){const t=f.foe;const x=clamp(t.x,BX1+20,BX2-20),y=clamp(t.y,BY1+20,BY2-20);zone(f,x,y,30,{delay:0.3,dur:3,once:false,tick:0.5,base:24,col:'#b9a6ff',kind:'cloud'});f.cdB=5;},
  c(f){const t=f.foe;zone(f,t.x,t.y,22,{delay:0.8,base:260,special:true,stun:0.5,col:'#ffe14d',kind:'bolt'});f.charge=0;sfx('special');}},
 dracula:{
  a(f){melee(f,24,1.7,70,{col:'#ff4d6a'});f.cdA=0.42;},
  b(f){for(const d of [-0.3,0,0.3])shoot(f,f.aim+d,{sp:190,r:3,base:40,kind:'bat',col:'#2a1830',life:1});f.cdB=5;},
  c(f){f.drain=6;f.haste=6;f.charge=0;sfx('special');sparks(f.x,f.y-8,'#e0396a',24,120);popup(f.x,f.y-34,'SEDE DE SANGUE!','#ff7a9a');}},
};

const cx=(v)=>clamp(v,BX1+16,BX2-16),cy=(v)=>clamp(v,BY1+18,BY2-6);
function genA(f){const k=f.def.kit.A,col=ELCOL[f.def.el];
 if(k.t==='melee'){melee(f,k.r||26,(k.r||26)>30?1.1:1.8,75,{col,kb:80});f.cdA=0.5;}
 else{const n=k.spread||1;for(let i=0;i<n;i++)shoot(f,f.aim+(i-(n-1)/2)*0.22,{sp:k.kind==='arrow'?225:200,r:3,base:n>1?30:55,kind:k.kind||'orb',col,fall:true,ret:k.ret,life:k.ret?1.4:1.2});f.cdA=n>1?0.5:0.42;}}
function genB(f,t){const col=ELCOL[f.def.el],o=f.foe;
 switch(t){
  case 'dash':dashAtk(f,f.aim,100,0.28,90,{col,kb:180});break;
  case 'blink':{const a=f.def.melee?Math.atan2(o.y-f.y,o.x-f.x):f.aim+Math.PI;sparks(f.x,f.y-8,col,14,90);if(f.def.melee){f.x=cx(o.x-Math.cos(a)*14);f.y=cy(o.y-Math.sin(a)*14);f.cdA=0;}else{f.x=cx(f.x+Math.cos(a)*90);f.y=cy(f.y+Math.sin(a)*90);}sparks(f.x,f.y-8,col,14,90);f.inv=0.25;sfx('dash');break;}
  case 'shield':f.shieldT=2.2;sfx('reveal');break;
  case 'stealth':f.ghost=1.8;f.inv=0.9;f.haste=Math.max(f.haste,1.8);sfx('dash');break;
  case 'decoy':{G.decoys.push({x:f.x,y:f.y,owner:f,t:2.5,face:f.face});const a=f.aim+Math.PI/2*(Math.random()<0.5?1:-1);f.x=cx(f.x+Math.cos(a)*55);f.y=cy(f.y+Math.sin(a)*55);f.ghost=0.8;f.inv=0.3;sparks(f.x,f.y-8,col,10,60);sfx('dash');break;}
  case 'pull':shoot(f,f.aim,{sp:200,r:6,base:70,kind:'ring',col,pull:220,stun:0.4,life:0.9});break;
  case 'root':shoot(f,f.aim,{sp:180,r:5,base:60,kind:'web',col:'#f2f2f2',stun:1,life:1.1});break;
  case 'mark':o.marked=5;o.slowT=1.5;o.slowF=0.75;popup(o.x,o.y-36,'MARCADO','#ffd23f');sfx('reveal');break;
  case 'stun':melee(f,52,1.3,50,{col,stun:0.8});break;
  case 'zone':zone(f,cx(o.x),cy(o.y),30,{delay:0.3,dur:3,once:false,tick:0.5,base:24,col,kind:'area'});break;
  case 'volley':for(const k of [-0.3,0,0.3])shoot(f,f.aim+k,{sp:200,r:3,base:40,kind:'orb',col,life:1});break;
  case 'buff':f.hp=Math.min(1000,f.hp+BAL.buffB);popup(f.x,f.y-26,'+'+BAL.buffB,'#46d160');f.haste=2;sfx('reveal');break;
  case 'spin':f.spin=0.3;zone(f,f.x,f.y-4,32,{delay:0,base:90,col,kb:180,kind:'nova'});break;
  case 'summon':for(let i=0;i<2;i++)shoot(f,f.aim+(i?0.7:-0.7),{sp:120,r:4,base:50,kind:'orb',col,life:2.6,home:1});break;
  case 'copy':{const ft=o.def.hand?'dash':o.def.kit.B;genB(f,ft==='copy'?'dash':ft);break;}
  default:shoot(f,f.aim,{sp:160,r:7,base:100,kind:'orb',col,stun:0.5,life:1.4,ret:f.def.kit.Bret});}}
function genC(f,t){const col=ELCOL[f.def.el],o=f.foe;sfx('special');
 switch(t){
  case 'swap':POW.saci.c(f);break;
  case 'copy':{const ft=o.def.hand?'bigzone':o.def.kit.C;genC(f,ft==='copy'?'bigzone':ft);f.power=Math.max(f.power||0,4);break;}
  case 'heal':f.hp=Math.min(1000,f.hp+BAL.healC);popup(f.x,f.y-26,'+'+BAL.healC,'#46d160');f.shieldT=1.5;sparks(f.x,f.y-8,'#46d160',24,100);break;
  case 'drain':f.drain=6;f.haste=6;sparks(f.x,f.y-8,'#e0396a',24,120);break;
  case 'rage':f.power=6;f.haste=6;f.big=6;zone(f,f.x,f.y-4,44,{delay:0,base:110,special:true,col,kb:200,kind:'nova'});sparks(f.x,f.y-8,col,24,120);break;
  case 'fortress':f.shieldT=3;f.reflect=3;break;
  case 'flurry':f.flurry={n:5,t:0};break;
  case 'beam':f.channel={t:1.3,tick:0,kind:'beam',col};break;
  case 'cone':f.channel={t:1.6,tick:0,kind:'flame',col};break;
  case 'wave':shoot(f,f.aim,{sp:160,r:22,base:250,kind:'wave',col,special:true,pierce:true,kb:240,life:2.4});break;
  case 'summon':for(let i=0;i<5;i++)shoot(f,f.aim+(i-2)*0.5,{sp:110+i*8,r:4,base:46,kind:'orb',col,special:true,life:3,home:1});break;
  case 'trap':shoot(f,f.aim,{sp:170,r:9,base:200,kind:'orb',col,special:true,freeze:1.5,life:1.6});break;
  case 'storm':for(let i=0;i<6;i++)zone(f,cx(o.x+rnd(-30,30)),cy(o.y+rnd(-24,24)),18,{delay:0.5+i*0.2,base:75,special:true,col,kind:'bolt'});break;
  case 'nova':zone(f,f.x,f.y-4,58,{delay:0.35,base:230,special:true,col,kb:220,kind:'nova'});break;
  default:zone(f,o.x,o.y,38,{delay:0.85,base:250,special:true,stun:0.5,col,kind:'blast'});}}
function announce(f,i){if(!f.def.hand)popup(f.x,f.y-36,f.def.pw[i].toUpperCase(),ELCOL[f.def.el]||'#ffffff','',6);}
function doA(f){if(f.blocking||f.cdA>0||f.stun>0||f.dashT>0||f.channel)return;tutEv(f,'a');f.revealT=Math.max(f.revealT||0,0.6);if(f.def.hand)POW[f.def.id].a(f);else genA(f);if(!f.def.melee)f.fireT=BAL.fireSlow[0];}
function doB(f){if(f.blocking||f.cdB>0||f.stun>0||f.dashT>0||f.channel)return;tutEv(f,'b');f.revealT=Math.max(f.revealT||0,0.6);if(f.def.hand)POW[f.def.id].b(f);else{genB(f,f.def.kit.B);f.cdB=5;announce(f,1);}}
const WIND=0.35;
function doC(f){if(f.blocking||f.charge<100||f.stun>0||f.dashT>0||f.channel||f.windT>0)return;tutEv(f,'c');f.charge=0;f.windT=WIND;f.revealT=Math.max(f.revealT||0,1);sfx('dash');}
function fireC(f){if(f.dead)return;if(f.stun>0){f.charge=50;popup(f.x,f.y-34,'INTERROMPIDO!','#ff9a9a');return;}stat(f,'specials',1);G.shake=Math.max(G.shake,3);if(f.def.hand)POW[f.def.id].c(f);else{genC(f,f.def.kit.C);announce(f,2);}}
function doDash(f,ang){if(f.cdDash>0||f.stun>0||f.dashT>0||f.channel)return;tutEv(f,'dash');f.blocking=false;const inv=0.2+(f.st.esq>=100?0.05:0);const dd=f.def.melee?BAL.meleeDash[0]:60;f.dashT=0.2;f.dvx=Math.cos(ang)*dd/0.2;f.dvy=Math.sin(ang)*dd/0.2;f.inv=inv;f.dodged=false;if(f===G.p&&save.cos.eq.trail){const c=cosFind(save.cos.eq.trail);for(let k=0;k<10;k++)G.parts.push({x:f.x+rnd(-4,4),y:f.y-8+rnd(-6,6),vx:-Math.cos(ang)*rnd(20,60),vy:-Math.sin(ang)*rnd(20,60),life:0.5,t:0,col:cosColor(c.col,time+k*0.1),sz:2});}f.cdDash=f.dashCd*(f.def.melee?BAL.meleeDash[1]:1);f.dashAtk=null;sfx('dash');}
