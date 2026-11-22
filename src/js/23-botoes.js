// ---------- BOTÕES (o que cada toque faz) ----------
function onButton(id){sfx('beep');
 if(id==='again')id=lastMode==='ranked'?'rankgo':lastMode==='online'?'toroom':'m:'+lastMode;
 if(id==='play')id='m:1x1';if(id==='duo')id='m:2x2';
 if(id.startsWith('m:')){newPick(id.slice(2),false);return;}
 if(id==='ranked'){if(!save.user){modal={title:'RANQUEADA',lines:['Para jogar a ranqueada, crie uma conta.','Assim seu elo fica salvo e ninguém consegue trapacear.'],btns:[['mod:accreg','CRIAR CONTA','#ffd23f'],['mod:acclog','ENTRAR','#4fd1ff'],['mod:x','AGORA NÃO','#c9cbe6']]};return;}state='rankLobby';if(NET.status!=='on')netConnect();return;}
 if(id==='rankgo'){if(!save.user){onButton('ranked');return;}if(NET.status!=='on'){netConnect();NET.err='Conectando ao servidor… toque de novo em instantes.';NET.errT=performance.now();return;}NET.on=false;NET.role=null;NET.rankQ=true;netSend({t:'rankqueue',mmr:save.rank.mmr});return;}
 if(id==='accback'){ACC.pending=null;ACC.busy=false;state=ACC.back||'online';ACC.back=null;return;}
 if(id==='icons'){state='icons';return;}
 if(id.startsWith('ico:')){const ic=id.slice(4);if(iconOwned(ic)){save.icon=ic;persist();if(NET.status==='on')netSend(helloMsg(save.nick||'Jogador'));}return;}
 if(id==='ach'){state='ach';ACHP.page=0;achCheck();return;}
 if(id==='achp'){ACHP.page=Math.max(0,ACHP.page-1);return;}
 if(id==='achn'){ACHP.page=Math.min(Math.ceil(ACH.length/8)-1,ACHP.page+1);return;}
 if(id.startsWith('ttl:')){const k=id.slice(4);if(k==='none')save.title='';else{const a=ACH.find(x=>x.k===k);if(a&&save.ach&&save.ach[k])save.title=achTitle(a);}persist();if(NET.status==='on')netSend(helloMsg(save.nick||'Jogador'));return;}
 if(id==='borders'){state='borders';return;}
 if(id.startsWith('frm:')){save.frame=id.slice(4);persist();return;}
 if(id.startsWith('rep:')){REPT=+id.slice(4);const q=NET.room&&NET.room.slots.find(x=>x&&x.pid===REPT);modal={title:'DENUNCIAR '+(q?q.name:'JOGADOR'),lines:['Qual é o problema?','Denúncias falsas podem bloquear a sua conta.'],btns:[['mod:rep:nome','NOME','#ff9a9a'],['mod:rep:trapaca','TRAPAÇA','#ff9a9a'],['mod:rep:comport','ATITUDE','#ff9a9a'],['mod:x','CANCELAR','#c9cbe6']]};return;}
 if(id==='repopp'){const o=(NET.start&&NET.start.slots||[]).filter(x=>x&&!x.bot&&x.pid!==NET.id);if(o.length===1)onButton('rep:'+o[0].pid);return;}
 if(id==='replay'){recExport();return;}
 if(id==='tutskip'){if(G&&G.tut){G.tut.step=TUT.length-1;TUT[TUT.length-1].go();}return;}
 if(id==='tutstart'){startTutorial();return;}
 if(id==='invite'){inviteFriend();return;}
 if(id==='joincode'){askText('ENTRAR COM CÓDIGO','Digite o código da sala que seu amigo mandou.','',v=>{if(v)netSend({t:'joincode',code:v});},{max:8,ph:'ex.: K7Q2X'});return;}
 if(id==='missions'){state='missions';MS.msg='';MS.spinT=0;return;}
 if(id.startsWith('mclaim:')){const m=missToday().list[+id.slice(7)];if(m&&m.p>=m.n&&!m.cl){m.cl=true;save.gd+=m.gd;save.po+=m.po;stx().miss++;achToast(achCheck());MS.msg=`+${m.gd} GD e +${m.po} Pó Mágico!`;persist();sfx('go');}return;}
 if(id==='wkspin'){if(!canSpin())return;const L=CHARS[Math.floor(Math.random()*CHARS.length)];save.wkHero={w:weekIdx(),id:L.id};weekState().spun=true;save.useFixed=true;MS.spinT=performance.now();MS.spinId=L.id;MS.done=false;MS.msg=`${L.name} é sua lenda fixa até domingo 23h59!`;persist();return;}
 if(id==='usefix'){save.useFixed=save.useFixed===false;persist();return;}
 if(id==='streak'){state='streak';SK.spinT=0;SK.msg='';return;}if(id==='skclaim'){streakClaim();return;}
 if(id.startsWith('goal:')){const a=id.slice(5);if(a==='streak'){state='streak';SK.spinT=0;SK.msg='';}else if(a==='missions'){state='missions';MS.msg='';MS.spinT=0;}else if(a==='online')onButton('online');else state='modes';return;}
 if(id==='chalok'){if(NET.chal)challenge(NET.chal.from);NET.chal=null;return;}if(id==='chalno'){NET.chal=null;return;}
 if(id==='rematch'){const o=oppHuman();if(o){challenge(o);}return;}
 if(id.startsWith('rival:')){const r=(save.rivals||[])[+id.slice(6)];if(r)challenge(r.n);return;}
 if(id==='weekinfo'){const L=weekLegend();modal={title:'LENDA DA SEMANA: '+L.name.toUpperCase(),lines:[`Sai 3x mais no sorteio contra bots e na partida rápida.`,`Vencendo com ${L.name}: +${Math.round(WEEK_BONUS*100)}% de Duel Gold.`,'Troca toda segunda-feira. Termina em '+weekLeft()+'.'],btns:[['mod:x','OK','#ffd23f']]};return;}
 if(id==='account'){ACC.back='online';state='account';ACC.msg='';ACC.err='';if(NET.status!=='on')netConnect();return;}
 if(id==='accreg'){accRegister();return;}
 if(id==='acclog'){accLogin();return;}
 if(id==='accpass'){accPass();return;}if(id==='accdel'){accDelete();return;}if(id==='privacy'){try{window.open(GAME_URL+'privacidade.html','_blank');}catch(e){}return;}
 if(id==='accout'){accLogout();return;}
 if(id==='leader'){state='leader';LB.page=0;LB.loading=true;LB.err='';if(NET.status!=='on'){netConnect();LB.loading=false;LB.err='Conectando ao servidor… toque em ATUALIZAR.';}else netSend({t:'top'});return;}
 if(id==='ldr'){if(NET.status==='on'){LB.loading=true;netSend({t:'top'});}else netConnect();return;}
 if(id==='ldp'){LB.page=Math.max(0,LB.page-1);return;}
 if(id==='ldn'){LB.page=Math.min(Math.max(0,Math.ceil(LB.list.length/10)-1),LB.page+1);return;}
 if(id==='ldback'){state='rankLobby';return;}
 if(id==='rankback'){NET.on=false;NET.role=null;state='rankLobby';return;}
 if(id==='menu'&&state==='shop'&&prepInfo&&bagBack==='prep'){state='bag';return;}
 if(id==='menu'&&state==='bag'&&bagBack==='prep'&&prepInfo){const el=(performance.now()-prepInfo.t0)/1000;prepInfo.t0=performance.now()-Math.min(el,15)*1000;state='prep';return;}
 if(id==='modes'){if(!save.tutAsked&&!(save.games>0)){save.tutAsked=true;persist();modal={title:'PRIMEIRA VEZ NA ARENA?',lines:['Faça o tutorial rápido (1 minuto) e aprenda','a andar, atacar, esquivar, bloquear e usar o especial.','Vencendo, você ganha 100 GD!'],btns:[['mod:tut','FAZER TUTORIAL','#ffd23f'],['mod:skiptut','PULAR','#c9cbe6']]};return;}if(!save.howto){save.howto=true;persist();howPage=0;howNext='modes';state='howto';return;}state='modes';return;}
 if(id==='howto'){howPage=0;howNext='title';state='howto';return;}
 if(id==='hprev'){howPage=Math.max(0,howPage-1);return;}if(id==='hnext'){if(howPage<2)howPage++;else state=howNext;return;}if(id==='hclose'){state=howNext;return;}
 if(id==='options'){state='options';return;}
 if(id==='shop'){prevState=state==='prep'?prevState:state;state='shop';return;}
 if(id==='bag'){if(state!=='bag'&&state!=='shop')bagBack=state;state='bag';return;}
 if(id.startsWith('buy:')){const o=save.shop.items[+id.slice(4)],pr=RARI[o.r].price;if(o.sold)return;if(save.gd<pr){shopMsg=msgSet('GD insuficiente','#ff9a9a');sfx('beep');return;}save.gd-=pr;o.sold=true;const it=newItem(o.b,o.r);save.inv.push(it);bagSel=it.id;persist();shopMsg=msgSet('Comprado: '+itemName(it),'#8ef0a0');sfx('reveal');return;}
 if(id.startsWith('buypo:')){const n=+id.slice(6),pr=n===5?650:150;if(save.gd<pr){shopMsg=msgSet('GD insuficiente','#ff9a9a');sfx('beep');return;}save.gd-=pr;save.po+=n;persist();shopMsg=msgSet(`+${n} Pó Mágico`,'#c77dff');sfx('reveal');return;}
 if(modal&&!id.startsWith('mod:'))return;
 if(id.startsWith('mod:')){const a=id.slice(4);if(a==='nick'){modal=null;askNick(!save.nick);return;}if(a.startsWith('rep:')){const why=a.slice(4);if(REPT!=null)netSend({t:'report',pid:REPT,reason:why});REPT=null;modal=null;return;}if(a==='tut'){modal=null;startTutorial();return;}if(a==='skiptut'){modal=null;save.howto=true;persist();state='modes';return;}if(a==='accreg'||a==='acclog'){modal=null;ACC.back=state==='title'?'title':state==='rankLobby'?'rankLobby':'online';state='account';ACC.msg='';ACC.err='';if(NET.status!=='on')netConnect();a==='accreg'?accRegister():accLogin();return;}if(a==='ok'&&modal.onOk)modal.onOk();if(a==='gems'){shopTab='gemas';}if(a==='gemsgo'){state='shop';shopTab='gemas';}modal=null;return;}
 if(id.startsWith('stab:')){shopTab=id.slice(5);return;}
 if(id.startsWith('cs:')){catSlot=id.slice(3);catPage=0;return;}if(id.startsWith('cr:')){catRar=+id.slice(3);catPage=0;return;}
 if(id.startsWith('cpg:')){catPage=Math.max(0,catPage+(+id.slice(4)));return;}
 if(id.startsWith('csel:')){const[,b,r]=id.split(':');catSel={b,r:+r,up:0};return;}
 if(id==='cbuy'){if(catSel)buyItem(catSel.b,catSel.r,RARI[catSel.r].price);return;}
 if(id.startsWith('promo:')){const o=weeklyPromos()[+id.slice(6)];save.promos=save.promos||{};if(save.promos[o.k])return;if(buyItem(o.b,o.r,o.price)){save.promos[o.k]=1;persist();}return;}
 if(id.startsWith('cc:')){cosCat=id.slice(3);return;}
 if(id.startsWith('ceq:')){const c=cosFind(id.slice(4));if(save.cos.eq[c.k]===c.id)delete save.cos.eq[c.k];else save.cos.eq[c.k]=c.id;persist();sfx('beep');return;}
 if(id.startsWith('cbuyc:')){const c=cosFind(id.slice(6));if((save.gems||0)<c.price){modal={title:'GEMAS INSUFICIENTES',lines:[`Faltam ${c.price-(save.gems||0)} gemas para ${c.n}.`],btns:[['mod:gems','VER GEMAS','#4fd1ff'],['mod:x','FECHAR','#c9cbe6']],onOk:null};return;}
  modal={title:'CONFIRMAR COMPRA',lines:[`${c.n} por ${c.price} gemas?`,'Visual, sem vantagem em luta.'],btns:[['mod:ok','COMPRAR','#4fd1ff'],['mod:x','CANCELAR','#c9cbe6']],onOk:()=>{save.gems-=c.price;save.cos.owned.push(c.id);save.cos.eq[c.k]=c.id;persist();shopMsg=msgSet('Novo visual: '+c.n,'#4fd1ff');sfx('win');}};return;}
 if(id.startsWith('gem:')){const pk=GEM_PACKS[+id.slice(4)];modal={title:'PAGAMENTO DE DEMONSTRAÇÃO',lines:[`${pk.g+pk.b} gemas por ${pk.brl}`,'No jogo real, abre a Steam ou a Google Play.','Receber as gemas de graça para testar?'],btns:[['mod:ok','RECEBER (TESTE)','#46d160'],['mod:x','CANCELAR','#c9cbe6']],onOk:()=>{save.gems=(save.gems||0)+pk.g+pk.b;persist();shopMsg=msgSet(`+${pk.g+pk.b} gemas (teste)`,'#4fd1ff');sfx('win');}};return;}
 if(id==='emote'){if(G&&G.p&&!G.p.dead)doEmote(G.p);return;}
 if(id==='pass'){state='pass';return;}
 if(id.startsWith('ppg:')){passPage=clamp(passPage+(+id.slice(4)),0,Math.ceil(PASS_LV/8)-1);return;}
 if(id==='passbuy'){if((save.gems||0)<PASS_PRICE){modal={title:'GEMAS INSUFICIENTES',lines:[`O Passe Premium custa ${PASS_PRICE} gemas.`,`Você tem ${save.gems||0}.`],btns:[['mod:gemsgo','VER GEMAS','#4fd1ff'],['mod:x','FECHAR','#c9cbe6']],onOk:null};return;}
  modal={title:'ATIVAR PASSE PREMIUM',lines:[`${PASS_PRICE} gemas`,'15 visuais exclusivos e 660 gemas de volta.'],btns:[['mod:ok','ATIVAR','#ffb02e'],['mod:x','CANCELAR','#c9cbe6']],onOk:()=>{save.gems-=PASS_PRICE;save.pass.premium=true;persist();shopMsg=msgSet('Passe Premium ativado!','#ffb02e');sfx('win');}};return;}
 if(id.startsWith('pc:')){const[,pm,l]=id.split(':');const prem=pm==='1',L=+l,P=save.pass,list=prem?P.cp:P.cf;if(list.includes(L)||L>passLevel()||(prem&&!P.premium))return;const r=passReward(L,prem);list.push(L);
  if(r.k==='gd')save.gd+=r.n;else if(r.k==='po')save.po+=r.n;else if(r.k==='gems')save.gems=(save.gems||0)+r.n;else if(r.k==='cos'&&!save.cos.owned.includes(r.id))save.cos.owned.push(r.id);else if(r.k==='icon')giveIcon(r.id);persist();shopMsg=msgSet('Recebido: '+r.txt,'#8ef0a0');sfx('reveal');return;}
 if(id==='online'){state='online';const go=()=>{if(NET.status!=='on')netConnect();else netSend({t:'list'});};if(!save.nick)askNick(true,go);else go();return;}
 if(id==='netconn'){netConnect();return;}
 if(id==='netsrv'){askText('SERVIDOR','Endereço do servidor (começa com wss://)',serverUrl(),u=>{if(u){save.opt.server=u;persist();if(NET.ws)NET.ws.close();setTimeout(netConnect,200);}},{max:120,check:v=>/^wss?:\/\//.test(v)?null:'O endereço precisa começar com wss://'});return;}
 if(id==='netnick'){if(save.nick&&!NET.canRename)return;askNick(false);return;}
 if(id==='quickmatch'){NET.rankQ=false;netSend({t:'quickmatch'});return;}if(id==='unqueue'){NET.qT=0;netSend({t:'unqueue'});state=NET.rankQ?'rankLobby':'online';return;}
 if(id==='lobby'){state='lobby';netSend({t:'list'});return;}if(id==='netlist'){netSend({t:'list'});return;}
 if(id.startsWith('cmode:')){createMode=id.slice(6);return;}
 if(id==='createroom'||id==='createlock'){const lock=id==='createlock';askText('NOVA SALA','Nome da sala',`Sala de ${save.nick||'Jogador'}`,nm=>{if(!nm)return;if(!lock){netSend({t:'create',name:nm,mode:createMode,pass:''});return;}askText('SENHA','Senha para entrar na sala','',pass=>{if(pass)netSend({t:'create',name:nm,mode:createMode,pass});},{max:16,check:v=>v?null:'Digite uma senha'});},{max:24,check:v=>v?null:'Digite um nome'});return;}
 if(id.startsWith('join:')){const rid=id.slice(5),r=(NET.rooms||[]).find(q=>q.id===rid);if(r&&r.locked){askText('SALA COM SENHA',r.name,'',pass=>{if(pass)netSend({t:'join',id:rid,pass});},{max:16});return;}netSend({t:'join',id:rid,pass:''});return;}
 if(id.startsWith('slot:')){netSend({t:'slot',slot:+id.slice(5)});return;}
 if(id.startsWith('qc:')){netSend({t:'quick',i:+id.slice(3)});return;}
 if(id==='netready'){const me=NET.room&&NET.room.slots.find(q=>q&&q.pid===NET.id);netSend({t:'ready',v:!(me&&me.ready)});return;}
 if(id==='netstart'){netSend({t:'start'});return;}
 if(id==='netleave'){netSend({t:'leave'});NET.room=null;state='lobby';return;}
 if(id==='toroom'){NET.on=false;NET.role=null;state=NET.room?'room':'online';return;}
 if(id==='box'){state='box';return;}if(id==='boxopen'){boxOpen();return;}if(id==='boxok'){if(boxAnim&&boxAnim.done){bagSel=boxAnim.win.id;boxAnim=null;}return;}
 if(id==='reroll'){if(save.gd<40){shopMsg=msgSet('GD insuficiente','#ff9a9a');return;}save.gd-=40;shopRoll();persist();sfx('beep');return;}
 if(id.startsWith('bf:')){bagFilter=id.slice(3);bagPage=0;return;}
 if(id.startsWith('bpg:')){bagPage=Math.max(0,bagPage+(+id.slice(4)));return;}
 if(id.startsWith('bsel:')){bagSel=+id.slice(5);return;}
 if(id==='beq'){const it=invById(bagSel);if(!it)return;const sl=BASES[it.b].slot;if(save.equip[sl]===it.id)delete save.equip[sl];else save.equip[sl]=it.id;persist();sfx('beep');return;}
 if(id==='bsell'){const it=invById(bagSel);if(!it)return;const n=dismPo(it),eq=Object.values(save.equip).includes(it.id);modal={title:'DESMANCHAR ITEM?',lines:[itemName(it)+(it.up?` +${it.up}`:''),`Vira ${n} Pó Mágico. Não dá para desfazer.`,...(eq?['Ele está equipado e sai do herói.']:[])],btns:[['mod:ok','DESMANCHAR','#c77dff'],['mod:x','CANCELAR','#2e3358']],onOk:()=>{if(!save.inv.includes(it))return;save.po+=n;for(const k in save.equip)if(save.equip[k]===it.id)delete save.equip[k];save.inv=save.inv.filter(x=>x!==it);bagSel=null;persist();bagMsg=msgSet(`+${n} Pó Mágico`,'#c77dff');sfx('reveal');}};return;}
 if(id==='bup'){const it=invById(bagSel);if(!it||it.up>=10)return;const po=UPG.po[it.up],gd=40*(it.up+1);if(save.po<po||save.gd<gd){bagMsg=msgSet('Falta pó ou GD','#ff9a9a');sfx('beep');return;}
  save.po-=po;save.gd-=gd;if(Math.random()<UPG.chance[it.up]){it.up++;bagMsg=msgSet(`SUCESSO! Agora é +${it.up}`,'#8ef0a0');sfx('win');}else{const r=Math.random(),dn=r<0.6?1:r<0.9?2:3;it.up=Math.max(0,it.up-dn);bagMsg=msgSet(`Falhou… voltou para +${it.up}`,'#ff9a9a');sfx('ko');}persist();return;}
 if(id.startsWith('rpick:')){if(pick&&pick.choosing&&NET.rmy==null){NET.rmy=+id.slice(6);pick.me=pick.opts[NET.rmy];netSend({t:'rpick',i:NET.rmy});sfx('go');}return;}
 if(id.startsWith('pslot:')){const sl=id.slice(6);prepSlot=prepSlot===sl?null:sl;return;}
 if(id.startsWith('punq:')){delete save.equip[id.slice(5)];persist();sfx('beep');return;}
 if(id.startsWith('pitem:')){const iid=+id.slice(6);if(iid)save.equip[prepSlot]=iid;else delete save.equip[prepSlot];persist();prepSlot=null;sfx('beep');return;}
 if(id==='ready'&&prepInfo&&prepInfo.net){netPrepReady();return;}
 if(id==='ready'){if(prepInfo&&!prepInfo.ready){prepInfo.ready=true;prepInfo.readyAt=(performance.now()-prepInfo.t0)/1000;sfx('go');}return;}
 if(id.startsWith('opt:')){const[,k,v]=id.split(':');const o=save.opt;if(k==='sfx'||k==='music')o[k]=Math.round(clamp(o[k]+(+v)*0.1,0,1)*10)/10;if(k==='diff')o.diff=clamp(o.diff+(+v),0,2);if(k==='tips')o.tips=!o.tips;if(k==='vib'){o.vib=o.vib===false;if(o.vib)buzz(30);}persist();applyVolumes();if(k==='sfx')sfx('beep');return;}
 if(id==='full'){try{const el=document.documentElement;if(document.fullscreenElement)document.exitFullscreen();else (el.requestFullscreen||el.webkitRequestFullscreen).call(el);}catch(e){}return;}
 if(id==='profile'){state='profile';return;}
 else if(id==='fight'&&pick&&pick.online){enterNetPrep();}
 else if(id==='fight'){enterPrep(()=>{startMatch();if(!pick.ranked)G.diff*=DIFFM[save.opt.diff]*((save.games||0)<3?0.8:1);if(pick.ranked)G.diff=clamp(0.75+((save.rank.oppMmr||1150)-800)/2200,0.75,1.4);});}
 else if(id==='fight_old'){startMatch();if(!pick.ranked)G.diff*=DIFFM[save.opt.diff];if(pick.ranked)G.diff=clamp(0.75+((save.rank.oppMmr||1150)-800)/2200,0.75,1.4);}
 else if(id==='tour'){startTournament();}
 else if(id==='tfight'){pick={me:T.me,foe:tPair().foe,arena:ARENAS[0]};pick.arena.bg=pick.arena.bg||buildArena(pick.arena);enterPrep(()=>tStartMatch());}
 else if(id==='tcont'){if(G&&G.res&&G.tour){tAdvance(G.res.win);G.tour=false;state='bracket';}}
 else if(id==='album'){state='album';}
 else if(id.startsWith('alb:')){albSel=+id.slice(4);}
 else if(id==='menu'){state='title';}
 else if(id==='sound'){soundOn=!soundOn;applyVolumes();}
 else if(id==='pause'){paused=!paused;}
 else if(id==='quit'&&G&&G.net){paused=false;netSend({t:'leave'});NET.on=false;NET.role=null;NET.room=null;state='online';}
 else if(id==='quit'){paused=false;state='title';}
}