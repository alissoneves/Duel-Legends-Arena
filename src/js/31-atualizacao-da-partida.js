// ---------- ATUALIZAÇÃO DA PARTIDA ----------
function update(dt){
 time+=dt;
 if(state==='countdown'){const prev=Math.ceil(cdT);cdT-=dt;if(Math.ceil(cdT)!==prev&&cdT>0)sfx('beep');if(cdT<=0){state='fight';sfx('go');}updateAmb(dt);return;}
 if(state==='fight'&&G&&G.net&&NET.role==='client'){netClientUpdate(dt);return;}
 if(state!=='fight'||(paused&&!(G&&G.net))){if(state==='draw')updateDraw(dt);if(state==='result')resultT+=dt;return;}
 if(G.hitstop>0){G.hitstop-=dt;dt*=G.over?0.15:0.05;}
 if(!G.over){G.time-=dt;if(G.time<=0){G.time=0;{const sm={};for(const x of G.all)sm[x.team]=(sm[x.team]||0)+(x.dead?0:x.hp);let bt=G.p.team;for(const k in sm)if(sm[k]>sm[bt])bt=+k;endMatch(bt===G.p.team?G.p:G.all.filter(x=>x.team===bt).sort((a,b)=>b.hp-a.hp)[0]);}}
  G.shrinkT-=dt;if(!G.zWarn&&G.shrinkT<=5&&G.shrinkT>4){G.zWarn=true;popup(G.cam.x+W/2,G.cam.y+70,'A ARENA FECHA EM 5 SEGUNDOS','#ff8a3d','',8);}if(G.shrinkT<=0){G.shrinkT=12;const z=G.zt,w=z.x2-z.x1,h=z.y2-z.y1;if(w>Math.max(150,(BX2-BX1)*0.32)){const ix=w*0.09,iy=h*0.09;G.zt={x1:z.x1+ix,y1:z.y1+iy,x2:z.x2-ix,y2:z.y2-iy};popup(G.cam.x+W/2,G.cam.y+70,'A ARENA ESTÁ FECHANDO','#ff8a3d','',8);}}}
 if(!G.tut&&!G.over){G.pickT-=dt;if(G.pickT<=0&&!G.pk){G.pickT=20;const z=G.zt,K=PKS[Math.floor(Math.random()*PKS.length)];G.pk={x:(z.x1+z.x2)/2,y:(z.y1+z.y2)/2+6,k:K.k};popup(G.pk.x,G.pk.y-20,K.n+' NO CENTRO!',K.col,'',8);sfx('reveal');}
   if(G.pk){const q=G.pk;for(const f of G.all){if(f.dead||Math.hypot(f.x-q.x,f.y-4-q.y)>14)continue;const K=PKS.find(x=>x.k===q.k);K.f(f);popup(f.x,f.y-34,K.n+'!',K.col,'',8);sparks(q.x,q.y,K.col,14,110);sfx('go');G.pk=null;if(f===G.p)buzz(25);break;}}}
for(const k of ['x1','y1','x2','y2'])G.zone[k]=lerp(G.zone[k],G.zt[k],clamp(dt*0.4,0,1));
 try{updateTips(dt);}catch(e){}
 if(G.tut)updateTut(dt);
 for(const f of G.all){f.emoteT=Math.max(0,(f.emoteT||0)-dt);f.emoteCd=Math.max(0,(f.emoteCd||0)-dt);f.revealT=Math.max(0,(f.revealT||0)-dt);f.cover=-1;if(f.dead)continue;for(let i=0;i<G.covers.length;i++){const c=G.covers[i];if(Math.hypot(f.x-c.x,(f.y-4)-c.y)<c.r-2){f.cover=i;break;}}}
 for(const f of G.all){if(f.dead)continue;const en=enemiesOf(f);if(en.length){const vis=en.filter(e=>seenBy(e,f.team));const pool=vis.length?vis:en;let best=pool[0],bd=1e9;for(const e of pool){const dd=Math.hypot(e.x-f.x,e.y-f.y);if(dd<bd){bd=dd;best=e;}}f.foe=best;f.blind=!vis.length;}}
 {let fo=G.p;if(G.p.dead){fo=G.all.find(x=>!x.dead&&x.team===G.p.team)||G.p.foe||G.p;}const tx=clamp(fo.x-W/2,-8,WW-W+8),ty=clamp(fo.y-H/2-10,-46,WH-H+34);G.cam.x=lerp(G.cam.x,tx,clamp(dt*6,0,1));G.cam.y=lerp(G.cam.y,ty,clamp(dt*6,0,1));}
 for(const f of G.all)if(!f.dead)updateFighter(f,dt);
 // separar personagens
 for(let i=0;i<G.all.length;i++)for(let j=i+1;j<G.all.length;j++){const a=G.all[i],b=G.all[j];if(a.dead||b.dead)continue;const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1;if(d<14&&a.dashT<=0&&b.dashT<=0){const push=(14-d)/2;a.x-=dx/d*push;a.y-=dy/d*push;b.x+=dx/d*push;b.y+=dy/d*push;}}
 // projéteis
 for(const p of G.proj){p.t+=dt;
  if(p.home){const tt=p.owner.foe;const want=Math.atan2(tt.y-8-p.y,tt.x-p.x);let cur=Math.atan2(p.vy,p.vx);let dd=want-cur;while(dd>Math.PI)dd-=TAU;while(dd<-Math.PI)dd+=TAU;cur+=clamp(dd,-3*dt,3*dt);const sp=Math.hypot(p.vx,p.vy);p.vx=Math.cos(cur)*sp;p.vy=Math.sin(cur)*sp;p.ang=cur;}
  if(p.ret&&p.t>0.45){if(!p.back){p.back=true;p.hitSet=new Set();}const ow=p.owner;const a=Math.atan2(ow.y-8-p.y,ow.x-p.x);const sp=Math.hypot(p.vx,p.vy);p.vx=Math.cos(a)*sp;p.vy=Math.sin(a)*sp;if(Math.hypot(ow.x-p.x,ow.y-8-p.y)<8){p.dead=true;continue;}}
  p.x+=p.vx*dt;p.y+=p.vy*dt;
  if(p.kind==='fire'&&Math.random()<0.6)G.parts.push({x:p.x,y:p.y,vx:rnd(-10,10),vy:rnd(-20,0),life:0.25,t:0,col:Math.random()<0.5?'#ff6a13':'#ffd23f',sz:1,g:0});
  if(p.kind==='wave'&&Math.random()<0.9)G.parts.push({x:p.x+rnd(-p.r,p.r)*0.6,y:p.y+rnd(-p.r,p.r),vx:-p.vx*0.2,vy:rnd(-20,20),life:0.4,t:0,col:Math.random()<0.5?'#ffffff':'#7fd0ff',sz:2,g:0});
  if(p.kind==='spark'&&Math.random()<0.5)G.parts.push({x:p.x,y:p.y,vx:0,vy:0,life:0.15,t:0,col:'#fff7b0',sz:1,g:0});
  if(p.x<BX1-30||p.x>BX2+30||p.y<BY1-30||p.y>BY2+30||p.t>p.life){p.dead=true;if(!p.pierce)sparks(p.x,p.y,p.col,4,40);continue;}
  for(const t of enemiesOf(p.owner)){if(p.dead)break;if(!p.hitSet.has(t)&&Math.hypot(t.x-p.x,(t.y-8)-p.y)<p.r+7){p.hitSet.add(t);const far=p.fall&&p.t*Math.hypot(p.vx,p.vy)>110;const ok=hit(p.owner,t,p.base*(p.fall?(far?BAL.projFar:BAL.projNear):1),{special:p.special,slow:p.slow,stun:p.stun,freeze:p.freeze,pull:p.pull,kb:p.kb,kbA:p.kb?Math.atan2(p.vy,p.vx):undefined,col:p.col,proj:true,from:{x:p.x-p.vx*0.05,y:p.y-p.vy*0.05}});
   if(ok==='reflect'){p.owner=t;p.vx*=-1.15;p.vy*=-1.15;p.ang+=Math.PI;p.t=0;p.hitSet=new Set([t]);break;}if(!p.pierce&&ok!==false)p.dead=true;}}}
 G.proj=G.proj.filter(p=>!p.dead);
 // zonas
 for(const z of G.zones){z.t+=dt;const ens=enemiesOf(z.owner);
  if(z.t>=z.delay){if(z.once&&!z.done){z.done=true;G.shake=Math.max(G.shake,z.special?6:3);sparks(z.x,z.y,z.col,z.special?30:12,160);if(z.kind==='bolt')sfx('big');for(const t of ens)if(Math.hypot(t.x-z.x,t.y-z.y)<z.r+6)hit(z.owner,t,z.base,{special:z.special,stun:z.stun,freeze:z.freeze,col:z.col,kb:z.kb,kbA:Math.atan2(t.y-z.y,t.x-z.x),from:{x:z.owner.x,y:z.owner.y-8}});}
   if(!z.once){z.tickT-=dt;if(z.tickT<=0){z.tickT=z.tick;for(const t of ens)if(Math.hypot(t.x-z.x,t.y-z.y)<z.r+6)hit(z.owner,t,z.base,{col:z.col,slow:[0.75,0.6],from:{x:z.owner.x,y:z.owner.y-8}});}}}
  if(z.t>z.delay+z.dur+(z.once?0.35:0))z.dead=true;}
 G.zones=G.zones.filter(z=>!z.dead);
 for(const d of G.decoys)d.t-=dt;G.decoys=G.decoys.filter(d=>d.t>0);
 for(const s of G.slashes)s.t+=dt;G.slashes=G.slashes.filter(s=>s.t<0.14);
 updateAmb(dt);
 for(const p of G.pops)p.t+=dt;G.pops=G.pops.filter(p=>p.t<0.9);
 G.shake=Math.max(0,G.shake-dt*20);
 if(G.net&&NET.role==='host')netHostTick(dt);
 if(G.over){G.koT+=dt;if(G.koT>1.6){if(G.net&&NET.role==='host')netHostEnd();state='result';resultT=0;finishResult();}}
 pressed.b=pressed.c=pressed.dash=false;
}
function updateAmb(dt){if(!G)return;for(const p of G.parts){p.t+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=(p.g||0)*dt;p.vx*=0.96;p.vy*=0.96;}G.parts=G.parts.filter(p=>p.t<p.life);
 const a=G.arena.amb;if(Math.random()<dt*10){
  if(a==='ember')G.parts.push({x:rnd(G.cam.x,G.cam.x+W),y:G.cam.y+H,vx:rnd(-8,8),vy:rnd(-30,-15),life:rnd(2,4),t:0,col:Math.random()<0.5?'#ff8a3d':'#ffd23f',sz:1,g:0,amb:1});
  if(a==='snow')G.parts.push({x:rnd(G.cam.x,G.cam.x+W),y:G.cam.y-5,vx:rnd(-10,5),vy:rnd(15,30),life:rnd(4,8),t:0,col:'#ffffff',sz:Math.random()<0.3?2:1,g:0,amb:1,nod:1});
  if(a==='bubble')G.parts.push({x:rnd(G.cam.x,G.cam.x+W),y:G.cam.y+H,vx:rnd(-4,4),vy:rnd(-25,-12),life:rnd(3,6),t:0,col:'rgba(160,220,255,0.7)',sz:2,g:0,amb:1});
  if(a==='mote'||a==='dust')G.parts.push({x:rnd(G.cam.x,G.cam.x+W),y:rnd(G.cam.y,G.cam.y+H),vx:rnd(-5,5),vy:rnd(-6,-2),life:rnd(2,4),t:0,col:a==='mote'?'#fff3b0':'#8a7a9a',sz:1,g:0,amb:1});
  if(a==='firefly')G.parts.push({x:rnd(G.cam.x,G.cam.x+W),y:rnd(G.cam.y,G.cam.y+H),vx:rnd(-8,8),vy:rnd(-8,8),life:rnd(2,4),t:0,col:'#d8ff7a',sz:1,g:0,amb:1});}}
function tip(key,txt){const T2=G.tips;if(!T2||!T2.on||T2.done[key])return;T2.done[key]=true;T2.q.push({txt,t:0});}
function updateTips(dt){const T2=G.tips;if(!T2||!T2.on)return;const p=G.p,ft=(G.ftime=(G.ftime||0)+dt);
 const tc=isTouch;tip('move',tc?'Arraste o joystick à esquerda para andar':'Ande com WASD e mire com o mouse');
 if(ft>4)tip('a',tc?'Toque em A para atacar (mira automática)':'Clique para usar o ataque A');
 if(ft>9)tip('b',tc?'B é sua habilidade: ela tem recarga':'Aperte E para usar a habilidade B');
 if(p.charge>=100)tip('c',tc?'Especial pronto! Toque em C':'Especial pronto! Aperte Q');
 if(G.proj.some(q=>q.owner.team!==p.team&&Math.hypot(q.x-p.x,q.y-8-q.y*0+0-p.y+8)<80))tip('blk',tc?'Segure BLOQ virado para o ataque. Na hora exata, rebate!':'Segure Shift para bloquear. Na hora exata, rebate o tiro!');
 if(ft>14)tip('dash',tc?'DASH desvia de tudo por um instante':'Espaço dá um dash e desvia de tudo por um instante');
 if(p.cover>=0)tip('cover','Escondido! O rival não te vê aqui dentro');
 if(G.all.some(f=>f.team!==p.team&&!f.dead&&seenBy(f,p.team)&&(f.x<G.cam.x||f.x>G.cam.x+W||f.y<G.cam.y||f.y>G.cam.y+H)))tip('arrow','A seta na borda mostra onde está o rival');
 if(G.zt.x1>BX1+1)tip('zone','A arena está fechando: fique longe da área vermelha');
 if(!T2.cur&&T2.q.length)T2.cur=T2.q.shift();if(T2.cur){T2.cur.t+=dt;if(T2.cur.t>3.6)T2.cur=null;}}