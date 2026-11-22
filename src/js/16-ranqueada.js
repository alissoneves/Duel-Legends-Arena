// ---------- RANQUEADA (estilo LoL: elos, divisões IV a I, PDL, MMR oculto, colocação, proteção) ----------
const TIERS=[{n:'Ferro',col:'#8a7d77'},{n:'Bronze',col:'#b9773f'},{n:'Prata',col:'#b4c3d3'},{n:'Ouro',col:'#efbf4f'},{n:'Platina',col:'#4fc6b2'},{n:'Esmeralda',col:'#2fcf74'},{n:'Diamante',col:'#7fb0ff'},{n:'Mestre',col:'#bc84ff'},{n:'Grão-Mestre',col:'#ff5a64'},{n:'Desafiante',col:'#ffdc72'}];
const ROMAN=['IV','III','II','I'];
function rankInit(){const r=save.rank;if(!r||r.tier==null)save.rank={tier:-1,div:0,lp:0,mmr:1150,placed:0,w:0,l:0,shield:0,streak:0,peak:-1,peakName:'',season:1,split:1};}
function apexOf(r){return r.tier<7?r.tier:r.lp>=500?9:r.lp>=200?8:7;}
function rankName(r){if(r.tier<0)return 'Sem elo';const t=apexOf(r);return t>=7?TIERS[t].n:`${TIERS[t].n} ${ROMAN[r.div]}`;}
function rankCol(r){return r.tier<0?'#9aa3c7':TIERS[apexOf(r)].col;}
function rankScore(r){return r.tier>=7?2800+r.lp:r.tier*400+r.div*100+r.lp;}
function fromScore(sc){sc=Math.max(0,sc);if(sc>=2800)return{tier:7,div:0,lp:0};return{tier:Math.floor(sc/400),div:Math.floor((sc%400)/100),lp:0};}
function rankLabel(r){if(r.tier<0)return r.placed>0?`Colocação ${r.placed}/5`:'Sem elo';return `${rankName(r)} · ${r.lp} PDL`;}
function rankedResult(win){const r=save.rank;const opp=r.oppMmr||r.mmr;const exp=1/(1+Math.pow(10,(opp-r.mmr)/400));r.mmr=Math.round(r.mmr+(r.placed<5?60:28)*((win?1:0)-exp));
 if(win)r.w++;else r.l++;r.streak=win?Math.max(1,r.streak+1):Math.min(-1,r.streak-1);const out={win,d:0};
 if(r.placed<5){r.placed++;out.placement=r.placed;if(r.placed===5){const f=fromScore(r.mmr-400-60);r.tier=f.tier;r.div=f.div;r.lp=f.tier>=7?0:Math.round(rnd(10,40));out.placedNow=rankName(r);r.shield=3;out.box=true;}}
 else{const gap=(r.mmr-400-rankScore(r))/20;const shieldWas=r.shield;r.shield=Math.max(0,r.shield-1);
  if(win){out.d=Math.round(clamp(21+gap+(r.streak>=3?3:0),14,34));r.lp+=out.d;
   if(r.tier<7)while(r.lp>=100){r.lp-=100;if(r.div<3){r.div++;out.promo=rankName(r);}else{r.tier++;r.div=0;r.shield=3;out.promo=rankName(r);out.tierUp=true;r.boxT=r.boxT||[];if(!r.boxT.includes(r.tier)){r.boxT.push(r.tier);out.box=true;}if(r.tier>=7){r.lp=0;break;}}}}
  else{out.d=-Math.round(clamp(18-gap,10,28));
   if(r.tier>=7){r.lp+=out.d;if(r.lp<0){if(shieldWas>0){r.lp=0;out.shield=true;}else{r.tier=6;r.div=3;r.lp=75;out.demo=rankName(r);}}}
   else if(r.lp>0)r.lp=Math.max(0,r.lp+out.d);
   else if(r.div>0){r.div--;r.lp=75;out.demo=rankName(r);}
   else if(r.tier>0){if(shieldWas>0){out.shield=true;}else{r.tier--;r.div=3;r.lp=75;out.demo=rankName(r);}}}}
 if(out.box)save.boxes=(save.boxes||0)+1;
 if(r.tier>=0&&rankScore(r)>r.peak){r.peak=rankScore(r);r.peakName=rankName(r);}
 out.after=rankLabel(r);out.col=rankCol(r);return out;}
function emblem(x,y,sz,r){const t=r.tier<0?-1:apexOf(r);const col=t<0?'#4a4f7a':TIERS[t].col;const s=sz/20;ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(s,s);
 if(t>=3){ctx.fillStyle=col;ctx.globalAlpha=0.7;for(const sg of [-1,1]){ctx.beginPath();ctx.moveTo(sg*8,-6);ctx.lineTo(sg*20,-12);ctx.lineTo(sg*16,-2);ctx.lineTo(sg*20,2);ctx.lineTo(sg*10,6);ctx.closePath();ctx.fill();}ctx.globalAlpha=1;}
 ctx.fillStyle='#0b0c14';ctx.beginPath();ctx.moveTo(0,-15);ctx.lineTo(13,-9);ctx.lineTo(11,8);ctx.lineTo(0,16);ctx.lineTo(-11,8);ctx.lineTo(-13,-9);ctx.closePath();ctx.fill();
 ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(0,-13);ctx.lineTo(11,-8);ctx.lineTo(9,7);ctx.lineTo(0,14);ctx.lineTo(-9,7);ctx.lineTo(-11,-8);ctx.closePath();ctx.fill();
 ctx.fillStyle='rgba(255,255,255,0.35)';ctx.beginPath();ctx.moveTo(0,-13);ctx.lineTo(11,-8);ctx.lineTo(0,-2);ctx.lineTo(-11,-8);ctx.closePath();ctx.fill();
 ctx.fillStyle='#0b0c14';ctx.beginPath();ctx.moveTo(0,-5);ctx.lineTo(5,0);ctx.lineTo(0,6);ctx.lineTo(-5,0);ctx.closePath();ctx.fill();ctx.fillStyle=t<0?'#6a6f98':'#ffffff';ctx.beginPath();ctx.moveTo(0,-3);ctx.lineTo(3,0);ctx.lineTo(0,4);ctx.lineTo(-3,0);ctx.closePath();ctx.fill();
 if(t>=7){ctx.fillStyle='#ffe58a';ctx.fillRect(-7,-20,14,4);ctx.fillRect(-7,-24,3,4);ctx.fillRect(-1.5,-25,3,5);ctx.fillRect(4,-24,3,4);}
 ctx.restore();}
const MODES={'1x1':{n:1,lab:'Duelo 1x1'},'2x2':{n:2,lab:'Duplas 2x2'},'3x3':{n:3,lab:'Trios 3x3'},'5x5':{n:5,lab:'Equipes 5x5'},'ffa':{n:6,lab:'Todos contra todos'}};
