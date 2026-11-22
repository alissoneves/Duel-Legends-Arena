// ---------- LOJA (catálogo + promoções da semana) ----------
let shopTab='destaques',catSlot='all',catRar=-1,catPage=0,catSel=null,modal=null;
function weekNo(){return Math.floor((Date.now()-Date.UTC(2026,0,5))/(7*864e5));}
function seeded(n){let x=Math.sin(n*9301+49297)*233280;return x-Math.floor(x);}
function weeklyPromos(){const w=weekNo(),KB=Object.keys(BASES),out=[];for(let i=0;i<3;i++){const b=KB[Math.floor(seeded(w*7+i*13)*KB.length)],r=[2,3,4][i],off=[0.3,0.4,0.5][i];out.push({b,r,off,price:Math.round(RARI[r].price*(1-off)/10)*10,k:w+':'+i});}return out;}
function daysLeft(){const ms=Date.UTC(2026,0,5)+(weekNo()+1)*7*864e5-Date.now();return Math.max(1,Math.ceil(ms/864e5));}
function catalog(){const L=[];for(const b in BASES)for(let r=0;r<5;r++)L.push({b,r,up:0});return L.filter(it=>(catSlot==='all'||BASES[it.b].slot===catSlot)&&(catRar<0||it.r===catRar));}
function buyItem(b,r,price){if(save.gd<price){shopMsg=msgSet('GD insuficiente','#ff9a9a');sfx('beep');return false;}save.gd-=price;const it=newItem(b,r);save.inv.push(it);bagSel=it.id;persist();shopMsg=msgSet('Comprado: '+itemName(it),'#8ef0a0');sfx('reveal');return true;}
function shopHeader(){screenBg();text('LOJA',W/2,18,12,'#ffd23f','center','#0b0c14');text(`GD ${save.gd}`,W-8,14,9,'#ffd23f','right','#0b0c14',PS);text(`Pó ${save.po}`,W-8,25,9,'#c77dff','right','#0b0c14',PS);text(`Gemas ${save.gems||0}`,W-8,36,9,'#4fd1ff','right','#0b0c14',PS);
 [['destaques','DESTAQUES'],['catalogo','CATÁLOGO'],['visuais','VISUAIS'],['gemas','GEMAS']].forEach((t,i)=>btn('stab:'+t[0],10+i*84,26,80,15,t[1],shopTab===t[0]?'#ffd23f':'#2e3358',shopTab===t[0]?'#0b0c14':'#ffffff',6));}
function renderShop(){shopHeader();
 if(shopTab==='destaques'){text(`PROMOÇÕES DA SEMANA · terminam em ${daysLeft()} dia(s)`,12,54,7,'#ff8a3d','left');
  weeklyPromos().forEach((o,i)=>{const x=12+i*112,y=60,w=106,h=124,R=RARI[o.r],it={b:o.b,r:o.r,up:0},got=(save.promos||{})[o.k];panel(x,y,w,h);
   ctx.fillStyle='#e0393e';ctx.fillRect(x+w-38,y,38,14);text(`-${Math.round(o.off*100)}%`,x+w-19,y+11,7,'#ffffff','center');
   drawIcon(o.b,x+(w-32)/2,y+18,4,R.col);text(BASES[o.b].names[o.r],x+w/2,y+62,8,'#ffffff','center',null,PS);text(R.n+' · '+SLOTS.find(q=>q.id===BASES[o.b].slot).n,x+w/2,y+72,7,R.col,'center',null,PS);
   text(statLine(itemStats(it)),x+w/2,y+84,8,'#8ef0a0','center',null,PS);text(`${R.price} GD`,x+w/2,y+96,8,'#8a8fb8','center',null,PS);ctx.fillStyle='#8a8fb8';ctx.fillRect(x+w/2-18,y+93,36,1);
   if(got)text('COMPRADO',x+w/2,y+113,7,'#46d160','center');else btn('promo:'+i,x+8,y+102,w-16,16,`${o.price} GD`,save.gd>=o.price?'#ffd23f':'#3a3f66',save.gd>=o.price?'#0b0c14':'#8a8fb8',7);});
  panel(352,48,118,136);drawIcon('orbe',382,54,4,'#c77dff');text('PÓ MÁGICO',411,98,7,'#c77dff','center');text('Melhora itens até +10',411,110,8,'#c9cbe6','center',null,PS);
  btn('buypo:1',360,118,102,18,'1 por 150 GD',save.gd>=150?'#c77dff':'#3a3f66','#0b0c14',6);btn('buypo:5',360,142,102,18,'5 por 650 GD',save.gd>=650?'#c77dff':'#3a3f66','#0b0c14',6);
  panel(12,194,458,40);text('Todos os itens estão no CATÁLOGO. Visuais e o Passe usam Gemas.',W/2,208,9,'#c9cbe6','center',null,PS);text('Gemas nunca compram itens, GD, Pó Mágico ou caixas: só aparência e o Passe.',W/2,222,8,'#8a8fb8','center',null,PS);}
 else if(shopTab==='catalogo'){const tabs=[['all','Todos'],...SLOTS.map(q=>[q.id,q.n.split(' ')[0]])];tabs.forEach((t,i)=>btn('cs:'+t[0],10+i*46,46,44,12,t[1],catSlot===t[0]?'#ffd23f':'#2e3358',catSlot===t[0]?'#0b0c14':'#ffffff',5));
  [[-1,'Todas'],...RARI.slice(0,5).map((R,i)=>[i,R.n])].forEach((t,i)=>btn('cr:'+t[0],10+i*54,62,52,11,t[1],catRar===t[0]?(t[0]<0?'#ffd23f':RARI[t[0]].col):'#1d2140',catRar===t[0]?'#0b0c14':(t[0]<0?'#ffffff':RARI[t[0]].col),5));
  const L=catalog(),per=24,pages=Math.max(1,Math.ceil(L.length/per));catPage=Math.min(catPage,pages-1);panel(10,78,322,156);
  L.slice(catPage*per,catPage*per+per).forEach((it,i)=>{const x=14+(i%8)*40,y=82+Math.floor(i/8)*50,sel=catSel&&catSel.b===it.b&&catSel.r===it.r;ctx.fillStyle=sel?'#3a3f66':'#141626';ctx.fillRect(x,y,38,47);ctx.fillStyle=RARI[it.r].col;ctx.fillRect(x,y+45,38,2);drawIcon(it.b,x+11,y+4,2,RARI[it.r].col);
   text(BASES[it.b].names[it.r].split(' ')[0].slice(0,8),x+19,y+30,6,'#ffffff','center',null,PS);text(String(RARI[it.r].price),x+19,y+41,6,save.gd>=RARI[it.r].price?'#ffd23f':'#8a8fb8','center');buttons.push({id:`csel:${it.b}:${it.r}`,x,y,w:38,h:47});});
  text(`${L.length} itens · página ${catPage+1}/${pages}`,170,244,7,'#8a8fb8','center',null,PS);btn('cpg:-1',90,236,24,12,'<','#2e3358','#ffffff',6);btn('cpg:1',226,236,24,12,'>','#2e3358','#ffffff',6);
  panel(340,48,130,186);if(!catSel)text('Toque num item',405,140,9,'#8a8fb8','center',null,PS);else{const it=catSel,R=RARI[it.r];drawIcon(it.b,389,54,4,R.col);text(BASES[it.b].names[it.r],405,98,8,'#ffffff','center',null,PS);text(R.n,405,108,8,R.col,'center',null,PS);text(SLOTS.find(q=>q.id===BASES[it.b].slot).n+' · '+BASES[it.b].k,405,118,7,'#8a8fb8','center',null,PS);
   Object.entries(itemStats(it)).forEach(([k,v],j)=>text(`${STN[k]} +${v}`,405,134+j*11,9,'#8ef0a0','center',null,PS));text(`Com +10: ${statLine(itemStats({...it,up:10}))}`,405,168,6,'#c9cbe6','center',null,PS);
   const own=save.inv.filter(x=>x.b===it.b&&x.r===it.r).length;if(own)text(`Você tem ${own}`,405,180,7,'#46d160','center',null,PS);btn('cbuy',348,188,114,22,`COMPRAR ${R.price} GD`,save.gd>=R.price?'#ffd23f':'#3a3f66',save.gd>=R.price?'#0b0c14':'#8a8fb8',6);}}
 else if(shopTab==='visuais')renderCosShop();else renderGems();
 if(shopMsg&&performance.now()-shopMsg.t<2200)text(shopMsg.txt,W/2,256,10,shopMsg.col,'center','#0b0c14',PS);
 btn('menu',8,248,60,16,'VOLTAR','#2e3358','#ffffff',6);btn('bag',W-78,248,70,16,'MOCHILA','#2e3358','#ffffff',6);renderModal();}