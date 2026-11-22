// ---------- ARENAS ----------
function weakTo(el){return Object.keys(STRONG).filter(k=>STRONG[k].includes(el));}
const ARENAS=[
 {id:'vulcao',name:'Vulcão',el:'Fogo',tiles:['#3a2828','#402c2b','#35242a'],wall:'#1a1214',deco:'#5a3b33',amb:'ember',hz:'lava'},
 {id:'recife',name:'Recife',el:'Água',tiles:['#1d4e6b','#1f5674','#1a4862'],wall:'#0e2a3b',deco:'#2f7194',amb:'bubble',hz:'current'},
 {id:'tundra',name:'Tundra Congelada',el:'Gelo',tiles:['#dbe6f0','#e4edf5','#d0deea'],wall:'#8aa3bd',deco:'#b8cde0',amb:'snow',hz:'ice'},
 {id:'templo',name:'Templo do Sol',el:'Luz',tiles:['#c4a257','#cbab61','#b9984f'],wall:'#6e5627',deco:'#e0c27a',amb:'mote',hz:'beam'},
 {id:'castelo',name:'Castelo do Conde',el:'Vampiro',tiles:['#2b2233','#30263a','#271f2f'],wall:'#130e18',deco:'#43354f',amb:'dust',hz:'beam'},
 {id:'bosque',name:'Bosque Feérico',el:'Elfo',tiles:['#1e4d36','#22573d','#1b4630'],wall:'#0f2a1d',deco:'#2f6b4c',amb:'firefly',hz:'mush'},
 {id:'coliseu',name:'Coliseu',el:'Neutro',tiles:['#b89a74','#c2a47d','#ad8f6a'],wall:'#5e4a35',deco:'#d1b48b',amb:'none',hz:'none'},
];
ARENAS.forEach(a=>{a.down=a.el==='Neutro'?[]:weakTo(a.el);});
function arenaMod(arena,el){if(el==='Neutro'||arena.el==='Neutro')return 1;if(el===arena.el)return 1.1;if(arena.down.includes(el))return 0.9;return 1;}
let BX1=12,BY1=40,BX2=468,BY2=262,WW=W,WH=H; // limites da arena (mudam a cada partida: o mapa é maior que a tela)
const B0={x1:12,y1:40,x2:468,y2:262};
const WORLD={'1x1':[720,420],'2x2':[800,460],'3x3':[820,480],'5x5':[920,540],'ffa':[920,540]};
function setWorld(mode){const d=WORLD[mode]||WORLD['1x1'];WW=d[0];WH=d[1];BX1=16;BY1=16;BX2=WW-16;BY2=WH-16;}
function buildArena(a,w,h,b){w=w||W;h=h||H;b=b||B0;
  const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');
  let seed=a.id.length*997;const r=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  for(let y=0;y<h;y+=16)for(let x=0;x<w;x+=16){g.fillStyle=a.tiles[Math.floor(r()*3)];g.fillRect(x,y,16,16);if(r()<0.18){g.fillStyle=a.deco;g.fillRect(x+Math.floor(r()*10)+2,y+Math.floor(r()*10)+2,4,2);}}
  if(a.id==='castelo'){g.fillStyle='#5a1426';const my=Math.round((b.y1+b.y2)/2)-11;g.fillRect(b.x1+40,my,b.x2-b.x1-80,22);g.fillStyle='#7a1f33';g.fillRect(b.x1+40,my+3,b.x2-b.x1-80,2);g.fillRect(b.x1+40,my+17,b.x2-b.x1-80,2);}
  if(a.id==='coliseu'){g.strokeStyle='rgba(94,74,53,0.5)';g.lineWidth=2;g.beginPath();g.arc((b.x1+b.x2)/2,(b.y1+b.y2)/2,40,0,TAU);g.stroke();}
  if(a.id==='templo'){g.fillStyle='#e8cf8a';for(let x=b.x1+48;x<b.x2-20;x+=90){g.fillRect(x,b.y1+4,10,6);}}
  // paredes
  g.fillStyle=a.wall;g.fillRect(0,0,w,b.y1);g.fillRect(0,b.y2,w,h-b.y2);g.fillRect(0,0,b.x1,h);g.fillRect(b.x2,0,w-b.x2,h);
  g.fillStyle='rgba(0,0,0,0.25)';g.fillRect(b.x1,b.y1,b.x2-b.x1,6);
  g.fillStyle='rgba(255,255,255,0.08)';g.fillRect(b.x1-2,b.y1-2,b.x2-b.x1+4,2);
  return c;
}
let vignette=null;
function buildVignette(){const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');const gr=g.createRadialGradient(W/2,H/2,H*0.3,W/2,H/2,H*0.95);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,0.55)');g.fillStyle=gr;g.fillRect(0,0,W,H);vignette=c;}
buildVignette();
