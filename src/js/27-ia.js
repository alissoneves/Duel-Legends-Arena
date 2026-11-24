// ---------- IA ----------
function botThink(f,dt){const t=f.foe,ai=f.ai;
 if(f.blind&&t){if(ai.lx==null||Math.hypot(ai.lx-f.x,ai.ly-f.y)<20){const z=G.zone;ai.lx=rnd(z.x1+40,z.x2-40);ai.ly=rnd(z.y1+40,z.y2-40);}
  const a=Math.atan2(ai.ly-f.y,ai.lx-f.x);f.mv={x:Math.cos(a)*0.8,y:Math.sin(a)*0.8};f.aim=a;f.blocking=false;return;}
 if(t){ai.lx=t.x+rnd(-20,20);ai.ly=t.y+rnd(-20,20);}
 ai.blockT=Math.max(0,(ai.blockT||0)-dt);if(f.blocking&&ai.blockT<=0)f.blocking=false;
 if(!f.blocking&&!(f.broken>0)&&f.guard>f.guardMax*0.35&&f.dashT<=0&&!f.channel){let threat=false,close=false;
  for(const p of G.proj){if(p.owner===f)continue;const rx=f.x-p.x,ry=f.y-8-p.y,pd=Math.hypot(rx,ry),sp=Math.hypot(p.vx,p.vy);if(pd<90&&(rx*p.vx+ry*p.vy)/(pd*sp)>0.85){threat=true;if(pd<22)close=true;}}
  const md=Math.hypot(t.x-f.x,t.y-f.y);if(t.def.melee&&md<34&&t.cdA>0.3)threat=true;
  if(threat&&(f.cdDash>0||Math.random()<0.5)&&Math.random()<(close?0.04:0.025)){f.blocking=true;f.blockStart=close?time:time-0.3;ai.blockT=rnd(0.35,0.8);}}
 if(f.blocking){const d0=Math.hypot(t.x-f.x,t.y-f.y)||1;f.aim=Math.atan2(t.y-f.y,t.x-f.x);f.mv={x:-(t.x-f.x)/d0*0.3,y:-(t.y-f.y)/d0*0.3};return;}const dx=t.x-f.x,dy=t.y-f.y,d=Math.hypot(dx,dy);const ang=Math.atan2(dy,dx);
 // mira com antecipação
 const lead=f.def.melee?0:clamp(d/220,0,0.6);f.aim=Math.atan2(t.y+t.vy*lead*0.5-f.y,t.x+t.vx*lead*0.5-f.x);
 const dc=G.decoys.find(q=>q.owner===t&&q.t>1);if(dc)f.aim=Math.atan2(dc.y-f.y,dc.x-f.x);
 ai.strafeT-=dt;if(ai.strafeT<=0){ai.strafe=Math.random()<0.5?-1:1;ai.strafeT=rnd(0.8,2);}
 const kite=!f.def.melee&&window.__kite!==false;const pref=f.def.melee?18:f.def.range*(kite?0.95:0.75);let mx=0,my=0;
 if(kite&&t.def.melee&&d<90){mx-=Math.cos(ang)*1.6;my-=Math.sin(ang)*1.6;if(d<50&&f.cdDash<=0&&Math.random()<0.2)doDash(f,ang+Math.PI+rnd(-0.6,0.6));}
 if(d>pref+15){mx+=Math.cos(ang);my+=Math.sin(ang);}else if(d<pref-15){mx-=Math.cos(ang);my-=Math.sin(ang);}
 mx+=Math.cos(ang+Math.PI/2)*ai.strafe*0.7;my+=Math.sin(ang+Math.PI/2)*ai.strafe*0.7;
 // ficar dentro da zona
 const z=G.zone,cx=(z.x1+z.x2)/2,cy=(z.y1+z.y2)/2;if(f.x<z.x1+24||f.x>z.x2-24||f.y<z.y1+24||f.y>z.y2-24){const a=Math.atan2(cy-f.y,cx-f.x);mx+=Math.cos(a)*1.5;my+=Math.sin(a)*1.5;}
 // evitar perigos
 const nx=f.x+mx*20,ny=f.y+my*20;const look={x:nx,y:ny};
 if(G.hz.lava.some(r=>inRect(look,{x:r.x-8,y:r.y-8,w:r.w+16,h:r.h+16}))||G.hz.beam.some(b=>beamState(b)!=='off'&&Math.abs(nx-(b.x+b.w/2))<b.w/2+8)){mx=-mx+Math.cos(ang+Math.PI/2)*ai.strafe;my=-my+Math.sin(ang+Math.PI/2)*ai.strafe;}
 const l=Math.hypot(mx,my)||1;f.mv={x:mx/l,y:my/l};
 // desviar de projéteis
 for(const p of G.proj){if(p.owner===f)continue;const rx=f.x-p.x,ry=f.y-8-p.y;const pd=Math.hypot(rx,ry);if(pd<70){const sp=Math.hypot(p.vx,p.vy);const dot=(rx*p.vx+ry*p.vy)/(pd*sp);if(dot>0.85&&f.cdDash<=0&&Math.random()<0.035){const pa=Math.atan2(p.vy,p.vx)+(Math.random()<0.5?1:-1)*Math.PI/2;doDash(f,pa);break;}}}
 for(const zn of G.zones){if(zn.owner!==f&&zn.t<zn.delay&&Math.hypot(f.x-zn.x,f.y-zn.y)<zn.r+6&&f.cdDash<=0&&Math.random()<0.06)doDash(f,Math.atan2(f.y-zn.y,f.x-zn.x));}
 if(f.def.melee&&d>70&&f.cdDash<=0&&Math.random()<BAL.gapDash)doDash(f,ang);
 ai.react-=dt;if(ai.react>0)return;ai.react=rnd(0.18,0.38)*BAL.react/(f.aiDiff||G.diff||1);
 const inRange=d<(f.def.melee?f.def.range+10:f.def.range+30);
 if(inRange&&Math.random()<Math.min(0.9,0.65*(f.aiDiff||G.diff||1)))doA(f);
 ai.thinkB-=0.15;if(f.cdB<=0&&ai.thinkB<=0&&d<(f.def.melee?120:200)){doB(f);ai.thinkB=rnd(1,3);}
 if(f.charge>=100&&(d<(f.def.melee?70:220))&&Math.random()<0.5)doC(f);
 if(f.def.melee&&d<40&&f.cdDash<=0&&t.channel&&Math.random()<0.1)doDash(f,ang+Math.PI);
}
function autoAim(f){const t=f.foe;const d=Math.hypot(t.x-f.x,t.y-f.y);const lead=f.def.melee?0:clamp(d/250,0,0.5);return Math.atan2(t.y+t.vy*lead*0.4-f.y,t.x+t.vx*lead*0.4-f.x);}
