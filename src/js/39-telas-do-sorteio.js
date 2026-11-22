// ---------- TELAS DO SORTEIO ----------
function card(c,x,y,w,h,showStats){const rc=RAR[c.rar].col;ctx.fillStyle='#0b0c14';ctx.fillRect(x-2,y-2,w+4,h+4);ctx.fillStyle='#141626';ctx.fillRect(x,y,w,h);ctx.strokeStyle=rc;ctx.lineWidth=2;ctx.strokeRect(x+1,y+1,w-2,h-2);
 const glow=0.15+0.1*Math.sin(time*5);ctx.fillStyle=rc;ctx.globalAlpha=glow;ctx.fillRect(x+2,y+2,w-4,h-4);ctx.globalAlpha=1;
 ctx.fillStyle=rc;ctx.fillRect(x+w/2-26,y+6,52,11);text(c.rar.toUpperCase(),x+w/2,y+15,6,'#0b0c14','center');
 drawSprite(c.id,x+w/2,y+(showStats?72:76),showStats?2.6:2.4,1);
 text(c.name,x+w/2,y+(showStats?86:92),c.name.length>16?9:c.name.length>10?11:13,'#ffffff','center','#0b0c14',PS);
 const el=c.el;ctx.fillStyle=ELCOL[el];const ew=ctx.measureText(el).width;ctx.font=`10px ${PS}`;const tw=ctx.measureText(el).width+8;ctx.fillRect(x+w/2-tw/2,y+(showStats?90:96),tw,11);text(el,x+w/2,y+(showStats?99:105),10,'#0b0c14','center',null,PS);
 if(showStats){const st=[['ATQ',c.atk,'#ff6a3d'],['DEF',c.def,'#9aa3c7'],['VEL',c.vel,'#ffd23f'],['ESP',c.esp,'#4fc3ff'],['ESQ',c.esq,'#8ef0a0']];
  st.forEach((s,i)=>{const yy=y+108+i*9;text(s[0],x+6,yy+6,6,'#c9cbe6','left');bar(x+30,yy+1,w-58,5,(s[1]-40)/60,s[2]);text(String(s[1]),x+w-6,yy+6,6,'#ffffff','right');});}}
function roulette(x,y,w,h,list,t,drawFn){const i=Math.floor(t*(14-t*3))%list.length;drawFn(list[(i+list.length)%list.length],x,y,w,h);}
function renderDraw(){if(pick.choosing)return renderRankPick();if(isMulti())return renderDrawGrid();const a=pick.arena;ctx.drawImage(a.bg,0,0);ctx.fillStyle='rgba(11,12,20,0.78)';ctx.fillRect(0,0,W,H);
 text('SORTEIO',W/2,22,10,'#ffd23f','center','#0b0c14');if(pick.mode)text(pick.ranked?`Ranqueada 1x1 · rival: ${pick.oppName?pick.oppName:save.rank.placed<5?'colocação':rankName(Object.assign({},fromScore((save.rank.oppMmr||1150)-400),{lp:0}))}`:MODES[pick.mode].lab,W/2,34,9,'#c9cbe6','center','#0b0c14',PS);
 // jogador
 text('VOCÊ',88,44,8,'#8ef0a0','center','#0b0c14');
 if(revealed[0]&&pick.fixed){ctx.fillStyle='#4fd1ff';ctx.fillRect(22,240,132,26);ctx.strokeStyle='#0b0c14';ctx.lineWidth=2;ctx.strokeRect(22,240,132,26);text(dayHeroActive()?'LENDA FIXA DO DIA':'LENDA DO FIM DE SEMANA',88,251,6,'#0b0c14','center');text('escolhida na roleta',88,261,8,'#0b0c14','center',null,PS);}
 else if(revealed[0]&&pick.me.id===weekLegend().id){const p=0.75+0.25*Math.sin(performance.now()/160);ctx.globalAlpha=p;ctx.fillStyle='#ffd23f';ctx.fillRect(22,240,132,26);ctx.globalAlpha=1;ctx.strokeStyle='#0b0c14';ctx.lineWidth=2;ctx.strokeRect(22,240,132,26);text('★ LENDA DA SEMANA ★',88,251,7,'#0b0c14','center');text(`+${Math.round(WEEK_BONUS*100)}% de GD se vencer`,88,261,8,'#0b0c14','center',null,PS);}
 if(!revealed[0])roulette(28,50,120,160,CHARS,drawT,(c,x,y,w,h)=>{ctx.fillStyle='#141626';ctx.fillRect(x,y,w,h);drawSprite(c.id,x+w/2,y+100,3,1,false,0.6);text('?',x+w/2,y+140,16,'#ffd23f','center','#0b0c14');});
 else{if(pick.allies&&pick.allies.length){const nm=pick.allies.map(c=>c.name.length>12?c.name.slice(0,11)+'.':c.name);text('Aliados: '+nm.slice(0,2).join(', '),88,247,8,'#7fc8ff','center','#0b0c14',PS);if(nm.length>2)text(nm.slice(2).join(', '),88,257,8,'#7fc8ff','center','#0b0c14',PS);}if(pick.ranked){text(`RANQUEADA · ${rankLabel(save.rank)}`,88,247,8,rankCol(save.rank),'center','#0b0c14',PS);}card(pick.me,28,50,120,160,true);const m=save.mastery[pick.me.id]||0,g=gemOf(m);text(`${GEMS[g]} · ${m} maestria`,88,224,9,GEMCOL[g],'center','#0b0c14',PS);if(g>0)text(`+${g*10}% de chance no sorteio`,88,235,9,'#8ef0a0','center','#0b0c14',PS);}
 // oponente
 text(pick.mode==='ffa'?'RIVAIS':isMulti()?'EQUIPE RIVAL':'OPONENTE',W/2,44,8,'#ff9a9a','center','#0b0c14');
 if(!revealed[1])roulette(W/2-50,60,100,120,CHARS,Math.max(0,drawT-1.4),(c,x,y,w,h)=>{ctx.fillStyle='#141626';ctx.fillRect(x,y,w,h);drawSprite(c.id,x+w/2,y+86,2.4,-1,false,0.6);text('?',x+w/2,y+110,14,'#ff9a9a','center','#0b0c14');});
 else{if(pick.foes&&pick.foes.length>1){const ex='+ '+pick.foes.slice(1).map(c=>c.name.length>12?c.name.slice(0,11)+'.':c.name).join(', ');let fz=9;ctx.font=`${fz}px ${PS}`;while(fz>6&&ctx.measureText(ex).width>176){fz--;ctx.font=`${fz}px ${PS}`;}text(ex,W/2,210,fz,'#ff9a9a','center','#0b0c14',PS);}card(pick.foe,W/2-50,60,100,120,false);const e=mult(pick.me.el,pick.foe.el),e2=mult(pick.foe.el,pick.me.el);
  text(e>1?'Você tem vantagem!':e2>1?'Ele tem vantagem!':'Elementos neutros',W/2,196,10,e>1?'#8ef0a0':e2>1?'#ff9a9a':'#c9cbe6','center','#0b0c14',PS);}
 // arena
 text('ARENA',392,44,8,'#ff8a3d','center','#0b0c14');
 const ax=332,ay=50,aw=120,ah=160;ctx.fillStyle='#0b0c14';ctx.fillRect(ax-2,ay-2,aw+4,ah+4);ctx.fillStyle='#141626';ctx.fillRect(ax,ay,aw,ah);
 if(!revealed[2]){const i=Math.floor(drawT*12)%ARENAS.length;const ar=ARENAS[i];ctx.fillStyle=ar.tiles[0];ctx.fillRect(ax+10,ay+20,aw-20,60);text(ar.name,ax+aw/2,ay+100,10,'#ffffff','center','#0b0c14',PS);}
 else{ctx.drawImage(a.bg,120,80,240,120,ax+6,ay+8,aw-12,60);ctx.strokeStyle=ELCOL[a.el]||'#c9cbe6';ctx.lineWidth=2;ctx.strokeRect(ax+6,ay+8,aw-12,60);
  text(a.name,ax+aw/2,ay+84,a.name.length>12?10:12,'#ffffff','center','#0b0c14',PS);
  if(a.el==='Neutro')text('Sem efeito de elemento',ax+aw/2,ay+100,9,'#c9cbe6','center',null,PS);
  else{text(`${a.el}: +10%`,ax+aw/2,ay+100,9,'#8ef0a0','center',null,PS);text(`${a.down.join(', ')}: −10%`,ax+aw/2,ay+112,9,'#ff9a9a','center',null,PS);}
  const mp=arenaMod(a,pick.me.el),mf=arenaMod(a,pick.foe.el);
  text(`Você: ${mp>1?'+10%':mp<1?'−10%':'sem efeito'}`,ax+aw/2,ay+132,9,mp>1?'#8ef0a0':mp<1?'#ff9a9a':'#ffffff','center',null,PS);
  text(`Oponente: ${mf>1?'+10%':mf<1?'−10%':'sem efeito'}`,ax+aw/2,ay+144,9,mf>1?'#8ef0a0':mf<1?'#ff9a9a':'#ffffff','center',null,PS);
  const hzT={lava:'Perigo: poças de lava',current:'Perigo: correntezas',ice:'Perigo: gelo escorregadio',beam:'Perigo: feixes de luz',mush:'Perigo: cogumelos teleporte',none:'Sem perigos'}[a.hz];text(hzT,ax+aw/2,ay+156,8,'#ffe2d0','center',null,PS);}
 if(drawT>5.2)btn('fight',W/2-56,222,112,24,'PREPARAR!','#ffd23f','#0b0c14',9);if(pick&&pick.online&&drawT>6.5&&state==='draw')enterNetPrep();}
// ---- ranqueada: escolha 1 de 3 ----
function renderRankPick(){const a=pick.arena;ctx.drawImage(a.bg,0,0);ctx.fillStyle='rgba(11,12,20,0.84)';ctx.fillRect(0,0,W,H);
 const left=Math.max(0,Math.ceil(15-(performance.now()-pick.chooseT0)/1000));
 text('ESCOLHA SUA LENDA',W/2,20,11,'#ffd23f','center','#0b0c14');text(`Ranqueada · rival: ${pick.oppName||'?'} · ${left}s`,W/2,33,9,'#c9cbe6','center','#0b0c14',PS);
 pick.opts.forEach((c,i)=>{const x=W/2-196+i*136,y=46,sel=NET.rmy===i;if(NET.rmy!=null&&!sel)ctx.globalAlpha=0.35;card(c,x,y,120,160,true);ctx.globalAlpha=1;
  if(sel){ctx.strokeStyle='#46d160';ctx.lineWidth=3;ctx.strokeRect(x-4,y-4,128,168);}
  const m=save.mastery[c.id]||0;text(`${m} maestria`,x+60,y+172,8,GEMCOL[gemOf(m)],'center','#0b0c14',PS);
  if(NET.rmy==null)btn('rpick:'+i,x+10,y+180,100,20,'ESCOLHER','#46d160','#0b0c14',8);});
 if(NET.rmy!=null)text('Aguardando o rival escolher'+'.'.repeat(1+Math.floor(time*2)%3),W/2,240,10,'#8ef0a0','center','#0b0c14',PS);
 else text('O rival também escolhe 1 de 3. As escolhas aparecem juntas.',W/2,262,8,'#8a8fb8','center','#0b0c14',PS);}
// ---- sorteio em grade (2x2, 3x3, 5x5, todos contra todos) ----
function gridAt(i){return 0.5+i*0.3;}
function renderDrawGrid(){const a=pick.arena;ctx.drawImage(a.bg,0,0);ctx.fillStyle='rgba(11,12,20,0.8)';ctx.fillRect(0,0,W,H);
 const SW=72,SH=86,GP=4,X0=8,AREA=5*SW+4*GP;
 text('SORTEIO',X0+AREA/2,16,10,'#ffd23f','center','#0b0c14');text(MODES[pick.mode].lab,X0+AREA/2,28,9,'#c9cbe6','center','#0b0c14',PS);
 const ffa=pick.mode==='ffa',all=[pick.me,...(pick.allies||[]),...(pick.foes||[])],nm=pick.names||[];
 const nT=ffa?Math.ceil(all.length/2):1+(pick.allies||[]).length;
 const rows=[{lab:ffa?'TODOS CONTRA TODOS':'SUA EQUIPE',col:ffa?'#ffd23f':'#7fc8ff',from:0,to:nT,y:44},{lab:ffa?'':'EQUIPE RIVAL',col:'#ff9a9a',from:nT,to:all.length,y:144}];
 rows.forEach((r,ri)=>{if(r.lab)text(r.lab,X0+AREA/2,r.y-4,7,r.col,'center','#0b0c14');const n=r.to-r.from,x0=X0+(AREA-(n*SW+(n-1)*GP))/2;
  for(let k=0;k<n;k++){const i=r.from+k,c=all[i],x=x0+k*(SW+GP),y=r.y,me=i===0,shown=(pick.gridN||0)>i,friend=!ffa&&ri===0;
   ctx.fillStyle='#0b0c14';ctx.fillRect(x-1,y-1,SW+2,SH+2);ctx.fillStyle=me?'#1c3a26':friend?'#1c2a40':'#3a1c22';ctx.fillRect(x,y,SW,SH);
   if(!shown){const R2=CHARS[Math.floor(time*14+i*7)%CHARS.length];drawSprite(R2.id,x+SW/2,y+56,2,1,false,0.35);text('?',x+SW/2,y+76,12,r.col,'center','#0b0c14');continue;}
   const rc=RAR[c.rar].col;ctx.strokeStyle=me?'#8ef0a0':rc;ctx.lineWidth=me?3:2;ctx.strokeRect(x+1,y+1,SW-2,SH-2);
   const who=me?'VOCÊ':(nm[i]||(ffa?'Rival':friend?'Aliado':'Bot'));text(who.slice(0,11),x+SW/2,y+11,7,me?'#8ef0a0':'#ffffff','center',null,PS);
   drawSprite(c.id,x+SW/2,y+58,2,friend||me?1:-1);
   text(c.name.length>12?c.name.slice(0,11)+'.':c.name,x+SW/2,y+70,7,'#ffffff','center',null,PS);text(c.el,x+SW/2,y+80,6,ELCOL[c.el]||'#ffffff','center',null,PS);}});
 // arena
 const ax=392,ay=44,aw=82,ah=186;ctx.fillStyle='#0b0c14';ctx.fillRect(ax-1,ay-1,aw+2,ah+2);ctx.fillStyle='#141626';ctx.fillRect(ax,ay,aw,ah);text('ARENA',ax+aw/2,ay-4,7,'#ff8a3d','center','#0b0c14');
 if(!revealed[2]){const ar=ARENAS[Math.floor(drawT*12)%ARENAS.length];ctx.fillStyle=ar.tiles[0];ctx.fillRect(ax+6,ay+8,aw-12,44);text('?',ax+aw/2,ay+80,12,'#ff8a3d','center','#0b0c14');}
 else{ctx.drawImage(a.bg,120,80,240,120,ax+6,ay+8,aw-12,44);ctx.strokeStyle=ELCOL[a.el]||'#c9cbe6';ctx.lineWidth=2;ctx.strokeRect(ax+6,ay+8,aw-12,44);
  const w=a.name.split(' ');text(w.slice(0,2).join(' '),ax+aw/2,ay+66,8,'#ffffff','center',null,PS);if(w.length>2)text(w.slice(2).join(' '),ax+aw/2,ay+76,8,'#ffffff','center',null,PS);
  if(a.el==='Neutro')text('Sem elemento',ax+aw/2,ay+94,7,'#c9cbe6','center',null,PS);else{text(`${a.el}: +10%`,ax+aw/2,ay+94,7,'#8ef0a0','center',null,PS);a.down.forEach((d,k)=>text(`${d}: −10%`,ax+aw/2,ay+105+k*10,7,'#ff9a9a','center',null,PS));}
  const mp=arenaMod(a,pick.me.el);text(`Você: ${mp>1?'+10%':mp<1?'−10%':'normal'}`,ax+aw/2,ay+142,7,mp>1?'#8ef0a0':mp<1?'#ff9a9a':'#ffffff','center',null,PS);
  const hzT={lava:'Poças de lava',current:'Correntezas',ice:'Gelo liso',beam:'Feixes de luz',mush:'Cogumelos',none:'Sem perigos'}[a.hz];text(hzT,ax+aw/2,ay+158,7,'#ffe2d0','center',null,PS);}
 if(drawT>5.2)btn('fight',X0+AREA/2-56,240,112,24,'PREPARAR!','#ffd23f','#0b0c14',9);if(pick&&pick.online&&drawT>6.5&&state==='draw')enterNetPrep();}
// ---- prêmio diário: sequência de 7 dias ----