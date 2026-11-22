// ---------- ATUALIZAÇÃO ----------
function updateFighter(f,dt){
 f.cdA=Math.max(0,f.cdA-dt*BAL.atkRate);f.cdB=Math.max(0,f.cdB-dt*BAL.bRate);f.cdDash=Math.max(0,f.cdDash-dt);f.inv=Math.max(0,f.inv-dt);f.flash=Math.max(0,f.flash-dt);f.squash=Math.max(0,(f.squash||0)-dt);if(f.windT>0){f.windT-=dt;if(f.windT<=0){f.windT=0;fireC(f);}}f.stun=Math.max(0,f.stun-dt);f.freeze=Math.max(0,f.freeze-dt);
 f.slowT=Math.max(0,f.slowT-dt);if(f.slowT<=0)f.slowF=1;
 for(const k of ['shieldT','ghost','power','marked','reflect','big'])if(f[k]>0)f[k]=Math.max(0,f[k]-dt);
 if(f.broken>0){f.broken-=dt;if(f.broken<=0)f.guard=f.guardMax*0.5;}
 f.guardRegen=Math.max(0,f.guardRegen-dt);if(!f.blocking&&f.guardRegen<=0&&!(f.broken>0))f.guard=Math.min(f.guardMax,f.guard+f.guardMax*0.3*dt);f.drain=Math.max(0,f.drain-dt);f.haste=Math.max(0,f.haste-dt);f.tpCd=Math.max(0,f.tpCd-dt);f.spin=Math.max(0,(f.spin||0)-dt);
 if(!G.over)f.charge=Math.min(100,f.charge+f.st.esp/30*dt*BAL.chargeRate*cbk(f));
 let mv={x:0,y:0};
 if(f.remote){mv=netRemoteInput(f);}
 else if(!f.bot){
  if(keys.KeyW||keys.ArrowUp)mv.y-=1;if(keys.KeyS||keys.ArrowDown)mv.y+=1;if(keys.KeyA||keys.ArrowLeft)mv.x-=1;if(keys.KeyD||keys.ArrowRight)mv.x+=1;
  if(touch.joy!=null){mv.x=touch.joyV.x;mv.y=touch.joyV.y;}
  const l=Math.hypot(mv.x,mv.y);if(l>1){mv.x/=l;mv.y/=l;}
  f.aim=isTouch?autoAim(f):Math.atan2(mouse.y+G.cam.y-(f.y-8),mouse.x+G.cam.x-f.x);
  const wantBlock=!G.over&&f.stun<=0&&f.dashT<=0&&!f.channel&&!(f.broken>0)&&(keys.ShiftLeft||keys.ShiftRight||mouse.right||touch.blk!=null);
  if(wantBlock&&!f.blocking)f.blockStart=time;f.blocking=wantBlock;if(f.blocking)f.aim=Math.atan2(f.foe.y-f.y,f.foe.x-f.x);
  if(!G.over&&f.stun<=0){if(mouse.down||touch.aHeld!=null)doA(f);if(pressed.b)doB(f);if(pressed.c)doC(f);if(pressed.dash){const ml=Math.hypot(mv.x,mv.y);doDash(f,ml>0.2?Math.atan2(mv.y,mv.x):f.aim);}}
 } else if(!G.over&&f.stun<=0&&!f.dummy){botThink(f,dt);mv=f.mv||mv;}
 if(f.stun>0||G.over){mv={x:0,y:0};f.blocking=false;}
 if(Math.cos(f.aim)!==0)f.face=Math.cos(f.aim)>=0?1:-1;
 // canal (chamas ou feixe)
 if(f.channel){const ch=f.channel;ch.t-=dt;ch.tick-=dt;mv.x*=ch.kind==='beam'?0.1:0.3;mv.y*=ch.kind==='beam'?0.1:0.3;
   if(ch.kind==='beam'){for(let i=0;i<2;i++){const r=rnd(10,170);G.parts.push({x:f.x+Math.cos(f.aim)*r,y:f.y-8+Math.sin(f.aim)*r,vx:rnd(-20,20),vy:rnd(-20,20),life:0.25,t:0,col:Math.random()<0.5?'#ffffff':(ch.col||'#ffe14d'),sz:2,g:0});}
     if(ch.tick<=0){ch.tick=0.1;for(const t of enemiesOf(f)){const rx=t.x-f.x,ry=(t.y-8)-(f.y-8);const along=rx*Math.cos(f.aim)+ry*Math.sin(f.aim);const perp=Math.abs(-rx*Math.sin(f.aim)+ry*Math.cos(f.aim));if(along>0&&along<175&&perp<10)hit(f,t,21,{special:true,col:ch.col,from:{x:f.x,y:f.y-8}});}}}
   else{for(let i=0;i<3;i++){const a=f.aim+rnd(-0.35,0.35),sp2=rnd(80,150);G.parts.push({x:f.x+Math.cos(f.aim)*10,y:f.y-10+Math.sin(f.aim)*10,vx:Math.cos(a)*sp2,vy:Math.sin(a)*sp2,life:0.45,t:0,col:Math.random()<0.5?(ch.col||'#ff6a13'):'#ffd23f',sz:2,g:0});}
     if(ch.tick<=0){ch.tick=0.1;for(const t of enemiesOf(f)){const d=Math.hypot(t.x-f.x,t.y-f.y),a=Math.atan2(t.y-f.y,t.x-f.x);if(d<88&&angDiff(a,f.aim)<0.55)hit(f,t,22,{special:true,col:ch.col||'#ff6a13',from:{x:f.x,y:f.y-8}});}}}
   if(ch.t<=0||f.stun>0)f.channel=null;}
 // sequência de golpes
 if(f.flurry&&f.dashT<=0&&!G.over){f.flurry.t-=dt;if(f.flurry.t<=0){if(f.stun>0||f.flurry.n<=0){f.flurry=null;}else{const t=f.foe;const a=Math.atan2(t.y-f.y,t.x-f.x)+rnd(-0.3,0.3);dashAtk(f,a,Math.min(70,Math.hypot(t.x-f.x,t.y-f.y)+20),0.12,50,{special:true,col:ELCOL[f.def.el],kb:60});f.flurry.n--;f.flurry.t=0.06;}}}
 // movimento
 let ice=G.hz.ice.some(r=>inRect(f,r));let acc=ice?2.2:14;
 f.fireT=Math.max(0,(f.fireT||0)-dt);let sp=f.speed*f.slowF*(f.fireT>0?BAL.fireSlow[1]:1)*(f.haste>0?1.25:1)*(f.blocking?0.4:1);
 if(f.dashT>0){f.dashT-=dt;f.vx=f.dvx;f.vy=f.dvy;f.trail.push({x:f.x,y:f.y,t:0});
   if(f.dashAtk&&!f.dashAtk.done){for(const t of enemiesOf(f)){if(Math.hypot(t.x-f.x,t.y-f.y)<16){f.dashAtk.done=true;hit(f,t,f.dashAtk.base,Object.assign({kbA:Math.atan2(f.dvy,f.dvx)},f.dashAtk.o));break;}}}
   if(f.dashT<=0){f.vx*=0.3;f.vy*=0.3;f.dashAtk=null;}}
 else{f.vx=lerp(f.vx,mv.x*sp,clamp(acc*dt,0,1));f.vy=lerp(f.vy,mv.y*sp,clamp(acc*dt,0,1));}
 for(const c of G.hz.cur)if(inRect(f,c)){f.x+=c.dx*55*dt;f.y+=c.dy*55*dt;}
 f.x+=f.vx*dt;f.y+=f.vy*dt;f.x=clamp(f.x,BX1+7,BX2-7);f.y=clamp(f.y,BY1+16,BY2-2);
 const moving=Math.hypot(f.vx,f.vy)>15;f.walk=moving?f.walk+dt*12:0;
 f.trail=f.trail.filter(p=>(p.t+=dt)<0.18);
 // perigos
 if(G.hz.lava.some(r=>inRect(f,r)))envDamage(f,60,dt,'#ff6a13');
 for(const b of G.hz.beam)if(beamState(b)==='on'&&Math.abs(f.x-(b.x+b.w/2))<b.w/2)envDamage(f,110,dt,G.arena.id==='templo'?'#ffe14d':'#fff3b0');
 if(f.tpCd<=0)for(const m of G.hz.mush){if(Math.hypot(f.x-m.x,f.y-m.y)<9){const o=G.hz.mush[m.o];sparks(f.x,f.y-6,'#ff7ad9',14,80);f.x=o.x;f.y=o.y+12;sparks(f.x,f.y-6,'#ff7ad9',14,80);f.tpCd=2;break;}}
 const z=G.zone;if(f.x<z.x1||f.x>z.x2||f.y<z.y1||f.y>z.y2)envDamage(f,80,dt,'#ff5a5a');
}