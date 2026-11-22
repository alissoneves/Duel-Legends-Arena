// ---------- PASSE DE TEMPORADA ----------
const PASS_LV=30,PASS_XP=500,PASS_PRICE=600;
function passReward(lv,prem){{const nm=(prem?ICON_PASS.p:ICON_PASS.f)[lv];if(nm)return {k:'icon',id:idOf(nm),txt:'Ícone: '+nm};}if(!prem){if(lv%5===0)return {k:'po',n:3,txt:'3 Pó Mágico'};if(lv%3===0)return {k:'gd',n:70,txt:'70 GD'};return {k:'gd',n:25,txt:'25 GD'};}
 const P={2:'t_faisca',4:'ti_sortudo',6:'a_fogo',8:'e_uhu',10:'f_bronze',12:'t_petala',14:'ti_cacador',16:'a_gelo',18:'e_bora',20:'f_prata',22:'t_estrela',24:'ti_lenda',26:'a_sombra',28:'f_ouro',30:'a_arco'};
 if(P[lv]){const c=cosFind(P[lv]);return {k:'cos',id:P[lv],txt:c.n};}return {k:'gems',n:lv%5===0?100:30,txt:(lv%5===0?100:30)+' Gemas'};}
function passLevel(){return Math.min(PASS_LV,Math.floor(save.pass.xp/PASS_XP));}
let passPage=0;
function renderPass(){screenBg();const P=save.pass,lv=passLevel();text(`PASSE DE TEMPORADA ${P.season}`,W/2,18,11,'#ffd23f','center','#0b0c14');text(`Gemas ${save.gems||0}`,W-8,14,9,'#4fd1ff','right','#0b0c14',PS);
 text(`Nível ${lv}/${PASS_LV}`,12,36,10,'#ffffff','left','#0b0c14',PS);bar(80,31,200,5,lv>=PASS_LV?1:(P.xp%PASS_XP)/PASS_XP,'#ffd23f');text(`${P.xp%PASS_XP}/${PASS_XP} XP · +100 por partida, +50 por vitória`,290,36,8,'#c9cbe6','left',null,PS);
 text('GRÁTIS',8,82,6,'#46d160','left');text('PREMIUM',8,132,6,'#ffb02e','left');
 for(let i=0;i<8;i++){const L=passPage*8+i+1;if(L>PASS_LV)break;const x=52+i*52,on=L<=lv;text(String(L),x+23,52,8,on?'#ffd23f':'#6a6f98','center');
  for(const prem of [false,true]){const y=prem?110:60,r=passReward(L,prem),claimed=(prem?P.cp:P.cf).includes(L),locked=prem&&!P.premium;ctx.fillStyle=claimed?'#1c3a26':on&&!locked?'#2a2f55':'#141626';ctx.fillRect(x,y,46,46);
   if(r.k==='icon'){ctx.save();ctx.beginPath();ctx.rect(x+3,y+3,40,28);ctx.clip();drawSprite(r.id,x+23,y+30,1,1);ctx.restore();}else if(r.k==='cos'){const c=cosFind(r.id);const cc=cosColor(c.col,time);ctx.fillStyle=cc;ctx.fillRect(x+15,y+8,16,16);}else if(r.k==='po')drawIcon('orbe',x+15,y+6,2,'#c77dff');else if(r.k==='gems'){ctx.fillStyle='#4fd1ff';ctx.beginPath();ctx.moveTo(x+23,y+6);ctx.lineTo(x+31,y+15);ctx.lineTo(x+23,y+24);ctx.lineTo(x+15,y+15);ctx.closePath();ctx.fill();}else{ctx.fillStyle='#ffd23f';ctx.beginPath();ctx.arc(x+23,y+15,8,0,TAU);ctx.fill();text('G',x+23,y+19,6,'#0b0c14','center');}
   text(r.txt.slice(0,12),x+23,y+30,6,'#ffffff','center',null,PS);if(locked){text('🔒',x+38,y+10,7,'#ffb02e','center',null,PS);}
   if(claimed)text('PEGO',x+23,y+41,5,'#46d160','center');else if(on&&!locked)btn(`pc:${prem?1:0}:${L}`,x+3,y+33,40,11,'PEGAR','#ffd23f','#0b0c14',5);}}
 btn('ppg:-1',8,166,24,14,'<','#2e3358','#ffffff',6);btn('ppg:1',W-32,166,24,14,'>','#2e3358','#ffffff',6);text(`Níveis ${passPage*8+1}–${Math.min(PASS_LV,passPage*8+8)}`,W/2,176,8,'#8a8fb8','center',null,PS);
 if(!P.premium){panel(70,188,340,40);{let gsum=0;for(let l=1;l<=PASS_LV;l++){const r=passReward(l,true);if(r.k==='gems')gsum+=r.n;}text(`Passe Premium: 15 visuais exclusivos + ${gsum} Gemas de volta ao completar`,W/2,202,8,'#ffffff','center',null,PS);}btn('passbuy',W/2-70,210,140,14,`ATIVAR · ${PASS_PRICE} GEMAS`,(save.gems||0)>=PASS_PRICE?'#ffb02e':'#3a3f66','#0b0c14',5);}
 else text('PREMIUM ATIVO! Pegue as recompensas da trilha de cima e de baixo.',W/2,204,9,'#ffb02e','center','#0b0c14',PS);
 if(shopMsg&&performance.now()-shopMsg.t<2200)text(shopMsg.txt,W/2,240,10,shopMsg.col,'center','#0b0c14',PS);
 btn('menu',8,248,60,16,'VOLTAR','#2e3358','#ffffff',6);btn('shop',W-88,248,80,16,'LOJA','#ffd23f','#0b0c14',6);renderModal();}
