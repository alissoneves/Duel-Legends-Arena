// ---------- TELAS: CONQUISTAS, PERFIL, MISSÕES E MENU ----------
function renderAch(){screenBg();const done=ACH.filter(a=>save.ach&&save.ach[a.k]).length;text('CONQUISTAS',W/2,20,12,'#ffd23f','center','#0b0c14');text(`${done}/${ACH.length} · toque em USAR para exibir o título no perfil e no online`,W/2,33,7,'#c9cbe6','center',null,PS);
 const per=8,pg=ACHP.page;ACH.slice(pg*per,pg*per+per).forEach((a,i)=>{const col=i%2,row=Math.floor(i/2),x=14+col*230,y=40+row*50,ok=save.ach&&save.ach[a.k],v=Math.min(a.v(),a.goal);
  panel(x,y,222,46);ctx.fillStyle=ok?'#ffd23f':'#2e3358';ctx.fillRect(x+6,y+8,22,22);text(ok?'★':'?',x+17,y+24,10,ok?'#0b0c14':'#6a6f98','center');
  text(a.n,x+34,y+13,8,ok?'#ffd23f':'#ffffff','left',null,PS);text(a.d,x+34,y+24,7,'#c9cbe6','left',null,PS);
  if(!ok){bar(x+34,y+30,120,5,v/a.goal,'#4fd1ff');text(`${v}/${a.goal}`,x+158,y+36,7,'#8a8fb8','left',null,PS);}
  else{const t=achTitle(a),on=save.title===t;text('Título: '+t,x+34,y+40,7,'#8ef0a0','left',null,PS);btn('ttl:'+a.k,x+170,y+28,46,13,on?'EM USO':'USAR',on?'#8ef0a0':'#2e3358',on?'#0b0c14':'#ffffff',5);}});
 const pages=Math.ceil(ACH.length/per);text(`${pg+1}/${pages}`,W/2,252,8,'#c9cbe6','center',null,PS);btn('achp',W/2-60,244,26,14,'<','#2e3358','#ffffff',7);btn('achn',W/2+34,244,26,14,'>','#2e3358','#ffffff',7);
 if(save.title)btn('ttl:none',W-90,244,82,14,'TIRAR TÍTULO','#2e3358','#ffffff',5);
 btn('profile',8,248,60,16,'VOLTAR','#2e3358','#ffffff',6);}
function renderProfile(){screenBg();text('PERFIL',W/2,22,12,'#ffd23f','center','#0b0c14');portrait(10,4,24,myFrame());buttons.push({id:'icons',x:8,y:2,w:28,h:28});text((save.nick||'sem nome'),42,18,10,'#ffffff','left','#0b0c14',PS);if(save.title)text(save.title,42,28,7,'#ffd23f','left',null,PS);btn('ach',W-190,10,88,16,'CONQUISTAS','#ffd23f','#0b0c14',6);btn(save.nick&&!NET.canRename?'icons':'netnick',W-96,10,88,16,save.nick&&!NET.canRename?'MEU ÍCONE':'ESCOLHER NOME','#2e3358','#ffffff',6);
 // estatísticas
 panel(10,32,142,104);text('ESTATÍSTICAS',81,44,7,'#ffd23f','center');const g=save.games||0,w=save.wins||0;
 [['Partidas',g],['Vitórias',w],['Derrotas',g-w],['Taxa de vitória',g?Math.round(w/g*100)+'%':'—'],['Coleção',Object.keys(save.seen).length+'/'+CHARS.length],['Patentes',Object.values(save.mastery).filter(v=>v>=100).length]].forEach((r,i)=>{text(r[0],16,60+i*12,9,'#c9cbe6','left',null,PS);text(String(r[1]),146,60+i*12,9,'#ffffff','right',null,PS);});
 // ranqueada
 panel(10,144,142,88);const R=save.rank;text(`RANQUEADA · T${R.season}`,81,155,7,'#ff8a3d','center');emblem(34,180,16,R);
 text(R.tier<0?'Sem elo':rankName(R),52,172,9,rankCol(R),'left',null,PS);text(R.tier<0?`Colocação ${R.placed}/5`:`${R.lp} PDL`,52,183,8,'#ffffff','left',null,PS);
 if(R.tier>=0&&R.tier<7)bar(52,187,90,4,R.lp/100,rankCol(R));
 const rg=R.w+R.l;text(`${R.w}V ${R.l}D${rg?' · '+Math.round(R.w/rg*100)+'%':''}`,16,207,8,'#c9cbe6','left',null,PS);
 btn('borders',104,198,44,14,'BORDAS','#ffd23f','#0b0c14',5);
 text(R.shield>0&&R.tier>0?`Proteção: ${R.shield} partida(s)`:R.peakName?`Pico: ${R.peakName}`:'Jogue 5 partidas de colocação',16,219,8,R.shield>0&&R.tier>0?'#bfeaff':'#c9cbe6','left',null,PS);
 // maestria
 panel(162,32,118,200);text('MAIS DOMINADAS',221,44,7,'#ffd23f','center');const top=Object.entries(save.mastery).sort((a,b)=>b[1]-a[1]).slice(0,5);
 if(!top.length)text('Jogue para ganhar maestria',221,120,8,'#6a6f98','center',null,PS);
 top.forEach(([id,m],i)=>{const c=CHARS.find(x=>x.id===id);if(!c)return;const y=52+i*36,gi=gemOf(m);ctx.fillStyle='#23264a';ctx.fillRect(168,y,28,30);ctx.save();ctx.beginPath();ctx.rect(168,y,28,30);ctx.clip();drawSprite(id,182,y+28,1,1);ctx.restore();
  text(shortN(c,13),200,y+10,8,'#ffffff','left',null,PS);text(GEMS[gi],200,y+20,8,GEMCOL[gi],'left',null,PS);text(`${m} pts`,200,y+29,8,'#c9cbe6','left',null,PS);});
 // histórico
 panel(290,32,180,200);text('HISTÓRICO',380,44,7,'#ffd23f','center');const hs=save.hist||[];if(!hs.length)text('Nenhuma partida ainda',380,120,8,'#6a6f98','center',null,PS);
 hs.slice(0,9).forEach((h,i)=>{const y=52+i*20,c=CHARS.find(x=>x.id===h.c);ctx.fillStyle=h.w?'#1c3a26':'#3a1c22';ctx.fillRect(294,y,172,18);ctx.fillStyle=h.w?'#46d160':'#ff4d5e';ctx.fillRect(294,y,3,18);
  text(`${h.w?'V':'D'} · ${(c?c.name:h.c).slice(0,14)}`,300,y+8,8,'#ffffff','left',null,PS);let o='vs '+h.o;if(o.length>26)o=o.slice(0,25)+'…';text(o,300,y+16,7,'#c9cbe6','left',null,PS);
  text(h.m.replace('Torneio · ','T. ').slice(0,18),462,y+8,7,'#ffe2d0','right',null,PS);text(h.r!=null?(h.r>0?'+':'')+h.r+' pts':'+'+h.g+' maest.',462,y+16,7,h.r!=null?(h.r>0?'#8ef0a0':'#ff9a9a'):'#8ef0a0','right',null,PS);});
 btn('menu',W/2-48,244,96,20,'VOLTAR','#2e3358','#ffffff',7);}
function renderMissions(){screenBg();text('MISSÕES DIÁRIAS',W/2,20,12,'#8ef0a0','center','#0b0c14');
 const t=nowT(),left=(dayIdx(t)+1)*DAY+BRT-t;text(`Novas missões em ${Math.floor(left/3600000)}h ${Math.floor(left%3600000/60000)}min`,W/2,33,8,'#c9cbe6','center',null,PS);
 const M=missToday();M.list.forEach((m,i)=>{const y=42+i*42,done=m.p>=m.n;panel(30,y,420,36);
  text(missText(m),42,y+14,9,done?'#8ef0a0':'#ffffff','left',null,PS);bar(42,y+21,220,6,m.p/m.n,done?'#8ef0a0':'#ffd23f');text(`${m.p}/${m.n}`,270,y+28,8,'#c9cbe6','left',null,PS);
  text(`+${m.gd} GD · +${m.po} Pó`,330,y+14,8,'#ffd23f','center',null,PS);
  if(m.cl)text('RESGATADO ✓',400,y+24,7,'#8ef0a0','center');else if(done)btn('mclaim:'+i,356,y+18,86,14,'RESGATAR','#8ef0a0','#0b0c14',6);else text('em andamento',400,y+28,7,'#8a8fb8','center',null,PS);});
 // semana
 const Wk=weekState(),y0=172;panel(30,y0,420,70);text('FIM DE SEMANA',42,y0+13,7,'#4fd1ff','left');
 text('Complete as 3 missões em 5 dias da semana e gire a roleta no sábado ou domingo.',42,y0+25,7,'#c9cbe6','left',null,PS);
 const D=['S','T','Q','Q','S','S','D'],d0=dayIdx()-weekDay();for(let i=0;i<7;i++){const ok=Wk.days.includes(d0+i),today=i===weekDay();ctx.fillStyle=ok?'#8ef0a0':today?'#2e3358':'#141626';ctx.fillRect(44+i*22,y0+32,18,18);ctx.strokeStyle=today?'#ffd23f':'#0b0c14';ctx.lineWidth=1.5;ctx.strokeRect(44+i*22,y0+32,18,18);text(D[i],53+i*22,y0+45,7,ok?'#0b0c14':'#c9cbe6','center');}
 text(`${Math.min(5,Wk.days.length)}/5 dias`,214,y0+45,8,Wk.days.length>=5?'#8ef0a0':'#ffffff','left',null,PS);
 const H=wkHeroActive();
 if(MS.spinT){const el=(performance.now()-MS.spinT)/1000;const L=el<2.2?CHARS[Math.floor(el*(16-el*5))%CHARS.length]:CHARS.find(c=>c.id===MS.spinId);drawSprite(L.id,370,y0+56,2,1);if(el>=2.2){text(L.name,370,y0+66,8,'#ffd23f','center','#0b0c14',PS);if(!MS.done){MS.done=true;sfx('win');}}}
 else if(H){drawSprite(H.id,350,y0+54,2,1);text(H.name,350,y0+65,8,'#4fd1ff','center','#0b0c14',PS);btn('usefix',392,y0+34,52,16,save.useFixed===false?'USAR':'SORTEAR',save.useFixed===false?'#4fd1ff':'#2e3358',save.useFixed===false?'#0b0c14':'#ffffff',5);text(save.useFixed===false?'sorteio normal':'nos modos contra bots',418,y0+60,6,'#8a8fb8','center',null,PS);}
 else if(canSpin())btn('wkspin',330,y0+34,110,22,'GIRAR ROLETA!','#ffd23f','#0b0c14',7);
 else text(weekDay()>=5?(Wk.spun?'Roleta já usada':'Faltam dias de missão'):'Roleta no sábado',380,y0+46,7,'#8a8fb8','center',null,PS);
 if(MS.msg)text(MS.msg,W/2,252,8,'#8ef0a0','center',null,PS);
 btn('menu',8,248,70,16,'VOLTAR','#2e3358','#ffffff',6);}
function weekCard(x,y){const L=weekLegend(),w=106,h=100;ctx.fillStyle='rgba(20,22,38,0.92)';ctx.fillRect(x,y,w,h);ctx.strokeStyle='#ffd23f';ctx.lineWidth=2;ctx.strokeRect(x+1,y+1,w-2,h-2);
 text('LENDA DA SEMANA',x+w/2,y+11,tr('LENDA DA SEMANA').length*6>w-8?5:6,'#ffd23f','center');ctx.fillStyle='rgba(255,210,63,0.17)';ctx.beginPath();ctx.arc(x+w/2,y+46,22,0,7);ctx.fill();
 drawSprite(L.id,x+w/2,y+66,2,1);text(L.name,x+w/2,y+78,8,'#ffffff','center','#0b0c14',PS);text(`+${Math.round(WEEK_BONUS*100)}% GD · 3x no sorteio`,x+w/2,y+88,7,'#8ef0a0','center',null,PS);text('termina em '+weekLeft(),x+w/2,y+97,6,'#8a8fb8','center',null,PS);
 buttons.push({id:'weekinfo',x,y,w,h});}
function renderTitle(){if(!titleArena){titleArena=ARENAS[0];titleArena.bg=titleArena.bg||buildArena(titleArena);}
 ctx.drawImage(titleArena.bg,0,0);ctx.fillStyle='rgba(11,12,20,0.55)';ctx.fillRect(0,0,W,H);
 // status: moedas na cor delas, o resto apagado
 {ctx.font=`9px ${PS}`;let x=8;for(const [t,c] of [[`GD ${save.gd}`,'#ffd23f'],[`Pó ${save.po}`,'#c77dff'],[`Gemas ${save.gems||0}`,'#4fd1ff']]){text(t,x,12,9,c,'left','#0b0c14',PS);x+=Math.round(ctx.measureText(tr(t)).width)+10;}}
 const tot=Object.keys(save.seen).length;text(`Coleção ${tot}/${CHARS.length} · Vitórias ${save.wins}`,8,24,8,'#8a8fb8','left','#0b0c14',PS);text(`Ranqueada: ${rankLabel(save.rank)}`,8,35,8,'#8a8fb8','left','#0b0c14',PS);
 if(save.boxes>0)btn('box',8,72,84,16,save.boxes>1?`ABRIR CAIXA x${save.boxes}`:'ABRIR CAIXA','#8ef0a0','#0b0c14',6);
 if(fixedHero())text('Lenda fixa: '+fixedHero().name,8,save.boxes>0?100:80,8,'#c9cbe6','left','#0b0c14',PS);
 btn('sound',W-62,4,58,14,soundOn?'SOM ON':'SOM OFF','#2e3358','#ffffff',6);
 const nk=save.nick?save.nick:'CRIAR NOME';ctx.font=`6px ${PX}`;const nw=Math.max(70,ctx.measureText(nk).width+14);btn(save.nick&&!NET.canRename?'profile':'netnick',W-66-nw,4,nw,14,nk,save.nick?'#2e3358':'#ffd23f',save.nick?'#ffffff':'#0b0c14',6);portrait(W-66-nw-24,2,18,null);buttons.push({id:'icons',x:W-66-nw-24,y:2,w:18,h:18});
 logo(W/2,30,1.6);
 weekCard(366,42);
 // o duelo: o momento da tela
 const b=Math.sin(time*4)*2;drawSprite('zeus',124,150,1,1,false,0.5);drawSprite('yeti',356,150,1,-1,false,0.5);
 drawSprite('saci',176,148+b,2,1);drawSprite('iara',304,148-b,2,-1);text('VS',W/2,140,10,'#ff8a3d','center','#0b0c14');
 // ação principal, com o dado do sorteio
 {const x=150,y=154,w=180,h=30;btn('jogar',x,y,w,h,'',  '#ffd23f','#0b0c14',12);ctx.font=`12px ${PX}`;const tw=Math.round(ctx.measureText(tr('JOGAR')).width),dx=Math.round(x+w/2-(tw+18)/2),dy=y+9;
  ctx.fillStyle='#0b0c14';ctx.fillRect(dx-1,dy-1,12,12);ctx.fillStyle='#ffffff';ctx.fillRect(dx,dy,10,10);ctx.fillStyle='#e0393e';ctx.fillRect(dx+1,dy+1,3,3);ctx.fillStyle='#0b0c14';ctx.fillRect(dx+6,dy+1,3,3);ctx.fillRect(dx+4,dy+4,2,2);ctx.fillRect(dx+1,dy+6,3,3);ctx.fillRect(dx+6,dy+6,3,3);
  text('JOGAR',dx+18,y+h/2+5,12,'#0b0c14','left',null,PX);}
 // progresso
 {const n=missClaimable(),M=missToday(),dn=M.list.filter(m=>m.p>=m.n).length,can=streakInfo().can,y=190,w=102;
  btn('missions',27,y,w,22,`MISSÕES ${dn}/3`,n?'#8ef0a0':'#2e3358',n?'#0b0c14':'#ffffff',7);
  if(n){const p=0.6+0.4*Math.sin(time*6);ctx.fillStyle=`rgba(255,106,106,${p})`;ctx.beginPath();ctx.arc(27+w-3,y+3,6,0,7);ctx.fill();text(String(n),27+w-3,y+6,7,'#ffffff','center');}
  btn('streak',27+(w+6),y,w,22,'DIÁRIO',can?'#8ef0a0':'#2e3358',can?'#0b0c14':'#ffffff',7);
  btn('album',27+(w+6)*2,y,w,22,'COLEÇÃO','#2e3358','#ffffff',7);btn('profile',27+(w+6)*3,y,w,22,'PERFIL','#2e3358','#ffffff',7);}
 // loja e sistema
 {const y=218;btn('shop',27,y,72,22,'LOJA','#2e3358','#ffffff',7);btn('pass',105,y,72,22,'PASSE','#2e3358','#ffffff',7);btn('bag',183,y,80,22,'MOCHILA','#2e3358','#ffffff',7);
  btn('howto',279,y,96,22,'COMO JOGAR','#2e3358','#ffffff',7);btn('options',381,y,72,22,'OPÇÕES','#2e3358','#ffffff',7);}
 text('v2.4 · teste',W-6,264,8,'#6a6f98','right','#0b0c14',PS);
 drawGoal(248);
 if(!modal&&save.tutDone&&streakInfo().can&&SK.shown!==dayIdx()){SK.shown=dayIdx();SK.spinT=0;SK.msg='';state='streak';}
 if(!save.user&&!save.accAsked&&!modal){save.accAsked=true;save.nickAsked=true;persist();modal={title:save.nick?'NOVIDADE: CONTAS!':'BEM-VINDO À ARENA!',lines:['Com uma conta, seu elo e seu ranking ficam salvos','e você joga com eles em qualquer aparelho.','A conta é obrigatória só na Ranqueada.'],btns:[['mod:accreg','CRIAR CONTA','#ffd23f'],['mod:acclog','ENTRAR','#4fd1ff'],[save.nick?'mod:x':'mod:nick','SEM CONTA','#c9cbe6']]};}
 renderModal();}