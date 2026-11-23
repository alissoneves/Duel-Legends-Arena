// ---------- CONTAS (cadastro, login, exclusão) ----------
let LB={list:[],total:0,me:null,page:0,loading:false,err:''};
let ACC={msg:'',err:'',busy:false};
const USER_OK=v=>!/^[a-z0-9_.]{3,16}$/.test(v.toLowerCase())?'Use 3 a 16 letras, números, _ ou ponto (sem espaço).':badName(v)?'Esse usuário não é permitido.':null;
const PASS_OK=v=>v.length>=6&&v.length<=64?null:'A senha precisa ter pelo menos 6 caracteres.';
function accSend(o){ACC.busy=true;ACC.err='';ACC.msg='';if(NET.status!=='on'||!NET.ready){ACC.pending=o;netConnect();return;}netSend(o);}
function accRegister(){askText('CRIAR CONTA','Escolha um usuário (3 a 16 letras, números, _ ou ponto).','',u=>{if(u==null)return;
 askText('CRIAR CONTA','Crie uma senha (mínimo 6 caracteres). Não use a mesma senha de outros sites.','',p=>{if(p==null)return;
  askText('CONFIRME A SENHA','Digite a senha de novo.','',p2=>{if(p2==null)return;if(p2!==p){ACC.err='As senhas não são iguais.';return;}accSend({t:'register',user:u.toLowerCase(),pass:p});},{max:64,secret:true});},{max:64,secret:true,check:PASS_OK});},{max:16,ph:'ex.: alisson_dla',check:USER_OK});}
function accLogin(){askText('ENTRAR','Seu usuário.','',u=>{if(u==null)return;askText('ENTRAR','Sua senha.','',p=>{if(p==null)return;accSend({t:'login',user:u.toLowerCase(),pass:p});},{max:64,secret:true});},{max:16,check:USER_OK});}
function accPass(){askText('TROCAR SENHA','Senha atual.','',o=>{if(o==null)return;askText('TROCAR SENHA','Senha nova (mínimo 6 caracteres).','',p=>{if(p==null)return;accSend({t:'passwd',old:o,pass:p});},{max:64,secret:true,check:PASS_OK});},{max:64,secret:true});}
function accDelete(){if(NET.status!=='on'){ACC.err='Conecte ao servidor primeiro.';netConnect();return;}
 const go=pass=>{modal={title:save.user?'EXCLUIR CONTA?':'APAGAR DADOS ONLINE?',lines:['Apaga para sempre do servidor: conta, elo e histórico online.','O que está só neste aparelho (itens, GD, coleção) continua aqui.','Não dá para desfazer.'],btns:[['mod:ok','EXCLUIR','#ff6a6a'],['mod:x','CANCELAR','#2e3358']],onOk:()=>{ACC.busy=true;ACC.err='';netSend({t:'delacc',pass:pass||''});}};};
 if(save.user)askText('EXCLUIR CONTA','Digite sua senha para confirmar.','',v=>{if(v)go(v);},{secret:true,max:64});else go('');}
function accLogout(){modal={title:'SAIR DA CONTA?',lines:['Este aparelho volta a ser um jogador novo, sem elo.','Seu elo continua salvo na conta: é só entrar de novo.'],btns:[['mod:ok','SAIR','#ff6a6a'],['mod:x','CANCELAR','#2e3358']],onOk:accDoLogout};}
function accDoLogout(){save.user=null;save.ident=null;save.rank=null;rankInit();persist();ACC.msg='Você saiu da conta.';ACC.err='';netSend(helloMsg(save.nick||'Jogador'));}
function renderAccount(){onlineHeader('CONTA');panel(60,44,360,180);
 if(save.user){text('Você está na conta',W/2,72,9,'#c9cbe6','center',null,PS);text(save.user,W/2,92,14,'#ffd23f','center','#0b0c14');text(`${save.nick||''} · ${rankLabel(save.rank)}`,W/2,110,9,rankCol(save.rank),'center',null,PS);
  text('Entre com este usuário em outro aparelho para jogar com o mesmo elo.',W/2,130,8,'#8a8fb8','center',null,PS);
  btn('accpass',100,150,130,22,'TROCAR SENHA','#2e3358','#ffffff',6);btn('accout',250,150,130,22,'SAIR','#ff6a6a','#0b0c14',7);btn('accdel',100,178,130,14,'EXCLUIR CONTA','#5a2a36','#ff9a9a',5);btn('privacy',250,178,130,14,'PRIVACIDADE','#2e3358','#ffffff',5);}
 else{text('Crie uma conta para guardar seu elo',W/2,70,10,'#ffffff','center',null,PS);text('e jogar com ele em qualquer aparelho.',W/2,84,10,'#ffffff','center',null,PS);
  text('Sem conta, o elo fica preso a este aparelho.',W/2,102,8,'#8a8fb8','center',null,PS);
  btn('accreg',100,120,130,26,'CRIAR CONTA','#ffd23f','#0b0c14',7);btn('acclog',250,120,130,26,'ENTRAR','#2e3358','#ffffff',7);
  text('Não pedimos e-mail. Guarde bem sua senha: sem ela não dá para recuperar a conta.',W/2,160,7,'#8a8fb8','center',null,PS);btn('accdel',100,172,130,14,'APAGAR MEUS DADOS ONLINE','#5a2a36','#ff9a9a',5);btn('privacy',250,172,130,14,'PRIVACIDADE','#2e3358','#ffffff',5);}
 if(ACC.busy)text(ACC.pending?'Conectando ao servidor… (pode levar até 1 minuto)':'Aguarde…',W/2,200,9,'#c9cbe6','center',null,PS);else if(ACC.err)text(ACC.err,W/2,200,8,'#ff9a9a','center',null,PS);else if(ACC.msg)text(ACC.msg,W/2,200,8,'#8ef0a0','center',null,PS);
 btn('accback',8,244,80,20,'VOLTAR','#2e3358','#ffffff',7);renderModal();}