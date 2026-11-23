// ---------- INPUT ----------
const keys={};let mouse={x:W/2,y:H/2,down:false};let isTouch=false;
const pressed={b:false,c:false,dash:false};
const touch={joy:null,joyO:{x:0,y:0},joyV:{x:0,y:0},aHeld:null,blk:null};
const TB={a:{x:442,y:232,r:20},b:{x:404,y:248,r:13},c:{x:448,y:190,r:15},dash:{x:406,y:212,r:12},blk:{x:368,y:244,r:12}};
addEventListener('keydown',e=>{if(askOpen())return;keys[e.code]=true;if(['Space','KeyQ','KeyE','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
 if(e.repeat)return;if(e.code==='KeyE'||e.code==='KeyK')pressed.b=true;if(e.code==='KeyQ'||e.code==='KeyL')pressed.c=true;if(e.code==='Space')pressed.dash=true;if(e.code==='KeyT'&&state==='fight'&&G&&G.p)doEmote(G.p);
 if((e.code==='Enter'||e.code==='Space')&&state!=='fight'){ensureAudio();uiKey();}});
addEventListener('keyup',e=>{keys[e.code]=false;});
function toLogical(e){const r=cv.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*W,y:(e.clientY-r.top)/r.height*H};}
cv.addEventListener('contextmenu',e=>e.preventDefault());
const activePtrs=new Set();
cv.addEventListener('pointerdown',e=>{if(askOpen())return;ensureAudio();activePtrs.add(e.pointerId);const p=toLogical(e);cv.setPointerCapture&&cv.setPointerCapture(e.pointerId);
 if(e.pointerType==='touch'||e.pointerType==='pen'){isTouch=true;
   if(state==='fight'&&!paused){
     if(dist2(p,TB.a)<(TB.a.r+6)**2){touch.aHeld=e.pointerId;return;}
     if(dist2(p,TB.b)<(TB.b.r+6)**2){pressed.b=true;return;}
     if(dist2(p,TB.c)<(TB.c.r+6)**2){pressed.c=true;return;}
     if(dist2(p,TB.dash)<(TB.dash.r+6)**2){pressed.dash=true;return;}
     if(dist2(p,TB.blk)<(TB.blk.r+6)**2){touch.blk=e.pointerId;return;}
     if(p.x<W*0.5&&(touch.joy==null||!activePtrs.has(touch.joy))){touch.joy=e.pointerId;touch.joyO={x:p.x,y:p.y};touch.joyV={x:0,y:0};return;}
   }
   uiClick(p);return;}
 mouse.x=p.x;mouse.y=p.y;
 if(e.button===2){if(state==='fight')mouse.right=true;return;}
 if(e.button===0){if(state==='fight'&&!paused&&!hitUI(p))mouse.down=true;else uiClick(p);}
});
cv.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse')mouse.out=true;});
cv.addEventListener('pointermove',e=>{const p=toLogical(e);if(e.pointerType==='mouse'){mouse.x=p.x;mouse.y=p.y;mouse.out=false;isTouch=false;}
 if(touch.joy===e.pointerId){let dx=p.x-touch.joyO.x,dy=p.y-touch.joyO.y;const l=Math.hypot(dx,dy),m=28;if(l>m){dx=dx/l*m;dy=dy/l*m;}touch.joyV={x:dx/m,y:dy/m};}});
function resetTouch(){touch.joy=null;touch.joyV={x:0,y:0};touch.aHeld=null;touch.blk=null;mouse.down=false;mouse.right=false;activePtrs.clear();}
function endPtr(e){activePtrs.delete(e.pointerId);if(e.pointerType==='mouse'&&e.button===0)mouse.down=false;if(e.pointerType==='mouse'&&e.button===2)mouse.right=false;if(touch.blk===e.pointerId)touch.blk=null;if(touch.joy===e.pointerId){touch.joy=null;touch.joyV={x:0,y:0};}if(touch.aHeld===e.pointerId)touch.aHeld=null;}
cv.addEventListener('pointerup',endPtr);cv.addEventListener('pointercancel',endPtr);cv.addEventListener('lostpointercapture',endPtr);
addEventListener('pointerup',endPtr);addEventListener('blur',resetTouch);document.addEventListener('visibilitychange',()=>{if(document.hidden)resetTouch();});
cv.style.touchAction='none';document.body.style.touchAction='none';document.body.style.userSelect='none';document.body.style.webkitUserSelect='none';
function dist2(a,b){return (a.x-b.x)**2+(a.y-b.y)**2;}
