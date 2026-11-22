// ---------- UI BOTÕES (canvas) ----------
let buttons=[];
function btn(id,x,y,w,h,label,col,fg,size){buttons.push({id,x,y,w,h});
 ctx.fillStyle='#0b0c14';ctx.fillRect(x-2,y-2,w+4,h+4);ctx.fillStyle=col;ctx.fillRect(x,y,w,h);ctx.fillStyle='rgba(0,0,0,0.25)';ctx.fillRect(x,y+h-3,w,3);
 text(label,x+w/2,y+h/2+(size||8)/2-1,size||8,fg||'#0b0c14','center',null,PX);}
function hitUI(p){return buttons.some(b=>p.x>=b.x&&p.x<=b.x+b.w&&p.y>=b.y&&p.y<=b.y+b.h);}
function uiClick(p){let b=null;for(let i=buttons.length-1;i>=0;i--){const q=buttons[i];if(p.x>=q.x&&p.x<=q.x+q.w&&p.y>=q.y&&p.y<=q.y+q.h){b=q;break;}}if(b)onButton(b.id);}
function uiKey(){if(state==='bracket'&&T&&T.alive&&!T.champion){onButton('tfight');return;}if(state==='result'&&G&&G.tour&&resultT>1){onButton('tcont');return;}if(state==='title')onButton('play');else if(state==='draw'&&drawT>5.2)onButton('fight');else if(state==='prep')onButton('ready');else if(state==='result'&&resultT>1)onButton('again');}
