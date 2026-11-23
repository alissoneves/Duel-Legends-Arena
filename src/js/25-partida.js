// ---------- PARTIDA ----------
class Fighter{
 constructor(def,x,y,bot,arena){this.def=def;this.x=x;this.y=y;this.vx=0;this.vy=0;this.hp=1000;this.charge=0;this.cdA=0;this.cdB=0;this.cdDash=0;this.face=bot?-1:1;this.aim=bot?Math.PI:0;
  this.slowT=0;this.slowF=1;this.stun=0;this.freeze=0;this.inv=0;this.dashT=0;this.dvx=0;this.dvy=0;this.flash=0;this.drain=0;this.haste=0;this.dashAtk=null;this.channel=null;this.bot=bot;this.walk=0;this.tpCd=0;this.trail=[];
  const m=arenaMod(arena,def.el);this.mod=m;this.st={atk:def.atk*m,def:def.def*m,vel:def.vel*m,esp:def.esp*m,esq:def.esq*m};
  this.guardMax=this.st.def*3;this.guard=this.guardMax;this.blocking=false;this.blockStart=-9;this.guardRegen=0;this.speed=(70+0.7*this.st.vel)*(def.melee?BAL.meleeSpeed:1)*BAL.move;this.dashCd=6-this.st.esq/25;this.ai={strafe:1,strafeT:0,react:0,thinkB:rnd(1,3)};}
}
function startMatch(silent){if(!silent){resetTouch();fev('f_start',1);}if(!silent)recReset();const a=pick.arena;setWorld(silent?'1x1':(pick.mode||'1x1'));
 G={arena:a,p:new Fighter(pick.me,BX1+(BX2-BX1)*0.3,(BY1+BY2)/2,false,a),b:new Fighter(pick.foe,BX1+(BX2-BX1)*0.7,(BY1+BY2)/2-10,true,a),proj:[],zones:[],parts:[],pops:[],slashes:[],time:120,shake:0,hitstop:0,over:false,koT:0,winner:null,
    zone:{x1:BX1,y1:BY1,x2:BX2,y2:BY2},zt:{x1:BX1,y1:BY1,x2:BX2,y2:BY2},shrinkT:40,pickT:20,pk:null,hz:buildHazards(a),decoys:[]};
 G.p.foe=G.b;G.b.foe=G.p;G.diff=1;G.tour=false;G.p.team=0;G.b.team=1;G.all=[G.p,G.b];
 if(isMulti()&&!silent){const ffa=pick.mode==='ffa';G.multi=true;G.duo=true;G.time=ffa||pick.mode==='5x5'?180:150;
  if(ffa){const list=[G.p,...pick.foes.map(c=>new Fighter(c,0,0,true,a))];list.forEach((f,i)=>{f.team=i;const ang=Math.PI+i*TAU/list.length;const cx0=(BX1+BX2)/2,cy0=(BY1+BY2)/2;f.x=cx0+Math.cos(ang)*(BX2-BX1)*0.38;f.y=cy0+Math.sin(ang)*(BY2-BY1)*0.36;f.face=Math.cos(ang)>0?-1:1;f.aim=Math.atan2(cy0-f.y,cx0-f.x);});G.b=list[1];G.all=list;G.ffa=true;}
  else{const mine=[G.p,...pick.allies.map(c=>new Fighter(c,0,0,true,a))],theirs=[G.b,...pick.foes.slice(1).map(c=>new Fighter(c,0,0,true,a))];
   const place=(arr,x,team,face)=>arr.forEach((f,i)=>{f.team=team;f.x=x+(i%2)*(team?18:-18);f.y=BY1+50+(BY2-BY1-100)*(arr.length===1?0.5:i/(arr.length-1));f.face=face;f.aim=face>0?0:Math.PI;});
   place(mine,BX1+(BX2-BX1)*0.16,0,1);place(theirs,BX1+(BX2-BX1)*0.84,1,-1);G.all=[...mine,...theirs];G.ally=mine[1];G.b2=theirs[1];}}
 if(!silent){const mg=myGear(!!pick.ranked);applyGear(G.p,mg);const P=gearTotal(mg),cap=pick.ranked?ITEM_CAP_RANK:ITEM_CAP;for(const f of G.all)if(f!==G.p)applyGear(f,botGear(f.def,Math.min(cap,Math.round(P*rnd(0.75,1.1)))));}
 const PAL=['#ff5a5a','#ffb02e','#c77dff','#ff7ad9','#4fd1ff','#ffe066','#b5ff6a'];G.all.forEach((f,i)=>{f.cover=-1;f.revealT=0;f.col=f===G.p?'#8ef0a0':G.ffa?PAL[(i-1)%PAL.length]:f.team===G.p.team?'#7fc8ff':'#ff6a6a';});
 G.bg=buildArena(a,WW,WH,{x1:BX1,y1:BY1,x2:BX2,y2:BY2});G.covers=silent?[]:buildCovers(G.all);G.cam={x:clamp(G.p.x-W/2,-8,WW-W+8),y:clamp(G.p.y-H/2-10,-46,WH-H+34)};
 G.tips={on:!silent&&save.opt.tips&&(save.games||0)<4,q:[],cur:null,done:{}};
 if(silent)return;state='countdown';cdT=3.2;save.seen[pick.me.id]=true;persist();}
function buildHazards(a){const h={lava:[],ice:[],cur:[],beam:[],mush:[]};const sx=(BX2-BX1)/(B0.x2-B0.x1),sy=(BY2-BY1)/(B0.y2-B0.y1),X=x=>BX1+(x-B0.x1)*sx,Y=y=>BY1+(y-B0.y1)*sy;
 if(a.hz==='lava'){h.lava=[{x:220,y:88,w:44,h:22},{x:96,y:200,w:40,h:20},{x:330,y:214,w:46,h:20}];}
 if(a.hz==='ice'){h.ice=[{x:150,y:70,w:80,h:50},{x:250,y:170,w:110,h:56}];}
 if(a.hz==='current'){h.cur=[{x:180,y:60,w:120,h:40,dx:0,dy:1},{x:180,y:190,w:120,h:40,dx:0,dy:-1}];}
 if(a.hz==='beam'){h.beam=[{x:150,w:22,off:0},{x:310,w:22,off:2}];}
 if(a.hz==='mush'){h.mush=[{x:70,y:70,o:1},{x:410,y:240,o:0},{x:410,y:70,o:3},{x:70,y:240,o:2}];}
 for(const k of ['lava','ice','cur'])h[k]=h[k].map(r=>Object.assign({},r,{x:X(r.x),y:Y(r.y),w:r.w*sx,h:r.h*sy}));h.beam=h.beam.map(b=>Object.assign({},b,{x:X(b.x),w:b.w*1.2}));h.mush=h.mush.map(m=>Object.assign({},m,{x:X(m.x),y:Y(m.y)}));
 return h;}
const COVER={vulcao:{n:'Rochas e fumaça'},recife:{n:'Corais e conchas'},tundra:{n:'Montes de neve'},templo:{n:'Juncos dourados'},castelo:{n:'Névoa'},bosque:{n:'Arbustos'},coliseu:{n:'Fardos de feno'}};
function buildCovers(spawns){const out=[];const n=Math.round(WW*WH/34000);let tries=0;
 while(out.length<n&&tries<600){tries++;const r=rnd(20,30),x=rnd(BX1+40,BX2-40),y=rnd(BY1+40,BY2-40);
  if(spawns.some(q=>Math.hypot(q.x-x,q.y-y)<r+60))continue;if(out.some(c=>Math.hypot(c.x-x,c.y-y)<c.r+r+34))continue;
  if([...G.hz.lava,...G.hz.ice,...G.hz.cur].some(q=>x>q.x-r-12&&x<q.x+q.w+r+12&&y>q.y-r-12&&y<q.y+q.h+r+12))continue;
  if(G.hz.mush.some(m=>Math.hypot(m.x-x,m.y-y)<r+24))continue;
  out.push({x,y,r,seed:Math.random()*100});}
 return out;}
function seenBy(f,team){if(f.team===team||G.over||f.cover<0||f.revealT>0)return true;return G.all.some(v=>v.team===team&&!v.dead&&(v.cover===f.cover||Math.hypot(v.x-f.x,v.y-f.y)<38));}
function drawCover(c,id,alpha){ctx.save();ctx.globalAlpha=alpha;const x=c.x,y=c.y,r=c.r,s=c.seed;const blob=(dx,dy,rr,col)=>{ctx.fillStyle=col;ctx.beginPath();ctx.arc(Math.round(x+dx),Math.round(y+dy),rr,0,TAU);ctx.fill();};
 const ring=(k,f)=>{for(let i=0;i<k;i++){const a=s+i*TAU/k;f(Math.cos(a)*r*0.55,Math.sin(a)*r*0.45,i);}};
 if(id==='bosque'){ctx.fillStyle='rgba(0,0,0,0.25)';ctx.beginPath();ctx.ellipse(x,y+r*0.45,r,r*0.4,0,0,TAU);ctx.fill();ring(6,(dx,dy)=>blob(dx,dy,r*0.5,'#123d26'));ring(6,(dx,dy)=>blob(dx*0.8,dy*0.8-3,r*0.42,'#1f6b3e'));blob(0,-4,r*0.45,'#2e8a50');ring(5,(dx,dy,i)=>{ctx.fillStyle=i%2?'#ff5a7a':'#7fe0a0';ctx.fillRect(Math.round(x+dx*0.7),Math.round(y+dy*0.7-5),2,2);});}
 else if(id==='recife'){ring(5,(dx,dy,i)=>{const col=['#ff7a8a','#ffb07a','#c77dff','#ff7a8a','#ffd07a'][i];ctx.fillStyle=col;for(let k=0;k<4;k++){ctx.fillRect(Math.round(x+dx+(k-1.5)*3),Math.round(y+dy-10-((k*7+i)%4)*2),2,12+((k+i)%3)*3);}blob(dx,dy,r*0.28,col);});
  ctx.fillStyle='#f2e6c9';ctx.beginPath();ctx.moveTo(x-r*0.45,y+4);ctx.lineTo(x,y-r*0.5);ctx.lineTo(x+r*0.45,y+4);ctx.closePath();ctx.fill();ctx.strokeStyle='#c9a77a';ctx.lineWidth=1;for(let k=-2;k<=2;k++){ctx.beginPath();ctx.moveTo(x,y-r*0.45);ctx.lineTo(x+k*r*0.18,y+3);ctx.stroke();}}
 else if(id==='tundra'){blob(0,4,r*0.95,'#a9bfd6');blob(-r*0.3,0,r*0.6,'#e9f2fa');blob(r*0.3,-2,r*0.62,'#ffffff');blob(0,-r*0.25,r*0.5,'#ffffff');ctx.fillStyle='#2f5d47';ctx.fillRect(Math.round(x+r*0.5),Math.round(y-r*0.9),4,r*0.8);ctx.fillStyle='#ffffff';ctx.fillRect(Math.round(x+r*0.5)-3,Math.round(y-r*0.9),10,3);}
 else if(id==='vulcao'){blob(-r*0.35,4,r*0.5,'#1f1517');blob(r*0.3,2,r*0.55,'#2a1c1e');blob(0,-2,r*0.45,'#3a2828');for(let i=0;i<4;i++){const t=(time*0.5+i/4+s)%1;ctx.fillStyle=`rgba(150,140,150,${0.55*(1-t)})`;ctx.beginPath();ctx.arc(x+Math.sin(s+i*2+time)*r*0.4,y-6-t*r*0.9,r*(0.35+t*0.35),0,TAU);ctx.fill();}ctx.fillStyle='#ff6a13';ctx.fillRect(Math.round(x-3),Math.round(y+2),3,2);}
 else if(id==='templo'){ctx.fillStyle='rgba(0,0,0,0.2)';ctx.beginPath();ctx.ellipse(x,y+r*0.4,r*0.9,r*0.35,0,0,TAU);ctx.fill();for(let i=0;i<14;i++){const dx=((i*37+s*10)%(r*1.8))-r*0.9,hh=r*0.8+((i*13)%9);const sw=Math.sin(time*2+i)*2;ctx.fillStyle=i%3?'#b89a3a':'#d9bd5a';ctx.fillRect(Math.round(x+dx),Math.round(y+r*0.35-hh),2,hh);ctx.fillStyle='#8a6a2a';ctx.fillRect(Math.round(x+dx+sw),Math.round(y+r*0.35-hh-3),3,4);}}
 else if(id==='castelo'){for(let i=0;i<6;i++){const a=s+i+time*0.4;ctx.fillStyle=`rgba(150,120,190,${0.32+0.08*Math.sin(time*2+i)})`;ctx.beginPath();ctx.arc(x+Math.cos(a)*r*0.4,y+Math.sin(a)*r*0.3,r*0.6,0,TAU);ctx.fill();}}
 else{blob(-r*0.4,2,r*0.42,'#b08a3a');blob(r*0.35,3,r*0.45,'#c29c48');blob(0,-3,r*0.48,'#d6b25a');ctx.fillStyle='#8a6a2a';for(let k=-1;k<=1;k++)ctx.fillRect(Math.round(x+k*r*0.35-4),Math.round(y-2),8,1);}
 ctx.restore();}
function inRect(f,r){return f.x>r.x&&f.x<r.x+r.w&&f.y>r.y&&f.y<r.y+r.h;}
function beamState(b){const c=(G.time+b.off)%4;return c<1?'warn':c<2?'on':'off';}

function popup(x,y,txt,col,sub,size){G.pops.push({x,y,t:0,txt,col,sub,size:size||8});if(G.net&&NET.role==='host')NET.newPops.push([Math.round(x),Math.round(y),txt,col,sub||'',size||8]);}
function sparks(x,y,col,n,sp){for(let i=0;i<(n||8);i++){const a=rnd(0,TAU),s=rnd(20,sp||90);G.parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:rnd(0.2,0.5),t:0,col,sz:Math.random()<0.5?2:1,g:0});}}
function hit(src,tgt,base,o){o=o||{};if(tgt.inv>0&&tgt.dashT>0&&!G.over&&!tgt.dead&&!tgt.dodged){tgt.dodged=true;(tgt.stats||(tgt.stats={})).dodges=(tgt.stats.dodges||0)+1;popup(tgt.x,tgt.y-34,'ESQUIVOU!','#8ef0a0');}
 if(tgt.inv>0||G.over||tgt.dead)return false;src.revealT=Math.max(src.revealT||0,1.2);tgt.revealT=Math.max(tgt.revealT||0,0.8);
 const atk=o.special?src.st.esp:src.st.atk;const el=mult(src.def.el,tgt.def.el);
 let dmg=Math.max(1,Math.round(base*(atk+100)/(tgt.st.def+100)*el*(TUNE[src.def.name]||1)*(src.power>0?1.4:1)*(tgt.marked>0?1.35:1)));
 if(tgt.reflect>0&&o.proj){sparks(tgt.x,tgt.y-8,'#ffd23f',10,90);return 'reflect';}
 if(tgt.def.melee&&o.proj)dmg=Math.max(1,Math.round(dmg*BAL.meleeProj));
 if(tgt.shieldT>0){dmg=Math.max(1,Math.round(dmg*0.25));o=Object.assign({},o,{slow:null,stun:0,freeze:0,kb:0,pull:0});}
 const fr=o.from||src;let blocked=false;
 if(tgt.blocking&&angDiff(Math.atan2(fr.y-(tgt.y-8),fr.x-tgt.x),tgt.aim)<=1.3){
  if(!o.special&&time-tgt.blockStart<=0.22){stat(tgt,'perfect',1);popup(tgt.x,tgt.y-34,'PERFEITO!','#ffd23f');sparks(tgt.x+Math.cos(tgt.aim)*10,tgt.y-8+Math.sin(tgt.aim)*10,'#ffd23f',16,120);sfx('reveal');tgt.charge=Math.min(100,tgt.charge+8);if(o.proj)return 'reflect';src.stun=Math.max(src.stun,0.7);return false;}
  blocked=true;const raw=dmg;dmg=Math.max(1,Math.round(dmg*(o.special?0.5:o.proj?0.1:0.25)));tgt.guard-=o.special?tgt.guardMax*0.6:raw*0.45;tgt.guardRegen=1;
  sparks(tgt.x+Math.cos(tgt.aim)*10,tgt.y-8+Math.sin(tgt.aim)*10,'#bfeaff',8,80);
  if(tgt.guard<=0){tgt.guard=0;tgt.blocking=false;tgt.broken=1.2;tgt.stun=Math.max(tgt.stun,1);popup(tgt.x,tgt.y-34,'GUARDA QUEBROU!','#ff7a7a');G.shake=Math.max(G.shake,4);sfx('big');}
  else{o=Object.assign({},o,{slow:null,stun:0,freeze:0,kb:o.kb?o.kb*0.3:0,pull:0});}}
 tgt.hp-=dmg;tgt.flash=0.1;stat(src,'dmg',dmg);stat(src,'hits',1);stat(tgt,'taken',dmg);if(blocked)stat(tgt,'blocked',1);tgt.lastBy=src;src.charge=Math.min(100,src.charge+4*cbk(src));tgt.charge=Math.min(100,tgt.charge+3*cbk(tgt));
 if(src.drain>0){const hl=Math.round(dmg*BAL.drain);src.hp=Math.min(1000,src.hp+hl);popup(src.x,src.y-26,'+'+hl,'#46d160');}
 if(o.slow){tgt.slowT=o.slow[1];tgt.slowF=o.slow[0];}else if(src.def.melee&&!o.proj&&!o.special&&!blocked&&tgt.slowT<=0){tgt.slowT=BAL.stick[0];tgt.slowF=BAL.stick[1];}
 if(o.stun){tgt.stun=Math.max(tgt.stun,o.stun);}
 if(o.freeze){tgt.freeze=Math.max(tgt.freeze,o.freeze);tgt.stun=Math.max(tgt.stun,o.freeze);}
 if(o.kb){const a=o.kbA!=null?o.kbA:Math.atan2(tgt.y-src.y,tgt.x-src.x);tgt.vx+=Math.cos(a)*o.kb;tgt.vy+=Math.sin(a)*o.kb;}
 if(o.pull){const a=Math.atan2(src.y-tgt.y,src.x-tgt.x);tgt.vx+=Math.cos(a)*o.pull;tgt.vy+=Math.sin(a)*o.pull;}
 popup(tgt.x+rnd(-4,4),tgt.y-24,'-'+dmg,blocked?'#bfeaff':el>1?'#ffd23f':el<1?'#9aa3c7':'#ffffff',blocked?'bloqueado':el>1?'SUPER!':el<1?'fraco':'',o.special?10:8);
 const mine=src===G.p||tgt===G.p;G.shake=Math.max(G.shake,o.special?5:el>1?3.5:mine?2.5:1.5);if(o.special){G.hitstop=0.07;sfx('big');}else{sfx('hit');if(mine&&!blocked)G.hitstop=Math.max(G.hitstop||0,el>1?0.05:0.03);}
 if(tgt===G.p&&!blocked)buzz(o.special?45:18);tgt.squash=0.12;
 sparks(tgt.x,tgt.y-9,o.col||'#ffffff',o.special?16:7,o.special?140:90);
 if(tgt.hp<=0)koCheck(tgt);return true;}
function cbk(f){return f.hp<300?1.6:f.hp<500?1.3:1;}
const PKS=[{k:'cura',n:'CURA',col:'#46d160',f:f=>{f.hp=Math.min(1000,f.hp+150);}},{k:'vel',n:'VELOCIDADE',col:'#ffd23f',f:f=>{f.slowT=5;f.slowF=1.35;}},{k:'carga',n:'CARGA',col:'#4fc3ff',f:f=>{f.charge=Math.min(100,f.charge+40);}}];
function drawPick(q){if(!q)return;const K=PKS.find(x=>x.k===q.k)||PKS[0],b=Math.sin(time*5)*2,y=q.y+b;ctx.fillStyle='rgba(0,0,0,0.35)';ctx.beginPath();ctx.ellipse(q.x,q.y+8,7,3,0,0,TAU);ctx.fill();
 const g=0.5+0.5*Math.sin(time*6);ctx.fillStyle=K.col;ctx.globalAlpha=0.25+0.2*g;ctx.beginPath();ctx.arc(q.x,y,11,0,TAU);ctx.fill();ctx.globalAlpha=1;ctx.fillStyle='#0b0c14';ctx.fillRect(Math.round(q.x)-6,Math.round(y)-6,12,12);ctx.fillStyle=K.col;ctx.fillRect(Math.round(q.x)-5,Math.round(y)-5,10,10);
 text(q.k==='cura'?'+':q.k==='vel'?'»':'⚡',q.x,y+4,9,'#0b0c14','center');}
function doEmote(f){if((f.emoteCd||0)>0)return;if(G&&G.net&&NET.role==='client'&&f===G.p){NET.cnt.e=(NET.cnt.e||0)+1;}const c=cosFind(save.cos.eq.emote||'e_gg');f.emote=c?c.n:'GG!';f.emoteT=2;f.emoteCd=4;}
function stat(f,k,v){const s=f.stats||(f.stats={});s[k]=(s[k]||0)+v;}
function envDamage(f,dps,dt,col){if(f.inv>0||G.over)return;f.hp-=dps*dt;f.envAcc=(f.envAcc||0)+dps*dt;if(f.envAcc>=20){popup(f.x,f.y-24,'-'+Math.round(f.envAcc),col||'#ff8a3d');f.envAcc=0;f.flash=0.06;}
 if(Math.random()<dt*20)sparks(f.x,f.y-2,col||'#ff6a13',1,30);if(f.hp<=0)koCheck(f);}
function enemiesOf(f){return G.all?G.all.filter(x=>x.team!==f.team&&!x.dead):[f.foe];}
function koCheck(t){if(t.dead)return;if(t.lastBy&&t.lastBy.team!==t.team)stat(t.lastBy,'kos',1);t.hp=0;t.dead=true;t.flash=0;t.trail=[];t.freeze=0;t.stun=0;t.blocking=false;t.channel=null;sfx('ko');popup(t.x,t.y-34,'NOCAUTE!','#ff7a7a');G.shake=Math.max(G.shake,6);G.flashT=0.18;buzz(t===G.p?[60,40,60]:35);
 const alive=G.all.filter(x=>!x.dead),teams=new Set(alive.map(x=>x.team));if(t===G.p&&G.multi&&!G.ffa&&alive.some(x=>x.team===G.p.team))popup(G.cam.x+W/2,G.cam.y+80,'VOCÊ CAIU! SEUS ALIADOS CONTINUAM','#ffd23f','',8);
 if(!alive.some(x=>x.team===G.p.team))endMatch(alive.sort((a,b)=>b.hp-a.hp)[0]||G.b);else if(teams.size<=1)endMatch(G.p);}
function endMatch(winner){if(G.over)return;G.over=true;G.winner=winner;G.koT=0;G.hitstop=0.25;G.shake=8;sfx('ko');}
