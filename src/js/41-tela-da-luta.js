// ---------- TELA DA LUTA E HUD ----------
function renderGame(){const g=G,a=g.arena;ctx.save();
 if(g.shake>0)ctx.translate(Math.round(rnd(-g.shake,g.shake)),Math.round(rnd(-g.shake,g.shake)));
 ctx.translate(-Math.round(g.cam.x),-Math.round(g.cam.y));
 ctx.fillStyle=a.wall;ctx.fillRect(-60,-80,WW+120,WH+160);ctx.drawImage(g.bg,0,0);
 // perigos
 for(const r of g.hz.lava){ctx.fillStyle='#7a1f12';ctx.fillRect(r.x-3,r.y,r.w+6,r.h);ctx.fillRect(r.x,r.y-3,r.w,r.h+6);ctx.fillStyle='#ff6a13';ctx.fillRect(r.x,r.y,r.w,r.h);ctx.fillStyle='#ffa62b';ctx.fillRect(r.x+5,r.y+4,r.w-14,r.h-9);
  const s=Math.sin(time*3+r.x)*3;ctx.fillStyle='#ffe066';ctx.fillRect(r.x+10+s,r.y+7,6,2);ctx.fillRect(r.x+r.w-18-s,r.y+r.h-8,5,2);}
 for(const r of g.hz.ice){ctx.fillStyle='rgba(140,200,240,0.55)';ctx.fillRect(r.x,r.y,r.w,r.h);ctx.fillStyle='rgba(255,255,255,0.6)';ctx.fillRect(r.x+6,r.y+6,14,2);ctx.fillRect(r.x+r.w-30,r.y+r.h-12,18,2);}
 for(const c of g.hz.cur){ctx.fillStyle='rgba(120,200,255,0.18)';ctx.fillRect(c.x,c.y,c.w,c.h);ctx.fillStyle='rgba(200,240,255,0.6)';for(let i=0;i<6;i++){const yy=c.y+((time*40*c.dy+i*14)%c.h+c.h)%c.h;ctx.fillRect(c.x+10+i*18,yy,6,2);}}
 for(const b of g.hz.beam){const s=beamState(b);const col=a.id==='templo'?'255,225,77':'255,243,176';if(s==='warn'){ctx.fillStyle=`rgba(${col},${0.12+0.1*Math.sin(time*20)})`;ctx.fillRect(b.x,BY1,b.w,BY2-BY1);}if(s==='on'){ctx.fillStyle=`rgba(${col},0.55)`;ctx.fillRect(b.x,BY1,b.w,BY2-BY1);ctx.fillStyle=`rgba(255,255,255,0.6)`;ctx.fillRect(b.x+b.w/2-2,BY1,4,BY2-BY1);}}
 for(const m of g.hz.mush){const p=1+0.15*Math.sin(time*4+m.x);ctx.fillStyle='rgba(255,122,217,0.25)';ctx.beginPath();ctx.arc(m.x,m.y,10*p,0,TAU);ctx.fill();ctx.fillStyle='#f5f0e6';ctx.fillRect(m.x-2,m.y-2,4,6);ctx.fillStyle='#e0393e';ctx.fillRect(m.x-6,m.y-6,12,5);ctx.fillRect(m.x-4,m.y-8,8,2);ctx.fillStyle='#ffffff';ctx.fillRect(m.x-4,m.y-5,2,2);ctx.fillRect(m.x+2,m.y-6,2,2);}
 // zona
 const z=g.zone;ctx.fillStyle='rgba(255,59,47,0.22)';ctx.fillRect(BX1,BY1,BX2-BX1,z.y1-BY1);ctx.fillRect(BX1,z.y2,BX2-BX1,BY2-z.y2);ctx.fillRect(BX1,z.y1,z.x1-BX1,z.y2-z.y1);ctx.fillRect(z.x2,z.y1,BX2-z.x2,z.y2-z.y1);
 if(z.x1>BX1+1){ctx.strokeStyle='#ff8a3d';ctx.setLineDash([6,4]);ctx.lineDashOffset=-time*20;ctx.lineWidth=2;ctx.strokeRect(z.x1,z.y1,z.x2-z.x1,z.y2-z.y1);ctx.setLineDash([]);}
 // zonas de poder (telegrafia)
 for(const zn of g.zones){if(zn.t<zn.delay){const k=zn.t/zn.delay;ctx.strokeStyle=zn.col;ctx.lineWidth=1;ctx.setLineDash([3,3]);ctx.beginPath();ctx.arc(zn.x,zn.y,zn.r,0,TAU);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle=zn.col;ctx.globalAlpha=0.25;ctx.beginPath();ctx.arc(zn.x,zn.y,zn.r*k,0,TAU);ctx.fill();ctx.globalAlpha=1;}
  else if(zn.kind==='area'){ctx.fillStyle=zn.col;ctx.globalAlpha=0.22+0.08*Math.sin(time*8);ctx.beginPath();ctx.arc(zn.x,zn.y,zn.r,0,TAU);ctx.fill();ctx.globalAlpha=0.7;ctx.strokeStyle=zn.col;ctx.lineWidth=1;ctx.beginPath();ctx.arc(zn.x,zn.y,zn.r,0,TAU);ctx.stroke();ctx.globalAlpha=1;if(Math.random()<0.4)G.parts.push({x:zn.x+rnd(-zn.r,zn.r)*0.7,y:zn.y+rnd(-zn.r,zn.r)*0.7,vx:0,vy:-15,life:0.4,t:0,col:zn.col,sz:1,g:0});}
  else if(zn.kind==='cloud'){ctx.fillStyle='rgba(120,110,170,0.45)';ctx.beginPath();ctx.arc(zn.x,zn.y,zn.r,0,TAU);ctx.fill();ctx.fillStyle='#5a4f8a';for(let i=0;i<4;i++){ctx.beginPath();ctx.arc(zn.x-15+i*10,zn.y-zn.r-4+Math.sin(time*3+i)*2,8,0,TAU);ctx.fill();}if(Math.random()<0.3){ctx.fillStyle='#ffe14d';ctx.fillRect(zn.x+rnd(-zn.r,zn.r),zn.y+rnd(-zn.r,zn.r),2,6);}}
  else{const k=1-(zn.t-zn.delay)/0.35;if(k>0){ctx.globalAlpha=k;if(zn.kind==='bolt'){ctx.fillStyle='#fff7b0';ctx.fillRect(zn.x-4,BY1,8,zn.y-BY1);ctx.fillStyle='#ffe14d';ctx.fillRect(zn.x-8,BY1,3,zn.y-BY1);}ctx.fillStyle=zn.col;ctx.beginPath();ctx.arc(zn.x,zn.y,zn.r*(1.2-k*0.2),0,TAU);ctx.fill();ctx.globalAlpha=1;}}}
 for(const d of g.decoys){ctx.fillStyle='rgba(0,0,0,0.3)';ctx.beginPath();ctx.ellipse(d.x,d.y,8,3,0,0,TAU);ctx.fill();drawSprite(d.owner.def.id,d.x,d.y,1,d.face,false,0.75);}
 // sombras e personagens (ordem por y)
 const fs=g.all.filter(f=>f.dead||seenBy(f,g.p.team)).sort((a,b)=>a.y-b.y);
 for(const f of fs){const fc=f===g.p?save.cos.eq:(f.cos||{});if(!f.dead&&fc.aura){const c=cosFind(fc.aura);ctx.fillStyle=cosColor(c.col,time);ctx.globalAlpha=0.45+0.2*Math.sin(time*5);ctx.beginPath();ctx.ellipse(f.x,f.y,14,5,0,0,TAU);ctx.fill();ctx.globalAlpha=1;}ctx.fillStyle='rgba(0,0,0,0.35)';ctx.beginPath();ctx.ellipse(f.x,f.y,8,3,0,0,TAU);ctx.fill();}
 for(const f of fs){for(const tr of f.trail)drawSprite(f.def.id,tr.x,tr.y,1,f.face,true,0.35*(1-tr.t/0.18));
  const bob=f.walk?Math.round(Math.abs(Math.sin(f.walk))*-2):0;const ko=f.dead||(g.over&&f.team!==g.winner.team);
  if(f.freeze>0){ctx.fillStyle='rgba(159,227,255,0.55)';ctx.fillRect(f.x-10,f.y-22,20,22);}
  ctx.save();if(ko){ctx.translate(f.x,f.y);ctx.rotate(Math.min(1,g.koT*3)*Math.PI/2*-f.face);ctx.translate(-f.x,-f.y);}
  if(f.spin>0){ctx.translate(f.x,f.y-10);ctx.scale(Math.cos(time*40),1);ctx.translate(-f.x,-(f.y-10));}
  const blink=f.inv>0&&f.dashT<=0&&Math.floor(time*30)%2===0;
  if(!blink)SQ=f.squash>0&&!f.dead?f.squash*1.4:0;drawSprite(f.def.id,f.x,f.y+bob,f.big>0&&!f.dead?1.35:1,f.face,f.flash>0&&!f.dead,f.dead?0.5:f.ghost>0?0.35:1);SQ=0;ctx.restore();
  if(f.shieldT>0){ctx.strokeStyle=f.reflect>0?'#ffd23f':'#bfeaff';ctx.globalAlpha=0.5+0.3*Math.sin(time*12);ctx.lineWidth=2;ctx.beginPath();ctx.arc(f.x,f.y-10,15,0,TAU);ctx.stroke();ctx.globalAlpha=1;}
  if(f.marked>0){ctx.strokeStyle='#ff4d4d';ctx.lineWidth=1;ctx.beginPath();ctx.arc(f.x,f.y-10,11,0,TAU);ctx.stroke();ctx.fillStyle='#ff4d4d';ctx.fillRect(f.x-1,f.y-23,2,4);}
  if(f.power>0&&Math.random()<0.4)G.parts.push({x:f.x+rnd(-7,7),y:f.y-rnd(0,20),vx:0,vy:-25,life:0.4,t:0,col:'#ff4d4d',sz:1,g:0});
  if(f.channel&&f.channel.kind==='beam'){const x0=f.x+Math.cos(f.aim)*8,y0=f.y-8+Math.sin(f.aim)*8,x1=f.x+Math.cos(f.aim)*175,y1=f.y-8+Math.sin(f.aim)*175;ctx.strokeStyle=f.channel.col||'#ffe14d';ctx.lineWidth=7+Math.sin(time*40)*1.5;ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();ctx.strokeStyle='#ffffff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();}
  if(f.blocking){const pf=time-f.blockStart<=0.22;ctx.strokeStyle=pf?'#ffd23f':'#bfeaff';ctx.globalAlpha=0.9;ctx.lineWidth=3;ctx.beginPath();ctx.arc(f.x,f.y-9,14,f.aim-1.3,f.aim+1.3);ctx.stroke();ctx.lineWidth=1;ctx.strokeStyle='#ffffff';ctx.beginPath();ctx.arc(f.x,f.y-9,16,f.aim-0.9,f.aim+0.9);ctx.stroke();ctx.globalAlpha=1;}
  if(f.guard<f.guardMax-0.5||f.broken>0)bar(f.x-10,f.y+4,20,2,f.guard/f.guardMax,f.broken>0?'#ff4d4d':'#bfeaff');
  if(f.drain>0&&Math.random()<0.3)G.parts.push({x:f.x+rnd(-6,6),y:f.y-rnd(0,18),vx:0,vy:-20,life:0.4,t:0,col:'#e0396a',sz:1,g:0});
  if(f.stun>0&&f.freeze<=0){for(let i=0;i<3;i++){const a=time*6+i*2.1;ctx.fillStyle='#ffd23f';ctx.fillRect(f.x+Math.cos(a)*7-1,f.y-24+Math.sin(a)*2,2,2);}}
  if(f.windT>0&&!f.dead){const k=0.5+0.5*Math.sin(time*40);ctx.strokeStyle=`rgba(255,70,70,${0.5+0.5*k})`;ctx.lineWidth=2;ctx.beginPath();ctx.arc(f.x,f.y-8,15+3*k,0,TAU);ctx.stroke();text('!',f.x,f.y-30,12,'#ff4d5e','center','#0b0c14');}
  // nome e mini barra
  const lab=f===g.p?'VOCÊ':(g.net&&f.netName&&f.netName!=='Bot')?f.netName.slice(0,10):f.team===g.p.team?'ALIADO':'BOT';const col=f.col||'#ff9a9a';if(!f.dead){text(lab,f.x,f.y-27,6,col,'center','#0b0c14');if((f===g.p?save.cos.eq:(f.cos||{})).title){const c=cosFind((f===g.p?save.cos.eq:f.cos).title);text(c.n,f.x,f.y-34,5,c.col,'center','#0b0c14');}if(f.emoteT>0){const tw=f.emote.length*6+10;ctx.fillStyle='#ffffff';ctx.fillRect(f.x-tw/2,f.y-52,tw,13);ctx.fillRect(f.x-2,f.y-39,4,3);text(f.emote,f.x,f.y-42,8,'#0b0c14','center',null,PS);}if(g.multi&&f!==g.p)bar(f.x-9,f.y-25,18,2,f.hp/1000,col);}
  if(!f.bot&&!isTouch){ctx.strokeStyle='rgba(255,255,255,0.35)';ctx.lineWidth=1;const ax=f.x+Math.cos(f.aim)*18,ay=f.y-8+Math.sin(f.aim)*18;ctx.fillStyle='rgba(255,255,255,0.6)';ctx.fillRect(Math.round(ax)-1,Math.round(ay)-1,2,2);}}
 drawPick(g.pk);
 // esconderijos (por cima dos personagens)
 for(let i=0;i<g.covers.length;i++){const c=g.covers[i];if(c.x+c.r<g.cam.x-10||c.x-c.r>g.cam.x+W+10||c.y+c.r<g.cam.y-20||c.y-c.r>g.cam.y+H+10)continue;drawCover(c,a.id,g.p.cover===i&&!g.p.dead?0.45:g.all.some(f=>f.cover===i&&!f.dead&&f.team===g.p.team)?0.7:1);}
 // projéteis
 for(const p of g.proj)drawProj(p);
 for(const s of g.slashes){const k=s.t/0.14;ctx.strokeStyle=s.col;ctx.globalAlpha=1-k;ctx.lineWidth=3;ctx.beginPath();ctx.arc(s.x,s.y,s.r*(0.7+k*0.4),s.ang-s.arc/2,s.ang+s.arc/2);ctx.stroke();ctx.globalAlpha=1;}
 for(const p of g.parts){ctx.globalAlpha=p.amb?Math.min(1,(p.life-p.t)):clamp(1-p.t/p.life,0,1);ctx.fillStyle=p.col;ctx.fillRect(Math.round(p.x),Math.round(p.y),p.sz,p.sz);}ctx.globalAlpha=1;
 for(const p of g.pops){const k=p.t/0.9;const y=p.y-k*16;ctx.globalAlpha=k>0.7?(1-k)/0.3:1;text(p.txt,p.x,y,p.size,p.col,'center','#0b0c14');if(p.sub)text(p.sub,p.x,y+9,6,p.col,'center','#0b0c14');ctx.globalAlpha=1;}
 ctx.restore();
 ctx.drawImage(vignette,0,0);
 recCap();
 renderHUD();}
function drawProj(p){ctx.save();ctx.translate(p.x,p.y);
 if(p.kind==='fire'){ctx.fillStyle='#ff6a13';ctx.fillRect(-3,-3,6,6);ctx.fillStyle='#ffd23f';ctx.fillRect(-1,-2,3,4);}
 else if(p.kind==='bubble'){ctx.fillStyle='rgba(79,184,255,0.7)';ctx.fillRect(-3,-3,7,7);ctx.fillStyle='#bfeaff';ctx.fillRect(-4,-1,1,3);ctx.fillRect(4,-1,1,3);ctx.fillRect(-1,-4,3,1);ctx.fillRect(-1,4,3,1);ctx.fillStyle='#ffffff';ctx.fillRect(-2,-2,1,1);}
 else if(p.kind==='ring'){ctx.strokeStyle='#7fe0c8';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,p.r*(0.7+0.3*Math.sin(time*20)),0,TAU);ctx.stroke();}
 else if(p.kind==='wave'){ctx.rotate(p.ang);ctx.fillStyle=p.col||'rgba(79,168,255,0.75)';ctx.globalAlpha=0.75;ctx.fillRect(-10,-p.r,16,p.r*2);ctx.globalAlpha=1;ctx.fillStyle='rgba(255,255,255,0.8)';ctx.fillRect(4,-p.r,4,p.r*2);ctx.fillStyle='#ffffff';for(let i=-p.r;i<p.r;i+=6)ctx.fillRect(6,i+Math.sin(time*10+i)*2,3,2);}
 else if(p.kind==='snow'){ctx.fillStyle='#0b0c14';ctx.fillRect(-9,-7,18,14);ctx.fillRect(-7,-9,14,18);ctx.fillStyle='#ffffff';ctx.fillRect(-8,-6,16,12);ctx.fillRect(-6,-8,12,16);ctx.fillStyle='#c4cfde';ctx.fillRect(-6,3,12,3);}
 else if(p.kind==='spark'){ctx.rotate(p.ang);ctx.fillStyle='#ffe14d';ctx.fillRect(-6,-1,10,3);ctx.fillStyle='#ffffff';ctx.fillRect(-2,-1,5,2);}
 else if(p.kind==='arrow'){ctx.rotate(Math.atan2(p.vy,p.vx));ctx.fillStyle='#8a5a2b';ctx.fillRect(-6,-0.5,10,1.5);ctx.fillStyle='#c9cbe6';ctx.fillRect(3,-1.5,3,3);ctx.fillStyle=p.col;ctx.fillRect(-7,-2,2,4);}
 else if(p.kind==='star'){ctx.rotate(time*20);ctx.fillStyle='#c9cbe6';ctx.fillRect(-4,-1,8,2);ctx.fillRect(-1,-4,2,8);ctx.fillStyle=p.col;ctx.fillRect(-1,-1,2,2);}
 else if(p.kind==='shard'){ctx.rotate(Math.atan2(p.vy,p.vx));ctx.fillStyle='#bfeaff';ctx.fillRect(-4,-1,8,3);ctx.fillStyle='#ffffff';ctx.fillRect(1,-1,3,1);}
 else if(p.kind==='web'){ctx.strokeStyle='#f2f2f2';ctx.lineWidth=1;for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(-6*Math.cos(i*0.785),-6*Math.sin(i*0.785));ctx.lineTo(6*Math.cos(i*0.785),6*Math.sin(i*0.785));ctx.stroke();}ctx.strokeRect(-3,-3,6,6);}
 else if(p.kind==='goo'){ctx.fillStyle=p.col;ctx.fillRect(-3,-3,6,6);ctx.fillStyle='rgba(255,255,255,0.6)';ctx.fillRect(-2,-2,2,2);}
 else if(p.kind==='orb'){const r=p.r;ctx.fillStyle='#0b0c14';ctx.fillRect(-r-1,-r,2*r+2,2*r);ctx.fillRect(-r,-r-1,2*r,2*r+2);ctx.fillStyle=p.col;ctx.fillRect(-r,-r+1,2*r,2*r-2);ctx.fillRect(-r+1,-r,2*r-2,2*r);ctx.fillStyle='rgba(255,255,255,0.7)';ctx.fillRect(-r+1,-r+1,Math.max(1,r-1),Math.max(1,r-1));if(p.special&&Math.random()<0.5)G.parts.push({x:p.x,y:p.y,vx:rnd(-10,10),vy:rnd(-10,10),life:0.3,t:0,col:p.col,sz:1,g:0});}
 else if(p.kind==='bat'){const f=Math.sin(time*30)>0?1:0;ctx.fillStyle='#15131f';ctx.fillRect(-2,-2,4,4);ctx.fillRect(-6,-2-f,4,2);ctx.fillRect(2,-2-f,4,2);ctx.fillStyle='#e0393e';ctx.fillRect(-1,-1,1,1);ctx.fillRect(1,-1,1,1);}
 ctx.restore();}
function hudPanel(f,x,right){const w=168,y=4;ctx.fillStyle='#0b0c14';ctx.fillRect(x-2,y-2,w+4,32);ctx.fillStyle='#141626';ctx.fillRect(x,y,w,28);if(f===G.p&&save.cos.eq.frame){const c=cosFind(save.cos.eq.frame);ctx.strokeStyle=c.col;ctx.lineWidth=2;ctx.strokeRect((right?x+w-26:x+2)-1,y+1,26,26);}
 const px=right?x+w-26:x+2;ctx.fillStyle='#23264a';ctx.fillRect(px,y+2,24,24);ctx.save();ctx.beginPath();ctx.rect(px,y+2,24,24);ctx.clip();drawSprite(f.def.id,px+12,y+27,1,right?-1:1);ctx.restore();
 const tx=right?x+w-30:x+30,al=right?'right':'left';
 text(shortN(f.def,14).toUpperCase(),tx,y+9,6,'#ffffff',al);
 ctx.font=`9px ${PS}`;const el=f.def.el+(f.mod>1?' +10%':f.mod<1?' −10%':'');const tw=ctx.measureText(el).width+6;const ex=right?x+w-30-tw-(ctx.font=`6px ${PX}`,ctx.measureText(shortN(f.def,14).toUpperCase()).width)-4:x+30+(ctx.font=`6px ${PX}`,ctx.measureText(shortN(f.def,14).toUpperCase()).width)+4;
 ctx.fillStyle=f.mod<1?'#ff7a7a':ELCOL[f.def.el];ctx.fillRect(ex,y+2,tw,9);text(el,ex+tw/2,y+9,9,'#0b0c14','center',null,PS);
 const bw=134,bx=right?x+w-30-bw:x+30;const hp=f.hp/1000;const hc=hp>0.5?'#46d160':hp>0.25?'#ffb02e':'#ff4d4d';
 if(right){ctx.save();ctx.translate(bx+bw,0);ctx.scale(-1,1);bar(0,y+13,bw,6,hp,hc);ctx.restore();}else bar(bx,y+13,bw,6,hp,hc);
 text(String(Math.ceil(f.hp)),right?bx+3:bx+bw-3,y+20,8,'#ffffff',right?'left':'right','#0b0c14',PS);
 const cw=90,cx=right?x+w-30-cw:x+30;const ready=f.charge>=100;
 if(right){ctx.save();ctx.translate(cx+cw,0);ctx.scale(-1,1);bar(0,y+22,cw,3,f.charge/100,ready?'#bfeaff':'#4fc3ff');ctx.restore();}else bar(cx,y+22,cw,3,f.charge/100,ready?'#bfeaff':'#4fc3ff');
 text(ready?'C PRONTO':'C',right?cx-4:cx+cw+4,y+27,8,ready?'#4fc3ff':'#8a8fb8',right?'right':'left',null,PS);}
function renderHUD(){const g=G;const tgt=g.multi&&g.p.foe&&!g.p.foe.dead?g.p.foe:g.b;hudPanel(g.p,6,false);hudPanel(tgt,W-174,true);
 const L=g.all.filter(x=>x!==g.p&&x.team===g.p.team),R=g.all.filter(x=>x!==tgt&&x.team!==g.p.team);
 if(L.length+R.length<=2){for(const [f,x,right] of [[L[0],6,false],[R[0],W-174,true]]){if(!f)continue;ctx.fillStyle='#0b0c14';ctx.fillRect(x-2,36,172,13);ctx.fillStyle='#141626';ctx.fillRect(x,37,168,11);text((f.team===g.p.team?'Aliado: ':'')+shortN(f.def,16),right?x+164:x+4,45,8,f.dead?'#6a6f98':'#ffffff',right?'right':'left',null,PS);bar(right?x+4:x+94,40,70,4,f.hp/1000,f.dead?'#3a3f66':'#46d160');}}
 else{for(const [arr,x,right,col] of [[L,6,false,'#7fc8ff'],[R,W-104,true,'#ff9a9a']])arr.forEach((f,i)=>{const y=36+i*9;ctx.globalAlpha=0.85;ctx.fillStyle='#0b0c14';ctx.fillRect(x-1,y,100,9);ctx.globalAlpha=1;text(shortN(f.def,11),right?x+96:x+2,y+7,7,f.dead?'#6a6f98':col,right?'right':'left',null,PS);bar(right?x+2:x+56,y+3,40,3,f.hp/1000,f.dead?'#3a3f66':'#46d160');});
  const al=L.filter(x=>!x.dead).length+(g.p.dead?0:1),en=g.all.filter(x=>x.team!==g.p.team&&!x.dead).length;text(g.ffa?`Restam ${en+(g.p.dead?0:1)}`:`${al} x ${en}`,W/2,48,8,'#ffffff','center','#0b0c14',PS);}
 ctx.fillStyle='#0b0c14';ctx.fillRect(W/2-24,2,48,20);ctx.fillStyle='#141626';ctx.fillRect(W/2-22,4,44,16);text(String(Math.ceil(g.time)).padStart(2,'0'),W/2,17,10,g.time<15?'#ff7a7a':'#ffd23f','center');
 const a=g.arena;text(a.name,W/2,30,9,'#ff8a3d','center','#0b0c14',PS);
 if(a.el!=='Neutro'){text(`${a.el} +10%`,W/2,39,8,'#8ef0a0','center','#0b0c14',PS);}
 btn('pause',W/2+26,4,14,14,'II','#2e3358','#ffffff',6);btn('emote',W/2-40,4,14,14,'☺','#2e3358','#ffffff',6);
 // setas para quem está fora da tela
 {const X0=12,X1=W-12,Y0=56,Y1=H-34,cx=W/2,cy=(Y0+Y1)/2;
  for(const f of g.all){if(f===g.p||f.dead||!seenBy(f,g.p.team))continue;const sx=f.x-g.cam.x,sy=f.y-10-g.cam.y;if(sx>=4&&sx<=W-4&&sy>=30&&sy<=H-4)continue;
   const dx=sx-cx,dy=sy-cy,m=Math.min((X1-cx)/Math.max(1e-6,Math.abs(dx)),(Y1-cy)/Math.max(1e-6,Math.abs(dy)));const ax=cx+dx*m,ay=cy+dy*m,an=Math.atan2(dy,dx);
   ctx.save();ctx.translate(Math.round(ax),Math.round(ay));ctx.rotate(an);ctx.fillStyle='#0b0c14';ctx.beginPath();ctx.moveTo(9,0);ctx.lineTo(-6,-7);ctx.lineTo(-3,0);ctx.lineTo(-6,7);ctx.closePath();ctx.fill();
   ctx.fillStyle=f.col;ctx.beginPath();ctx.moveTo(7,0);ctx.lineTo(-4,-5);ctx.lineTo(-2,0);ctx.lineTo(-4,5);ctx.closePath();ctx.fill();ctx.restore();
   const d=Math.round(Math.hypot(f.x-g.p.x,f.y-g.p.y)/10);text(d+'m',clamp(ax-Math.cos(an)*14,14,W-14),clamp(ay-Math.sin(an)*12+3,Y0,Y1),6,f.col,'center','#0b0c14');}}
 if(g.tips&&g.tips.cur&&!g.over){const c=g.tips.cur,k=Math.min(1,c.t*4,(3.6-c.t)*4);ctx.globalAlpha=Math.max(0,k);ctx.font=`10px ${PS}`;const tw=ctx.measureText(c.txt).width+24;ctx.fillStyle='#0b0c14';ctx.fillRect(W/2-tw/2-2,58,tw+4,20);ctx.fillStyle='#1d2140';ctx.fillRect(W/2-tw/2,60,tw,16);ctx.fillStyle='#ffd23f';ctx.fillRect(W/2-tw/2,60,3,16);text('DICA',W/2-tw/2+5,66,5,'#ffd23f','left');text(c.txt,W/2+6,72,10,'#ffffff','center',null,PS);ctx.globalAlpha=1;}
 if(!g.p.dead&&g.p.cover>=0)text(g.p.revealT>0?'REVELADO!':'ESCONDIDO',W/2,236,7,g.p.revealT>0?'#ff9a9a':'#8ef0a0','center','#0b0c14');
 // controles
 const f=g.p;
 if(isTouch){const j=touch.joy!=null?touch.joyO:{x:60,y:220};ctx.globalAlpha=0.5;ctx.fillStyle='#0b0c14';ctx.beginPath();ctx.arc(j.x,j.y,30,0,TAU);ctx.fill();ctx.strokeStyle='#ffffff';ctx.lineWidth=2;ctx.stroke();ctx.globalAlpha=0.85;ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(j.x+touch.joyV.x*24,j.y+touch.joyV.y*24,12,0,TAU);ctx.fill();ctx.globalAlpha=1;
  tbtn(TB.a,'A','#ff6a3d',f.cdA/0.5,true);tbtn(TB.b,'B','#7a7fb8',f.cdB/5,true,f.cdB>0?Math.ceil(f.cdB/BAL.bRate)+'':'');tbtn(TB.c,'C',f.charge>=100?'#4fc3ff':'#2e3358',1-f.charge/100,f.charge>=100);tbtn(TB.dash,'DASH','#ffd23f',f.cdDash/f.dashCd,true);tbtn(TB.blk,'BLOQ',f.broken>0?'#ff4d4d':f.blocking?'#ffffff':'#bfeaff',1-f.guard/f.guardMax,true);}
 else{const items=[['A','clique',f.cdA/0.5,'#ff6a3d'],['B','E',f.cdB/5,'#7a7fb8'],['C','Q',1-f.charge/100,'#4fc3ff'],['DASH','Espaço',f.cdDash/f.dashCd,'#ffd23f'],['BLOQ','Shift',1-f.guard/f.guardMax,'#bfeaff']];
  items.forEach((it,i)=>{const x=8+i*44,y=244;ctx.fillStyle='#0b0c14';ctx.fillRect(x-1,y-1,40,20);ctx.fillStyle=it[2]>0&&!(it[0]==='C'&&f.charge>=100)?'#262a46':it[3];ctx.fillRect(x,y,38,18);if(it[2]>0&&!(it[0]==='C'&&f.charge>=100)){ctx.fillStyle=it[3];ctx.globalAlpha=0.5;ctx.fillRect(x,y+18*clamp(it[2],0,1),38,18*(1-clamp(it[2],0,1)));ctx.globalAlpha=1;}
   text(it[0],x+19,y+9,6,'#0b0c14','center');text(it[1],x+19,y+16,8,'#0b0c14','center',null,PS);});
  const pw=f.def.pw;const ptxt=`A ${pw[0]} · B ${pw[1]} · C ${pw[2]}`;let fz=9;ctx.font=`${fz}px ${PS}`;while(fz>6&&ctx.measureText(ptxt).width>W-240){fz--;ctx.font=`${fz}px ${PS}`;}text(ptxt,232,256,fz,'#ffe2d0','left','#0b0c14',PS);}}
function tbtn(b,l,col,cd,on,sub){ctx.fillStyle='#0b0c14';ctx.beginPath();ctx.arc(b.x,b.y,b.r+2,0,TAU);ctx.fill();ctx.fillStyle=col;ctx.globalAlpha=on?0.95:0.6;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,TAU);ctx.fill();ctx.globalAlpha=1;
 if(cd>0){ctx.fillStyle='rgba(11,12,20,0.6)';ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.arc(b.x,b.y,b.r,-Math.PI/2,-Math.PI/2+TAU*clamp(cd,0,1));ctx.closePath();ctx.fill();}
 text(sub||l,b.x,b.y+(l.length>2?3:4),l.length>2?5:(b.r>16?10:8),'#0b0c14','center');}
function renderCountdown(){const n=Math.ceil(cdT);const s=n>3?'':n>0?String(n):'';ctx.fillStyle='rgba(11,12,20,0.35)';ctx.fillRect(0,0,W,H);if(G.tour)text(ROUNDS[T.r].toUpperCase(),W/2,H/2-48,10,'#ff8a3d','center','#0b0c14');
 if(cdT>2.6){if(pick.mode==='ffa'){text('TODOS CONTRA TODOS',W/2,H/2-36,10,'#ffd23f','center','#0b0c14');text('O último de pé vence!',W/2,H/2-20,10,'#ffffff','center','#0b0c14',PS);}else if(pick.mode==='2x2'){text(`${pick.me.name} + ${pick.ally.name}`,W/2,H/2-40,9,'#8ef0a0','center','#0b0c14',PS);text('VS',W/2,H/2-28,10,'#ffffff','center','#0b0c14');text(`${pick.foe.name} + ${pick.foe2.name}`,W/2,H/2-16,9,'#ff9a9a','center','#0b0c14',PS);}else if(isMulti()){text(`EQUIPES ${pick.mode}`,W/2,H/2-36,10,'#ffd23f','center','#0b0c14');text('Derrube toda a equipe rival!',W/2,H/2-20,10,'#ffffff','center','#0b0c14',PS);}else text(`${pick.me.name}  VS  ${pick.foe.name}`,W/2,H/2-30,10,'#ffffff','center','#0b0c14');}
 text(s,W/2,H/2+10,28,'#ffd23f','center','#0b0c14');if(cdT<0.4)text('LUTE!',W/2,H/2+10,20,'#ff6a3d','center','#0b0c14');}