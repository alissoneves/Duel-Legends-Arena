// ---------- TEXTO ----------
function text(s,x,y,size,col,align,outline,font){s=tr(s);ctx.font=`${size}px ${font||PX}`;ctx.textAlign=align||'left';ctx.textBaseline='alphabetic';
 if(outline){ctx.fillStyle=outline;for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1],[1,1],[-1,-1],[1,-1],[-1,1]])ctx.fillText(s,Math.round(x)+dx,Math.round(y)+dy);}
 ctx.fillStyle=col;ctx.fillText(s,Math.round(x),Math.round(y));}
function bar(x,y,w,h,pct,col,back){ctx.fillStyle='#0b0c14';ctx.fillRect(x-1,y-1,w+2,h+2);ctx.fillStyle=back||'#262a46';ctx.fillRect(x,y,w,h);ctx.fillStyle=col;ctx.fillRect(x,y,Math.round(w*clamp(pct,0,1)),h);ctx.fillStyle='rgba(255,255,255,0.25)';ctx.fillRect(x,y,Math.round(w*clamp(pct,0,1)),1);}
function darkOf(s){if(s.dark)return s.dark;const c=document.createElement('canvas');c.width=s.w;c.height=s.h;const g=c.getContext('2d');g.drawImage(s.white,0,0);g.globalCompositeOperation='source-in';g.fillStyle='#2e3358';g.fillRect(0,0,s.w,s.h);s.dark=c;return c;}
function drawSpriteDark(id,x,y,scale){const s=SPR[id];ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(scale,scale);ctx.drawImage(darkOf(s),-s.w/2,-s.h);ctx.restore();}
let SQ=0;function drawSprite(id,x,y,scale,face,flash,alpha){const s=SPR[id];ctx.save();ctx.globalAlpha=alpha==null?1:alpha;ctx.translate(Math.round(x),Math.round(y));ctx.scale((face||1)*scale*(1+SQ),scale*(1-SQ));ctx.drawImage(flash?s.white:s.img,-s.w/2,-s.h);ctx.restore();}
