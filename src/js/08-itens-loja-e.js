// ---------- ITENS, LOJA E FORJA ----------
// Duel Gold (GD) e Pó Mágico só se ganham jogando. Teto de bônus: ITEM_CAP (normal) e ITEM_CAP_RANK (ranqueada).
const ITEM_CAP=150,ITEM_CAP_RANK=50;
const SLOTS=[{id:'arma',n:'Arma'},{id:'mao',n:'Mão secundária'},{id:'corpo',n:'Corpo'},{id:'costas',n:'Costas'},{id:'pes',n:'Pés'},{id:'cabeca',n:'Cabeça'}];
// preço e força sobem com a raridade; Supremo não é vendido na loja
const RARI=[{n:'Normal',col:'#c9cbe6',pts:3,price:120},{n:'Incomum',col:'#46d160',pts:6,price:400},{n:'Raro',col:'#4f8dff',pts:10,price:1200},{n:'Épico',col:'#b07aff',pts:15,price:3500},{n:'Lendário',col:'#ffb02e',pts:21,price:9000},{n:'Supremo',col:'#ff4d5e',pts:28,price:20000}];
const SHOP_ODDS=[0.45,0.30,0.17,0.07,0.01,0],BOX_ODDS=[0.50,0.30,0.145,0.042,0.010,0.003];
const STN={atk:'ATQ',def:'DEF',vel:'VEL',esp:'ESP',esq:'ESQ'};
// 34 tipos x 6 raridades = 204 itens (gerado por itens/gen_items.py)
const BASES={"varinha":{"slot":"arma","k":"Varinha","icon":"varinha","st":{"esp":1,"vel":0.3},"names":["Varinha Simples","Varinha de Bronze","Varinha do Cavaleiro","Varinha da Tempestade","Varinha de Merlin","Varinha Suprema"]},"cajado":{"slot":"arma","k":"Cajado","icon":"cajado","st":{"esp":1.1,"def":0.2},"names":["Cajado de Treino","Cajado Polido","Cajado das Sombras","Cajado do Dragão","Cajado do Olimpo","Cajado Primordial"]},"espada":{"slot":"arma","k":"Espada","icon":"espada","st":{"atk":1,"vel":0.3},"names":["Espada Rústica","Espada Reforçada","Espada de Prata","Espada do Titã","Excalibur","Espada Divina"]},"adaga":{"slot":"arma","k":"Adaga","icon":"adaga","st":{"atk":0.7,"esq":0.6},"names":["Adaga Velha","Adaga do Viajante","Adaga Encantada","Adaga Celestial","Adaga da Fênix","Adaga do Infinito"]},"maca":{"slot":"arma","k":"Maça","icon":"maca","st":{"atk":0.8,"def":0.5},"names":["Maça Gasta","Maça do Caçador","Maça Rúnica","Maça Arcana","Maça de Avalon","Maça do Juízo Final"]},"martelo":{"slot":"arma","k":"Martelo","icon":"martelo","st":{"atk":1.1,"def":0.25},"names":["Martelo Simples","Martelo de Bronze","Martelo do Cavaleiro","Martelo da Tempestade","Martelo de Asgard","Martelo do Trovão Primordial"]},"machado":{"slot":"arma","k":"Machado","icon":"machado","st":{"atk":1.3},"names":["Machado de Treino","Machado Polido","Machado das Sombras","Machado do Dragão","Machado do Olimpo","Machado Primordial"]},"lanca":{"slot":"arma","k":"Lança","icon":"lanca","st":{"atk":0.9,"vel":0.4},"names":["Lança Rústica","Lança Reforçada","Lança de Prata","Lança do Titã","Lança de Lugh","Lança Divina"]},"arco":{"slot":"arma","k":"Arco","icon":"arco","st":{"atk":0.8,"esq":0.5},"names":["Arco Velho","Arco do Viajante","Arco Encantado","Arco Celestial","Arco de Ártemis","Arco do Infinito"]},"escudo":{"slot":"mao","k":"Escudo","icon":"escudo","st":{"def":1,"esq":0.25},"names":["Escudo Gasto","Escudo do Caçador","Escudo Rúnico","Escudo Arcano","Égide","Escudo do Juízo Final"]},"broquel":{"slot":"mao","k":"Broquel","icon":"broquel","st":{"def":0.6,"esq":0.6},"names":["Broquel Simples","Broquel de Bronze","Broquel do Cavaleiro","Broquel da Tempestade","Broquel de Asgard","Broquel Supremo"]},"orbe":{"slot":"mao","k":"Orbe","icon":"orbe","st":{"esp":0.8,"def":0.4},"names":["Orbe de Treino","Orbe Polido","Orbe das Sombras","Orbe do Dragão","Olho de Hórus","Orbe Primordial"]},"tomo":{"slot":"mao","k":"Tomo","icon":"tomo","st":{"esp":1.2},"names":["Tomo Rústico","Tomo Reforçado","Tomo de Prata","Tomo do Titã","Tomo do Kraken","Tomo Divino"]},"talisma":{"slot":"mao","k":"Talismã","icon":"talisma","st":{"esp":0.6,"esq":0.6},"names":["Talismã Velho","Talismã do Viajante","Talismã Encantado","Talismã Celestial","Talismã da Fênix","Talismã do Infinito"]},"armadura":{"slot":"corpo","k":"Armadura","icon":"armadura","st":{"def":1.25},"names":["Armadura Gasta","Armadura do Caçador","Armadura Rúnica","Armadura Arcana","Armadura de Avalon","Armadura do Juízo Final"]},"cota":{"slot":"corpo","k":"Cota de Malha","icon":"cota","st":{"def":0.9,"esq":0.3},"names":["Cota de Malha Simples","Cota de Malha de Bronze","Cota de Malha do Cavaleiro","Cota de Malha da Tempestade","Cota de Malha de Asgard","Cota de Malha Suprema"]},"peitoral":{"slot":"corpo","k":"Peitoral","icon":"peitoral","st":{"def":0.8,"atk":0.4},"names":["Peitoral de Treino","Peitoral Polido","Peitoral das Sombras","Peitoral do Dragão","Peitoral do Olimpo","Peitoral Primordial"]},"manto":{"slot":"corpo","k":"Manto","icon":"manto","st":{"esp":0.7,"esq":0.6},"names":["Manto Rústico","Manto Reforçado","Manto de Prata","Manto do Titã","Manto do Kraken","Manto Divino"]},"tunica":{"slot":"corpo","k":"Túnica","icon":"tunica","st":{"vel":0.6,"esq":0.6},"names":["Túnica Velha","Túnica do Viajante","Túnica Encantada","Túnica Celestial","Túnica da Fênix","Túnica do Infinito"]},"colete":{"slot":"corpo","k":"Colete","icon":"colete","st":{"def":0.6,"vel":0.6},"names":["Colete Gasto","Colete do Caçador","Colete Rúnico","Colete Arcano","Colete de Avalon","Colete do Juízo Final"]},"capa":{"slot":"costas","k":"Capa","icon":"capa","st":{"esq":1,"vel":0.3},"names":["Capa Simples","Capa de Bronze","Capa do Cavaleiro","Capa da Tempestade","Capa de Asgard","Capa Suprema"]},"aljava":{"slot":"costas","k":"Aljava","icon":"aljava","st":{"atk":0.6,"vel":0.6},"names":["Aljava de Treino","Aljava Polida","Aljava das Sombras","Aljava do Dragão","Aljava do Olimpo","Aljava Primordial"]},"estandarte":{"slot":"costas","k":"Estandarte","icon":"estandarte","st":{"atk":0.5,"def":0.5,"esp":0.3},"names":["Estandarte Rústico","Estandarte Reforçado","Estandarte de Prata","Estandarte do Titã","Estandarte do Kraken","Estandarte Divino"]},"capote":{"slot":"costas","k":"Capote","icon":"capote","st":{"def":0.6,"esq":0.6},"names":["Capote Velho","Capote do Viajante","Capote Encantado","Capote Celestial","Capote da Fênix","Capote do Infinito"]},"bota":{"slot":"pes","k":"Bota","icon":"bota","st":{"vel":1,"def":0.25},"names":["Bota Gasta","Bota do Caçador","Bota Rúnica","Bota Arcana","Bota de Hermes","Bota do Juízo Final"]},"sandalia":{"slot":"pes","k":"Sandália","icon":"sandalia","st":{"vel":0.8,"esq":0.5},"names":["Sandália Simples","Sandália de Bronze","Sandália do Cavaleiro","Sandália da Tempestade","Sandália de Mercúrio","Sandália Suprema"]},"greva":{"slot":"pes","k":"Greva","icon":"greva","st":{"def":0.8,"vel":0.5},"names":["Greva de Treino","Greva Polida","Greva das Sombras","Greva do Dragão","Greva do Olimpo","Greva Primordial"]},"sapato":{"slot":"pes","k":"Sapato","icon":"sapato","st":{"vel":0.7,"esp":0.5},"names":["Sapato Rústico","Sapato Reforçado","Sapato de Prata","Sapato do Titã","Sapato do Kraken","Sapato Divino"]},"chapeu":{"slot":"cabeca","k":"Chapéu","icon":"chapeu","st":{"esp":1,"esq":0.2},"names":["Chapéu Velho","Chapéu do Viajante","Chapéu Encantado","Chapéu Celestial","Chapéu da Fênix","Chapéu do Infinito"]},"bandana":{"slot":"cabeca","k":"Bandana","icon":"bandana","st":{"atk":0.7,"vel":0.5},"names":["Bandana Gasta","Bandana do Caçador","Bandana Rúnica","Bandana Arcana","Bandana de Avalon","Bandana do Juízo Final"]},"bone":{"slot":"cabeca","k":"Boné","icon":"bone","st":{"esq":0.7,"vel":0.5},"names":["Boné Simples","Boné de Bronze","Boné do Cavaleiro","Boné da Tempestade","Boné de Asgard","Boné Supremo"]},"elmo":{"slot":"cabeca","k":"Elmo","icon":"elmo","st":{"def":1,"atk":0.3},"names":["Elmo de Treino","Elmo Polido","Elmo das Sombras","Elmo do Dragão","Elmo de Hades","Elmo Primordial"]},"capuz":{"slot":"cabeca","k":"Capuz","icon":"capuz","st":{"esq":0.9,"esp":0.3},"names":["Capuz Rústico","Capuz Reforçado","Capuz de Prata","Capuz do Titã","Capuz do Kraken","Capuz Divino"]},"tiara":{"slot":"cabeca","k":"Tiara","icon":"tiara","st":{"esp":0.8,"vel":0.4},"names":["Tiara Velha","Tiara do Viajante","Tiara Encantada","Tiara Celestial","Tiara da Fênix","Tiara do Infinito"]}};
const UPG={po:[1,1,2,2,3,3,4,5,6,8],chance:[1,1,1,1,1,1,1,0.7,0.5,0.35]};
function itemName(it){return tr(BASES[it.b].names[it.r])+(it.up?` +${it.up}`:'');}
function itemStats(it){const B=BASES[it.b],o={},m=1+0.08*it.up;for(const k in B.st)o[k]=Math.round(RARI[it.r].pts*B.st[k]*m);return o;}
function itemPower(it){const o=itemStats(it);return Object.values(o).reduce((a,b)=>a+b,0);}
function itemPrice(it){return RARI[it.r].price;}const DISM=[1,2,3,6,12,25];function dismPo(it){return DISM[it.r]+Math.floor((it.up||0)/2);}
function newItem(b,r){save.uid=(save.uid||0)+1;return {id:save.uid,b,r,up:0};}
function invById(id){return save.inv.find(x=>x.id===id);}
function gearRaw(){const o={atk:0,def:0,vel:0,esp:0,esq:0};for(const sl of SLOTS){const it=invById(save.equip[sl.id]);if(it){const st=itemStats(it);for(const k in st)o[k]+=st[k];}}return o;}
function capGear(o,cap){const tot=Object.values(o).reduce((a,b)=>a+b,0);if(tot<=cap)return o;const f=cap/tot,r={};for(const k in o)r[k]=Math.round(o[k]*f);return r;}
function myGear(ranked){return capGear(gearRaw(),ranked?ITEM_CAP_RANK:ITEM_CAP);}
function gearTotal(o){return Object.values(o).reduce((a,b)=>a+b,0);}
function botGear(def,power){const ks=['atk','def','vel','esp','esq'],w=ks.map(k=>def[k]+rnd(-10,10)),sw=w.reduce((a,b)=>a+b,0),o={};ks.forEach((k,i)=>o[k]=Math.round(power*w[i]/sw));return o;}
function applyGear(f,g){f.gear=g;for(const k in g)f.st[k]+=g[k];f.guardMax=f.st.def*3;f.guard=f.guardMax;f.speed=(70+0.7*f.st.vel)*(f.def.melee?BAL.meleeSpeed:1)*BAL.move;f.dashCd=6-f.st.esq/25;}
function itemsInit(){if(!save.inv){save.inv=[];save.equip={};const st=[newItem('espada',0),newItem('armadura',0),newItem('bota',0)];save.inv.push(...st);save.equip={arma:st[0].id,corpo:st[1].id,pes:st[2].id};}
 save.gd=save.gd==null?150:save.gd;save.po=save.po==null?2:save.po;if(!save.shop||!save.shop.items)shopRoll();}
function rollOdds(T){let r=Math.random();for(let i=0;i<T.length;i++){if(r<T[i])return i;r-=T[i];}return 0;}
function rollRarity(){return rollOdds(SHOP_ODDS);}
function shopRoll(){const bs=Object.keys(BASES);save.shop={items:Array.from({length:6},()=>({b:bs[Math.floor(Math.random()*bs.length)],r:rollRarity(),sold:false})),n:0};}
function gemReward(gi){return [null,1,2,2,3,3,4,4,5][gi];}
let bagSel=null,bagFilter='all',bagMsg=null,bagPage=0,shopMsg=null,prepSlot=null,prepInfo=null;
function msgSet(txt,col){return {txt,col,t:performance.now()};}
function drawIcon(b,x,y,s,col){b=(BASES[b]&&BASES[b].icon)||b;const M={
 varinha:['......#.','.....###','......#.','.....b..','....b...','...b....','..b.....','.b......'],
 espada:['.......w','......ww','.....ww.','....ww..','.b.ww...','..bw....','.bdb....','b..b....'],
 maca:['....#.#.','...####.','..######','...####.','..b#.#..','.b......','b.......','........'],
 machado:['....##..','...####.','..b####.','.b..##..','b.......','........','........','........'],
 escudo:['.######.','########','###ww###','###ww###','########','.######.','..####..','...##...'],
 orbe:['..####..','.#ww###.','##w#####','########','########','.######.','..####..','...bb...'],
 armadura:['.##..##.','########','###ww###','########','.######.','.######.','.##..##.','........'],
 manto:['...##...','..####..','.######.','.######.','########','########','########','#.#..#.#'],
 capa:['.ww..ww.','.######.','.######.','########','########','########','#######.','.#.#.#..'],
 bota:['..###...','..###...','..###...','..###...','..#####.','.#######','.#######','........'],
 sandalia:['........','..#..#..','..####..','...##...','..####..','.######.','.bbbbbbb','........'],
 chapeu:['....#...','...##...','...###..','..####..','..#ww#..','.######.','########','........'],
 bandana:['........','########','#ww##ww#','########','......##','.......#','......#.','........'],
 bone:['........','..####..','.######.','.##ww##.','########','########','.....###','........'],
 cajado:['.....##.','....#ww#','.....##.','.....b..','....b...','...b....','..b.....','.b......'],
 adaga:['........','......ww','.....ww.','....ww..','..bww...','...b....','..b.....','........'],
 martelo:['..####..','..####..','..####..','...b....','...b....','...b....','...b....','...b....'],
 lanca:['.......w','......ww','.....bw.','....b...','...b....','..b.....','.b......','b.......'],
 arco:['..#b....','.#..b...','#....b..','#....w..','#....b..','.#..b...','..#b....','........'],
 broquel:['..####..','.######.','###ww###','###ww###','.######.','..####..','........','........'],
 tomo:['.######.','.#wwww#.','.#w##w#.','.#wwww#.','.######.','.######.','.bbbbbb.','........'],
 talisma:['..b..b..','...bb...','...##...','..####..','..#ww#..','..####..','...##...','........'],
 cota:['.##..##.','#w#ww#w#','########','#w#w#w##','.######.','.#w#w#w.','.##..##.','........'],
 peitoral:['........','.##..##.','########','##w##w##','########','.######.','..####..','........'],
 tunica:['.##..##.','########','.######.','.######.','.######.','..####..','..####..','..#..#..'],
 colete:['.#....#.','.##..##.','.##..##.','.##ww##.','.##..##.','.##..##.','.######.','........'],
 aljava:['..w.w.w.','..b.b.b.','.######.','.######.','.######.','.######.','..####..','........'],
 estandarte:['b.......','b######.','b##ww##.','b######.','b#####..','b####...','b.......','b.......'],
 capote:['..####..','.######.','########','########','###ww###','########','########','.#.##.#.'],
 greva:['.####...','.#ww#...','.####...','.####...','.#####..','.######.','.######.','........'],
 sapato:['........','........','..###...','..####..','.######.','########','bbbbbbbb','........'],
 elmo:['..####..','.######.','########','#ww##ww#','########','##....##','##....##','........'],
 capuz:['...##...','..####..','.######.','.#dddd#.','##dddd##','########','########','........'],
 tiara:['........','...w....','#..#..#.','##.#.##.','########','........','........','........']}[b];
 if(!M)return;const C={'#':col,b:'#8a5a2b',w:'#ffffff',d:'#0b0c14'};
 for(let r=0;r<8;r++)for(let c=0;c<8;c++){const ch=M[r][c];if(ch&&ch!=='.'){ctx.fillStyle=C[ch];ctx.fillRect(Math.round(x+c*s),Math.round(y+r*s),Math.ceil(s),Math.ceil(s));}}}
function itemCard(it,x,y,w,h,sel){ctx.fillStyle=sel?'#3a3f66':'#141626';ctx.fillRect(x,y,w,h);ctx.fillStyle=RARI[it.r].col;ctx.fillRect(x,y+h-2,w,2);drawIcon(it.b,x+(w-16)/2,y+(h-18)/2,2,RARI[it.r].col);if(it.up)text('+'+it.up,x+w-2,y+7,5,'#ffd23f','right','#0b0c14');}
function statLine(st){return Object.entries(st).map(([k,v])=>`${STN[k]} +${v}`).join('  ');}
function gdBar(){text(`GD ${save.gd}`,W-8,18,9,'#ffd23f','right','#0b0c14',PS);text(`Pó Mágico ${save.po}`,W-8,30,9,'#c77dff','right','#0b0c14',PS);}
// ---- LOJA antiga (substituída) ----
function renderShopOld(){screenBg();text('LOJA',W/2,22,12,'#ffd23f','center','#0b0c14');gdBar();text('Compre com Duel Gold (GD), que você ganha jogando',W/2,36,9,'#c9cbe6','center','#0b0c14',PS);
 save.shop.items.forEach((o,i)=>{const x=12+(i%3)*112,y=46+Math.floor(i/3)*92,w=106,h=86;panel(x,y,w,h);const it={b:o.b,r:o.r,up:0};
  ctx.globalAlpha=o.sold?0.35:1;drawIcon(o.b,x+6,y+6,3,RARI[o.r].col);text(tr(BASES[o.b].names[o.r]),x+34,y+12,8,'#ffffff','left',null,PS);text(RARI[o.r].n,x+34,y+22,8,RARI[o.r].col,'left',null,PS);text(SLOTS.find(q=>q.id===BASES[o.b].slot).n,x+34,y+31,7,'#8a8fb8','left',null,PS);
  const st=itemStats(it);Object.entries(st).forEach(([k,v],j)=>text(`${STN[k]} +${v}`,x+8+j*48,y+44,8,'#8ef0a0','left',null,PS));ctx.globalAlpha=1;
  if(o.sold)text('VENDIDO',x+w/2,y+70,7,'#6a6f98','center');else btn('buy:'+i,x+8,y+58,w-16,20,`${itemPrice(it)} GD`,save.gd>=itemPrice(it)?'#ffd23f':'#3a3f66',save.gd>=itemPrice(it)?'#0b0c14':'#8a8fb8',7);});
 panel(352,46,118,178);drawIcon('orbe',382,54,4,'#c77dff');text('PÓ MÁGICO',411,98,7,'#c77dff','center');text('Melhora itens até +10',411,110,8,'#c9cbe6','center',null,PS);text('Também cai nas partidas',411,120,8,'#c9cbe6','center',null,PS);
 btn('buypo:1',360,130,102,20,'1 por 150 GD',save.gd>=150?'#c77dff':'#3a3f66','#0b0c14',6);btn('buypo:5',360,156,102,20,'5 por 650 GD',save.gd>=650?'#c77dff':'#3a3f66','#0b0c14',6);
 btn('reroll',360,190,102,20,'NOVAS OFERTAS 40',save.gd>=40?'#2e3358':'#1d2140','#ffffff',5);text(`Ofertas novas a cada 3 partidas (${3-(save.shop.n||0)} restantes)`,W/2,236,8,'#8a8fb8','center',null,PS);
 if(shopMsg&&performance.now()-shopMsg.t<2200)text(shopMsg.txt,W/2,226,10,shopMsg.col,'center','#0b0c14',PS);
 btn('menu',8,244,80,20,'VOLTAR','#2e3358','#ffffff',7);btn('bag',W-108,246,100,18,'MOCHILA','#2e3358','#ffffff',6);}
// ---- MOCHILA E FORJA ----
function bagList(){let L=save.inv.slice();if(bagFilter!=='all')L=L.filter(it=>BASES[it.b].slot===bagFilter);return L.sort((a,b)=>itemPower(b)-itemPower(a));}
function renderBag(){screenBg();text('MOCHILA E FORJA',W/2,20,11,'#ffd23f','center','#0b0c14');gdBar();
 const tabs=[['all','Todos'],...SLOTS.map(q=>[q.id,q.n.split(' ')[0]])];tabs.forEach((t,i)=>btn('bf:'+t[0],10+i*48,30,46,14,t[1],bagFilter===t[0]?'#ffd23f':'#2e3358',bagFilter===t[0]?'#0b0c14':'#ffffff',5));
 const L=bagList(),per=40,pages=Math.max(1,Math.ceil(L.length/per));bagPage=Math.min(bagPage,pages-1);
 panel(10,48,272,186);if(!L.length)text('Nada aqui ainda. Visite a loja!',146,140,9,'#6a6f98','center',null,PS);
 L.slice(bagPage*per,bagPage*per+per).forEach((it,i)=>{const x=14+(i%8)*33,y=52+Math.floor(i/8)*36;itemCard(it,x,y,31,32,bagSel===it.id);if(Object.values(save.equip).includes(it.id)){ctx.fillStyle='#46d160';ctx.fillRect(x+1,y+1,8,8);text('E',x+5,y+8,5,'#0b0c14','center');}buttons.push({id:'bsel:'+it.id,x,y,w:31,h:32});});
 if(pages>1){btn('bpg:-1',14,236,30,10,'<','#2e3358','#ffffff',5);text(`${bagPage+1}/${pages}`,64,244,7,'#c9cbe6','center',null,PS);btn('bpg:1',84,236,30,10,'>','#2e3358','#ffffff',5);}
 panel(292,48,178,186);const it=invById(bagSel);
 if(!it)text('Toque num item',381,140,9,'#8a8fb8','center',null,PS);
 else{const R=RARI[it.r],eq=save.equip[BASES[it.b].slot]===it.id;drawIcon(it.b,300,56,4,R.col);text(itemName(it),336,66,9,'#ffffff','left',null,PS);text(`${R.n} · ${BASES[it.b].k}`,336,77,8,R.col,'left',null,PS);text(SLOTS.find(q=>q.id===BASES[it.b].slot).n,336,87,8,'#8a8fb8','left',null,PS);
  const st=itemStats(it);Object.entries(st).forEach(([k,v],j)=>{text(`${STN[k]} +${v}`,300+j*56,104,9,'#8ef0a0','left',null,PS);});
  btn('beq',300,112,162,18,eq?'TIRAR DO HERÓI':'EQUIPAR',eq?'#2e3358':'#46d160',eq?'#ffffff':'#0b0c14',7);
  // forja
  ctx.fillStyle='#0b0c14';ctx.fillRect(300,136,162,1);text('FORJA',381,146,6,'#c77dff','center');
  if(it.up>=10)text('Nível máximo: +10!',381,166,9,'#ffd23f','center',null,PS);
  else{const po=UPG.po[it.up],gd=40*(it.up+1),ch=UPG.chance[it.up];const nx={...it,up:it.up+1},st2=itemStats(nx);
   text(`+${it.up} → +${it.up+1}: ${statLine(st2)}`,381,158,8,'#ffffff','center',null,PS);text(`Custo: ${po} pó + ${gd} GD · chance ${Math.round(ch*100)}%`,381,169,8,ch<1?'#ff9a9a':'#c9cbe6','center',null,PS);
   if(ch<1)text('Se falhar, volta de 1 a 3 níveis (nunca quebra)',381,179,7,'#ff9a9a','center',null,PS);
   const can=save.po>=po&&save.gd>=gd;btn('bup',300,184,162,20,'MELHORAR',can?'#c77dff':'#3a3f66',can?'#0b0c14':'#8a8fb8',7);}
  btn('bsell',300,210,162,16,`DESMANCHAR: +${dismPo(it)} PÓ`,'#5a2a6a','#ffffff',5);}
 if(bagMsg&&performance.now()-bagMsg.t<2600){const k=Math.min(1,(performance.now()-bagMsg.t)/150);ctx.globalAlpha=k;text(bagMsg.txt,381,252,10,bagMsg.col,'center','#0b0c14',PS);ctx.globalAlpha=1;}
 btn('menu',8,244,80,20,'VOLTAR','#2e3358','#ffffff',7);btn('shop',96,244,80,20,'LOJA','#2e3358','#ffffff',7);btn('box',184,244,112,20,save.boxes>1?`ABRIR CAIXA x${save.boxes}`:save.boxes>0?'ABRIR CAIXA':'CAIXA DA SORTE',save.boxes>0?'#8ef0a0':'#2e3358',save.boxes>0?'#0b0c14':'#ffffff',6);renderModal();}

