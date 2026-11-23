// ---------- BORDAS POR ELO ----------
// cor e material vêm do elo; as gemas no topo vêm da divisão (IV = 0 … I = 3); Mestre+ são animadas
const FRAME=[['#5d626e','#8a8f9a','#3a3d45'],['#9a5a2a','#d08a4a','#5a3214'],['#9aa6b8','#e4ecf7','#5e6878'],['#d9a020','#ffe27a','#8a5a08'],['#2fa89a','#8ff0e0','#14605a'],['#1f9d55','#7cf0a8','#0c5a2e'],['#4f9ad9','#c8ecff','#1f4f8a'],['#8a4fd9','#d9b0ff','#4a1f8a'],['#d93a3a','#ffb0a0','#7a1414'],['#ffd23f','#ffffff','#2f6fd9']];
function frameKey(r){return r&&r.tier>=0?{t:apexOf(r),d:r.tier<7?r.div:3}:null;}
function rankFrame(x,y,sz,t,d,inner){const P=FRAME[t],b=Math.max(3,Math.round(sz*0.13)),tm=performance.now()/1000;ctx.save();
 if(t>=7){const a=0.35+0.25*Math.sin(tm*3);ctx.fillStyle=t===7?`rgba(176,122,255,${a})`:t===8?`rgba(255,90,60,${a})`:`rgba(255,226,122,${a})`;ctx.fillRect(x-b,y-b,sz+2*b,sz+2*b);}
 ctx.fillStyle='#0b0c14';ctx.fillRect(x-1,y-1,sz+2,sz+2);
 const g=ctx.createLinearGradient(x,y,x+sz,y+sz);g.addColorStop(0,P[1]);g.addColorStop(0.45,P[0]);g.addColorStop(1,P[2]);ctx.fillStyle=g;
 ctx.fillRect(x,y,sz,b);ctx.fillRect(x,y+sz-b,sz,b);ctx.fillRect(x,y,b,sz);ctx.fillRect(x+sz-b,y,b,sz);
 ctx.fillStyle='#0b0c14';ctx.fillRect(x+b,y+b,sz-2*b,1);ctx.fillRect(x+b,y+b,1,sz-2*b);
 if(inner)inner(x+b,y+b,sz-2*b);
 // cantos: rebites (bronze+), joias (ouro+)
 if(t>=1){const r=Math.max(1.5,b*0.38);for(const [cx,cy] of [[x+b/2,y+b/2],[x+sz-b/2,y+b/2],[x+b/2,y+sz-b/2],[x+sz-b/2,y+sz-b/2]]){ctx.fillStyle=t>=3?P[1]:P[2];ctx.beginPath();ctx.arc(cx,cy,t>=3?r*1.3:r,0,7);ctx.fill();if(t>=3){ctx.fillStyle=t>=6?'#ffffff':P[0];ctx.beginPath();ctx.arc(cx,cy,r*0.6,0,7);ctx.fill();}}}
 // gemas da divisão no topo
 const ng=t>=7?3:d,gs=Math.max(2.5,sz*0.075);for(let i=0;i<ng;i++){const gx=x+sz/2+(i-(ng-1)/2)*gs*2.6,gy=y+b/2;ctx.fillStyle='#0b0c14';ctx.beginPath();ctx.moveTo(gx,gy-gs-1);ctx.lineTo(gx+gs+1,gy);ctx.lineTo(gx,gy+gs+1);ctx.lineTo(gx-gs-1,gy);ctx.fill();ctx.fillStyle=t>=6?'#ffffff':['#ff6a6a','#8ef0a0','#7fc8ff'][i]||'#fff';ctx.beginPath();ctx.moveTo(gx,gy-gs);ctx.lineTo(gx+gs,gy);ctx.lineTo(gx,gy+gs);ctx.lineTo(gx-gs,gy);ctx.fill();}
 // divisão I: asinhas laterais
 if(d===3&&t>=2){ctx.fillStyle=P[1];for(const sg of [-1,1]){const ex=sg<0?x:x+sz;ctx.beginPath();ctx.moveTo(ex,y+sz*0.3);ctx.lineTo(ex+sg*b*1.6,y+sz*0.22);ctx.lineTo(ex+sg*b*1.1,y+sz*0.42);ctx.lineTo(ex+sg*b*1.5,y+sz*0.5);ctx.lineTo(ex,y+sz*0.55);ctx.fill();}}
 // Grão-Mestre: chamas; Desafiante: coroa
 if(t===8)for(let i=0;i<5;i++){const fx=x+sz*(0.15+i*0.175),fh=b*(1.2+0.7*Math.sin(tm*8+i*1.7));ctx.fillStyle=i%2?'#ffb02e':'#ff4a2a';ctx.beginPath();ctx.moveTo(fx-b*0.5,y);ctx.lineTo(fx,y-fh);ctx.lineTo(fx+b*0.5,y);ctx.fill();}
 if(t===9){const cw=sz*0.5,cx=x+sz/2,cy=y-b*0.2,ch=b*2.2;ctx.fillStyle='#0b0c14';ctx.fillRect(cx-cw/2-1,cy-ch*0.45-1,cw+2,ch*0.45+2);ctx.fillStyle='#ffd23f';ctx.beginPath();ctx.moveTo(cx-cw/2,cy);ctx.lineTo(cx-cw/2,cy-ch);ctx.lineTo(cx-cw/4,cy-ch*0.5);ctx.lineTo(cx,cy-ch*1.15);ctx.lineTo(cx+cw/4,cy-ch*0.5);ctx.lineTo(cx+cw/2,cy-ch);ctx.lineTo(cx+cw/2,cy);ctx.fill();ctx.fillStyle='#2f6fd9';ctx.beginPath();ctx.arc(cx,cy-ch*0.35,b*0.35,0,7);ctx.fill();
  const sh=(tm*0.8)%2;if(sh<1){ctx.globalAlpha=0.5;ctx.fillStyle='#ffffff';const sx=x+sz*sh;ctx.fillRect(sx,y,2,b);ctx.fillRect(sx,y+sz-b,2,b);ctx.globalAlpha=1;}}
 ctx.restore();}
function frameName(t,d){return t>=7?TIERS[t].n:`${TIERS[t].n} ${ROMAN[d]}`;}
function myFrame(){const R=save.rank;if(save.frame&&save.frame!=='elo'){const b=(R.borders||[]).find(x=>'s'+x.s===save.frame);if(b)return {t:b.t,d:b.d,s:b.s};}return frameKey(R);}
function portrait(x,y,sz,f){const id=save.icon&&iconOwned(save.icon)?save.icon:(idOf('Saci')||'saci');const inner=(ix,iy,is)=>{ctx.fillStyle='#23264a';ctx.fillRect(ix,iy,is,is);ctx.save();ctx.beginPath();ctx.rect(ix,iy,is,is);ctx.clip();drawSprite(id,ix+is/2,iy+is*0.95,Math.max(1,Math.floor(is/22)),1);ctx.restore();};
 if(f)rankFrame(x,y,sz,f.t,f.d,inner);else{ctx.fillStyle='#0b0c14';ctx.fillRect(x-1,y-1,sz+2,sz+2);ctx.fillStyle='#4a4f7a';ctx.fillRect(x,y,sz,sz);inner(x+2,y+2,sz-4);}}
let BRD={sel:null};
// ícones de perfil: 8 grátis; alguns no Passe; alguns na Caixa da Sorte; o resto vai para a loja no futuro
const ICON_FREE=['Saci','Iara','Curupira','Boitatá','Zeus','Thor','Anúbis','Yeti'];
const ICON_PASS={f:{7:'Mula sem Cabeça',15:'Caipora',23:'Lobisomem'},p:{5:'Medusa',13:'Poseidon',21:'Hades',29:'Fênix'}};
const ICON_BOX=['Dragão Escarlate','Kraken','Raijin','Sun Wukong','Rá','Drácula','Rei Arthur','Valquíria','Cuca','Mapinguari','Minotauro','Golem'];
const idOf=n=>{const c=CHARS.find(x=>x.name===n);return c?c.id:null;};
function iconOwned(id){const c=CHARS.find(x=>x.id===id);return !!c&&(ICON_FREE.includes(c.name)||(save.icons||[]).includes(id));}
function iconSrc(name){if(ICON_FREE.includes(name))return 'Grátis';for(const [lv,n] of Object.entries(ICON_PASS.f))if(n===name)return 'Passe nível '+lv;for(const [lv,n] of Object.entries(ICON_PASS.p))if(n===name)return 'Passe Premium '+lv;if(ICON_BOX.includes(name))return 'Caixa da Sorte';return 'Loja (em breve)';}
function giveIcon(id){save.icons=save.icons||[];if(id&&!save.icons.includes(id)){save.icons.push(id);persist();return true;}return false;}
function renderIcons(){screenBg();text('ÍCONE DE PERFIL',W/2,20,12,'#ffd23f','center','#0b0c14');text('Grátis, no Passe ou na Caixa da Sorte ao subir de elo. Mais ícones em breve na loja.',W/2,33,7,'#c9cbe6','center',null,PS);
 const list=[...ICON_FREE,...Object.values(ICON_PASS.f),...Object.values(ICON_PASS.p),...ICON_BOX];const cur=save.icon||idOf('Saci');
 list.forEach((n,i)=>{const id=idOf(n);if(!id)return;const x=22+(i%9)*50,y=44+Math.floor(i/9)*62,own=iconOwned(id),on=id===cur;
  ctx.fillStyle=on?'#ffd23f':'#0b0c14';ctx.fillRect(x-2,y-2,44,44);ctx.fillStyle=own?'#23264a':'#141626';ctx.fillRect(x,y,40,40);ctx.save();ctx.beginPath();ctx.rect(x,y,40,40);ctx.clip();drawSprite(id,x+20,y+38,1.6,1,false,own?1:0.25);ctx.restore();
  if(!own){text('?',x+20,y+26,12,'#6a6f98','center');}text(n.length>9?n.slice(0,8)+'…':n,x+20,y+50,6,own?'#ffffff':'#6a6f98','center',null,PS);text(own?(on?'EM USO':''):iconSrc(n),x+20,y+57,5,on?'#ffd23f':'#8a8fb8','center',null,PS);
  if(own)buttons.push({id:'ico:'+id,x,y,w:40,h:40});});
 btn('profile',8,244,80,20,'VOLTAR','#2e3358','#ffffff',7);}
function renderBorders(){screenBg();text('BORDAS DE ELO',W/2,20,12,'#ffd23f','center','#0b0c14');text('A cor vem do elo · as gemas vêm da divisão (IV → I) · Mestre e acima são animadas',W/2,33,7,'#c9cbe6','center',null,PS);
 // vitrine: cada elo com a divisão I (e IV de Ferro a Diamante em miniatura)
 for(let t=0;t<10;t++){const col=t%5,row=Math.floor(t/5),x=34+col*86,y=40+row*84;const sel=BRD.sel===t;
  rankFrame(x+14,y+6,40,t,3,(ix,iy,is)=>{ctx.fillStyle='#141626';ctx.fillRect(ix,iy,is,is);emblem(ix+is/2,iy+is/2,is*0.42,{tier:t<7?t:7,div:3,lp:t===8?200:t===9?500:0,placed:5});});
  text(TIERS[t].n,x+34,y+58,7,TIERS[t].col,'center',null,PS);if(t<7){for(let d=0;d<4;d++)rankFrame(x+2+d*17,y+62,12,t,d,(ix,iy,is)=>{ctx.fillStyle='#141626';ctx.fillRect(ix,iy,is,is);});}}
 // as suas
 panel(30,206,420,36);const R=save.rank,cur=frameKey(R),bs=R.borders||[];text('SUAS BORDAS',42,218,7,'#ffd23f','left');
 let x=42;const opts=[['elo',cur?'Elo atual: '+frameName(cur.t,cur.d):'Elo atual (sem elo)']].concat(bs.map(b=>['s'+b.s,`T${b.s}: ${frameName(b.t,b.d)}`]));
 opts.forEach(([k,lab])=>{const on=(save.frame||'elo')===k;ctx.font=`6px ${PX}`;const w=Math.min(140,ctx.measureText(lab).width+12);if(x+w>446)return;btn('frm:'+k,x,224,w,14,lab,on?'#ffd23f':'#2e3358',on?'#0b0c14':'#ffffff',5);x+=w+6;});
 const se=seasonInfo();text(`Temporada ${se.n} termina em ${se.left}. Você ganha a borda do maior elo que alcançar${R.peakName?` (até agora: ${R.peakName})`:''}.`,W/2,252,7,'#8ef0a0','center',null,PS);
 btn('profile',8,244,80,20,'VOLTAR','#2e3358','#ffffff',7);}
// temporadas de 3 meses: T1 = dez/2026 a fev/2027 (o servidor confirma)
function seasonInfo(){const n=save.rank.season||1,end=NET.seasonEnd||Date.UTC(2027,2,1,3);const d=Math.max(0,end-nowT());return {n,left:d>DAY?Math.ceil(d/DAY)+' dias':Math.ceil(d/3600000)+'h'};}