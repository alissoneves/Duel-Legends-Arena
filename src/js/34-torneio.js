// ---------- TORNEIO (16 vagas com bots) ----------
const ROUNDS=['Oitavas de final','Quartas de final','Semifinal','Final'];
let T=null,albSel=-1;
function startTournament(){const me=weightedPick();const others=[];
 while(others.length<15){const c=CHARS[Math.floor(Math.random()*CHARS.length)];if(c.id!==me.id&&!others.includes(c))others.push(c);}
 const slots=[me,...others];for(let i=slots.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[slots[i],slots[j]]=[slots[j],slots[i]];}
 T={me,rounds:[slots],r:0,alive:true,champion:null,lostAt:-1,bonus:0};state='bracket';save.seen[me.id]=true;persist();sfx('reveal');}
function tPair(){const cur=T.rounds[T.r];const i=cur.indexOf(T.me);return {i,foe:cur[i^1]};}
function simFight(a,b){const keepG=G,keepPick=pick,keepState=state;const arena=ARENAS[Math.floor(Math.random()*ARENAS.length)];arena.bg=arena.bg||buildArena(arena);
 pick={me:a,foe:b,arena};startMatch(true);G.p.bot=true;state='fight';let n=0;while(!G.over&&n<4000){update(1/30);n++;}
 const w=G.winner===G.p?a:b;G=keepG;pick=keepPick;state=keepState;return w;}
function tStartMatch(){const {foe}=tPair();const arena=ARENAS[Math.floor(Math.random()*ARENAS.length)];arena.bg=arena.bg||buildArena(arena);
 pick={me:T.me,foe,arena};startMatch();G.tour=true;G.diff=[0.8,0.9,1.0,1.15][T.r]*DIFFM[save.opt.diff];}
function tAdvance(playerWon){const cur=T.rounds[T.r];const next=[];
 for(let k=0;k<cur.length;k+=2){const a=cur[k],b=cur[k+1];let w;if(a===T.me||b===T.me)w=playerWon?T.me:(a===T.me?b:a);else w=simFight(a,b);next.push(w);}
 if(!playerWon&&T.alive){T.alive=false;T.lostAt=T.r;}
 T.rounds.push(next);T.r++;
 if(next.length===1){T.champion=next[0];if(T.champion===T.me){stx().tour++;achToast(achCheck());save.mastery[T.me.id]=(save.mastery[T.me.id]||0)+20;save.gd+=100;save.po+=2;persist();T.bonus=20;sfx('win');}}
 else if(!T.alive)tAdvance(false);}
function renderBracket(){const bg=ARENAS[6];bg.bg=bg.bg||buildArena(bg);ctx.drawImage(bg.bg,0,0);ctx.fillStyle='rgba(11,12,20,0.85)';ctx.fillRect(0,0,W,H);
 text('TORNEIO · 16 LENDAS',W/2,13,8,'#ffd23f','center','#0b0c14');
 const colX=[6,110,210,302],rowH=[13,26,52,104],y0=30;
 ['Oitavas','Quartas','Semi','Final'].forEach((l,i)=>text(l,colX[i]+48,27,9,'#ff8a3d','center',null,PS));
 const yOf=(r,k)=>y0+rowH[r]*k+rowH[r]/2;
 for(let r=0;r<Math.min(4,T.rounds.length);r++){const list=T.rounds[r];
  for(let k=0;k<list.length;k++){const c=list[k],x=colX[r],y=yOf(r,k);const isMe=c===T.me;const lost=r<T.r&&T.rounds[r+1]&&!T.rounds[r+1].includes(c);
   ctx.fillStyle=isMe?'rgba(70,209,96,0.28)':'rgba(30,33,58,0.95)';ctx.fillRect(x,y-6,94,12);
   ctx.save();ctx.beginPath();ctx.rect(x,y-6,12,12);ctx.clip();drawSprite(c.id,x+6,y+8,0.6,1,false,lost?0.35:1);ctx.restore();
   text(shortN(c,16),x+15,y+3,9,lost?'#6a6f98':isMe?'#8ef0a0':'#ffffff','left',null,PS);
   if(r<3){ctx.fillStyle='#4a4f7a';ctx.fillRect(x+94,y,4,1);if(k%2===0){const y2=yOf(r,k+1);ctx.fillRect(x+98,y,1,y2-y+1);ctx.fillRect(x+98,(y+y2)/2,colX[r+1]-x-98,1);}}}}
 const cx0=400,cy0=yOf(3,0)+26;
 ctx.fillStyle='#0b0c14';ctx.fillRect(cx0-2,72,80,104);ctx.fillStyle='#141626';ctx.fillRect(cx0,74,76,100);text('CAMPEÃO',cx0+38,86,7,'#ffd23f','center');
 if(T.champion){drawSprite(T.champion.id,cx0+38,150,2.4,1);text(shortN(T.champion,14),cx0+38,166,9,'#ffffff','center',null,PS);}
 else text('?',cx0+38,140,20,'#3a3f66','center');
 if(T.champion){const win=T.champion===T.me;
  text(win?'VOCÊ É O CAMPEÃO! +20 de maestria':`Você caiu na fase: ${ROUNDS[T.lostAt]}. Campeão: ${T.champion.name}`,W/2,250,10,win?'#8ef0a0':'#ffe2d0','center','#0b0c14',PS);
  btn('tour',300,224,92,18,'NOVO TORNEIO','#ff8a3d','#0b0c14',6);btn('menu',398,224,76,18,'MENU','#2e3358','#ffffff',7);}
 else{const {foe}=tPair();text(`${ROUNDS[T.r]}: ${T.me.name} contra ${foe.name}`,W/2-60,262,9,'#ffe2d0','center','#0b0c14',PS);
  btn('tfight',398,226,76,22,'LUTAR!','#ffd23f','#0b0c14',8);}}
function renderAlbum(){const bg=ARENAS[6];bg.bg=bg.bg||buildArena(bg);ctx.drawImage(bg.bg,0,0);ctx.fillStyle='rgba(11,12,20,0.88)';ctx.fillRect(0,0,W,H);
 const seenN=Object.keys(save.seen).length;text(`COLEÇÃO ${seenN}/${CHARS.length}`,8,18,8,'#ffd23f','left','#0b0c14');
 for(let i=0;i<CHARS.length;i++){const c=CHARS[i],col=i%12,row=Math.floor(i/12),x=8+col*30,y=25+row*22;const seen=!!save.seen[c.id];
  ctx.fillStyle=i===albSel?'#3a3f66':'#141626';ctx.fillRect(x,y,28,21);ctx.fillStyle=RAR[c.rar].col;ctx.fillRect(x,y+19,28,2);
  ctx.save();ctx.beginPath();ctx.rect(x,y,28,21);ctx.clip();if(seen)drawSprite(c.id,x+14,y+20,1,1);else drawSpriteDark(c.id,x+14,y+20,1);ctx.restore();
  buttons.push({id:'alb:'+i,x,y,w:28,h:21});}
 const px=374,py=26;ctx.fillStyle='#0b0c14';ctx.fillRect(px-2,py-2,104,220);ctx.fillStyle='#141626';ctx.fillRect(px,py,100,216);
 if(albSel<0)text('Toque numa lenda',px+50,py+100,9,'#8a8fb8','center',null,PS);
 else{const c=CHARS[albSel],seen=!!save.seen[c.id];ctx.fillStyle=RAR[c.rar].col;ctx.fillRect(px+20,py+4,60,10);text(c.rar.toUpperCase(),px+50,py+12,6,'#0b0c14','center');
  if(!seen){drawSpriteDark(c.id,px+50,py+70,2.4);text('???',px+50,py+86,12,'#8a8fb8','center',null,PS);text('Ainda não sorteada',px+50,py+100,9,'#8a8fb8','center',null,PS);}
  else{drawSprite(c.id,px+50,py+66,2.4,1);text(c.name,px+50,py+80,c.name.length>16?7:10,'#ffffff','center',null,PS);text(c.el,px+50,py+92,9,ELCOL[c.el]||'#ffffff','center',null,PS);
   [['ATQ',c.atk,'#ff6a3d'],['DEF',c.def,'#9aa3c7'],['VEL',c.vel,'#ffd23f'],['ESP',c.esp,'#4fc3ff'],['ESQ',c.esq,'#8ef0a0']].forEach((s2,i)=>{const yy=py+100+i*9;text(s2[0],px+4,yy+6,6,'#c9cbe6');bar(px+28,yy+1,48,5,(s2[1]-40)/60,s2[2]);text(String(s2[1]),px+96,yy+6,6,'#ffffff','right');});
   c.pw.forEach((p,i)=>text(`${'ABC'[i]} ${p.length>17?p.slice(0,16)+'…':p}`,px+4,py+158+i*10,8,'#ffe2d0','left',null,PS));
   const m=save.mastery[c.id]||0,gi=gemOf(m);text(`${GEMS[gi]} · ${m} pts`,px+50,py+196,9,GEMCOL[gi],'center',null,PS);if(gi>0)text(`+${gi*10}% no sorteio`,px+50,py+207,8,'#8ef0a0','center',null,PS);}}
 btn('menu',374,248,100,16,'VOLTAR','#2e3358','#ffffff',7);}
