// ---------- MONETIZAÇÃO: Gemas só para visuais e Passe (sem vantagem e sem sorte paga) ----------
const GEM_PACKS=[{g:100,b:0,brl:'R$ 4,90'},{g:450,b:50,brl:'R$ 19,90'},{g:950,b:150,brl:'R$ 39,90'},{g:2000,b:400,brl:'R$ 79,90'}];
const COS={
 aura:{n:'Auras',items:[['a_fogo','Aura de Fogo','#ff6a13',250],['a_gelo','Aura de Gelo','#7fe0ff',250],['a_sombra','Aura Sombria','#8a5cff',300],['a_ouro','Aura Dourada','#ffd23f',450],['a_arco','Aura Arco-íris','rainbow',600]]},
 trail:{n:'Rastros',items:[['t_faisca','Faíscas','#ffd23f',150],['t_petala','Pétalas','#ff9ad5',200],['t_estrela','Estrelas','#bfeaff',250],['t_fumaca','Fumaça','#8a8290',150],['t_raio','Raios','#4fd1ff',300]]},
 title:{n:'Títulos',items:[['ti_sortudo','O Sortudo','#46d160',100],['ti_lenda','Lenda Viva','#ffb02e',300],['ti_cacador','Caçador de Bots','#ff6a6a',150],['ti_recife','Rei do Recife','#4fc3ff',150],['ti_imbativel','Imbatível','#ff4d5e',400]]},
 emote:{n:'Emotes',items:[['e_gg','GG!','#ffffff',0],['e_uhu','Uhuuu!','#ffd23f',100],['e_sorte','Foi sorte!','#8ef0a0',100],['e_bora','Bora!','#ff8a3d',100],['e_hmm','Hmm...','#c77dff',150]]},
 frame:{n:'Molduras',items:[['f_bronze','Moldura de Bronze','#b9773f',100],['f_prata','Moldura de Prata','#b4c3d3',200],['f_ouro','Moldura de Ouro','#efbf4f',350],['f_neon','Moldura Neon','#4fd1ff',400]]}};
function cosFind(id){for(const k in COS)for(const c of COS[k].items)if(c[0]===id)return {k,id:c[0],n:c[1],col:c[2],price:c[3]};return null;}
function cosOwned(id){const c=cosFind(id);return c&&(c.price===0||save.cos.owned.includes(id));}
function cosInit(){if(!save.cos)save.cos={owned:[],eq:{emote:'e_gg'}};if(save.gems==null)save.gems=0;if(!save.pass)save.pass={season:1,xp:0,premium:false,cf:[],cp:[]};}
let cosCat='aura';
function cosColor(c,t){return c==='rainbow'?`hsl(${(t*120)%360},90%,60%)`:c;}
function renderCosShop(){const cats=Object.keys(COS);cats.forEach((k,i)=>btn('cc:'+k,10+i*66,46,64,12,COS[k].n,cosCat===k?'#4fd1ff':'#2e3358',cosCat===k?'#0b0c14':'#ffffff',5));
 text('Visuais aparecem em qualquer lenda sorteada e não dão vantagem.',W/2,72,8,'#c9cbe6','center',null,PS);
 COS[cosCat].items.forEach((c,i)=>{const x=12+(i%3)*152,y=78+Math.floor(i/3)*80,w=146,h=74,own=cosOwned(c[0]),eq=save.cos.eq[cosCat]===c[0];panel(x,y,w,h);
  const col=cosColor(c[2],time);if(cosCat==='aura'){ctx.fillStyle=col;ctx.globalAlpha=0.5+0.2*Math.sin(time*4);ctx.beginPath();ctx.ellipse(x+30,y+40,18,6,0,0,TAU);ctx.fill();ctx.globalAlpha=1;drawSprite('saci',x+30,y+40,1,1);}
  else if(cosCat==='trail'){for(let k=0;k<6;k++){ctx.fillStyle=col;ctx.globalAlpha=1-k/6;ctx.fillRect(x+12+k*6,y+30+Math.sin(time*6+k)*3,3,3);}ctx.globalAlpha=1;drawSprite('saci',x+54,y+40,1,1);}
  else if(cosCat==='title'){text(c[1],x+34,y+30,8,col,'center','#0b0c14',PS);drawSprite('saci',x+34,y+56,1,1);}
  else if(cosCat==='emote'){ctx.fillStyle='#ffffff';ctx.fillRect(x+8,y+14,50,16);ctx.fillRect(x+16,y+30,4,4);text(c[1],x+33,y+26,8,'#0b0c14','center',null,PS);drawSprite('saci',x+20,y+60,1,1);}
  else{ctx.strokeStyle=col;ctx.lineWidth=3;ctx.strokeRect(x+14,y+16,36,36);drawSprite('saci',x+32,y+48,1,1);}
  text(c[1],x+98,y+24,8,'#ffffff','center',null,PS);
  if(eq)text('EQUIPADO',x+98,y+44,7,'#46d160','center');
  if(own)btn('ceq:'+c[0],x+64,y+50,74,16,eq?'TIRAR':'EQUIPAR',eq?'#2e3358':'#46d160',eq?'#ffffff':'#0b0c14',6);
  else btn('cbuyc:'+c[0],x+64,y+50,74,16,`${c[3]} GEMAS`,(save.gems||0)>=c[3]?'#4fd1ff':'#3a3f66',(save.gems||0)>=c[3]?'#0b0c14':'#8a8fb8',6);});}
function renderGems(){text('GEMAS',W/2,58,10,'#4fd1ff','center','#0b0c14');text('Use em visuais e no Passe de Temporada. Nada de vantagem em luta.',W/2,72,9,'#c9cbe6','center',null,PS);
 GEM_PACKS.forEach((pk,i)=>{const x=12+i*114,y=82,w=108,h=120;panel(x,y,w,h);for(let k=0;k<Math.min(5,i+2);k++){ctx.fillStyle='#4fd1ff';const gx=x+w/2-12+((k%3)-1)*14,gy=y+30-Math.floor(k/3)*10;ctx.beginPath();ctx.moveTo(gx,gy-7);ctx.lineTo(gx+6,gy);ctx.lineTo(gx,gy+7);ctx.lineTo(gx-6,gy);ctx.closePath();ctx.fill();ctx.fillStyle='#ffffff';ctx.fillRect(gx-1,gy-4,2,3);}
  text(`${pk.g} gemas`,x+w/2,y+62,10,'#ffffff','center',null,PS);if(pk.b)text(`+${pk.b} de bônus`,x+w/2,y+74,8,'#46d160','center',null,PS);btn('gem:'+i,x+10,y+88,w-20,20,pk.brl,'#46d160','#0b0c14',7);});
 text('Protótipo: o pagamento não está ligado. No jogo real abre a Steam ou a Google Play.',W/2,216,8,'#ff8a3d','center',null,PS);}
function renderModal(){if(!modal)return;ctx.fillStyle='rgba(11,12,20,0.8)';ctx.fillRect(0,0,W,H);panel(90,70,300,120);text(modal.title,W/2,92,9,'#ffd23f','center');modal.lines.forEach((l,i)=>text(l,W/2,112+i*12,9,'#ffffff','center',null,PS));
 const n=modal.btns.length,bw=Math.min(104,(284-(n-1)*8)/n);modal.btns.forEach((b,i)=>btn(b[0],W/2-((n*(bw+8)-8)/2)+i*(bw+8),160,bw,20,b[1],b[2],'#0b0c14',6));}