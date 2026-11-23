// ---------- ONLINE (servidor em servidor/server.js) ----------
// O dono da sala simula a luta e manda o estado ~20x por segundo; os outros mandam só os comandos.
const NET={on:false,ws:null,status:'off',id:null,rooms:[],room:null,chat:[],quick:[],start:null,role:null,mySlot:-1,inputs:{},snapT:0,inT:0,newPops:[],ping:0,prepReady:[],queued:false,err:null,cnt:{b:0,c:0,dash:0},lastSnap:null};
const DEFAULT_SERVER='wss://duel-legends-arena.onrender.com';
// ?server= só vale para servidor local (testes): um link com servidor de fora poderia capturar login e senha
function serverUrl(){try{const q=new URLSearchParams(location.search).get('server');if(q&&/^wss?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?(\/|$)/i.test(q))return q;}catch(e){}return (save.opt&&save.opt.server)||DEFAULT_SERVER;}
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function withSeed(seed,fn){const r=Math.random;Math.random=mulberry32(seed);try{return fn();}finally{Math.random=r;}}
function netSend(o){if(NET.ws&&NET.ws.readyState===1)NET.ws.send(JSON.stringify(o));}
function netConnect(){if(NET.ws&&(NET.ws.readyState===0||NET.ws.readyState===1))return;NET.status='connecting';NET.err=null;
 let ws;try{ws=new WebSocket(serverUrl());}catch(e){NET.status='error';NET.err='Endereço do servidor inválido';return;}NET.ws=ws;
 ws.onopen=()=>{NET.status='on';netSend(helloMsg(save.nick||'Jogador'));NET.pingT=setInterval(()=>netSend({t:'ping',ts:performance.now()}),3000);};
 ws.onclose=()=>{clearInterval(NET.pingT);NET.ready=false;const wasFight=NET.on&&(state==='fight'||state==='countdown'||state==='prep'||state==='draw');NET.status=NET.status==='connecting'?'error':'off';NET.ws=null;NET.room=null;
  if(NET.status==='error')NET.err='Não foi possível conectar. O servidor pode estar acordando (até 1 minuto): tente de novo.';if(wasFight){netAbort('Conexão perdida.');}};
 ws.onerror=()=>{};ws.onmessage=e=>{let m;try{m=JSON.parse(e.data);}catch(x){return;}netMsg(m);};}
// caixa de texto própria (o prompt() do navegador é bloqueado em várias páginas e apps)
let askCb=null,askCheck=null;
function askText(title,sub,def,cb,opt){opt=opt||{};const el=document.getElementById('ask'),I=document.getElementById('askI');document.getElementById('askT').textContent=tr(title);document.getElementById('askS').textContent=tr(sub||'');document.getElementById('askE').textContent='';
 I.value=def||'';I.maxLength=opt.max||40;I.type=opt.secret?'password':'text';I.placeholder=tr(opt.ph||'');askCb=cb;askCheck=opt.check||null;el.style.display='flex';resetTouch();setTimeout(()=>{I.focus();I.select();},60);}
function askClose(ok){const el=document.getElementById('ask'),I=document.getElementById('askI');if(el.style.display!=='flex')return;const v=I.value.trim();
 if(ok&&askCheck){const err=askCheck(v);if(err){document.getElementById('askE').textContent=tr(err);I.focus();return;}}
 el.style.display='none';I.blur();const cb=askCb;askCb=null;if(cb)cb(ok?v:null);}
function askOpen(){return document.getElementById('ask').style.display==='flex';}
document.getElementById('askO').onclick=()=>askClose(true);document.getElementById('askN').onclick=()=>askClose(false);
document.getElementById('askI').addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter')askClose(true);if(e.key==='Escape')askClose(false);});
function cleanNick(n){return String(n||'').replace(/[^\p{L}\p{N} _.-]/gu,'').replace(/\s+/g,' ').trim().slice(0,16);}
// filtro de nomes: bloqueia palavrões, ofensas e termos de ódio (português e inglês)
// normaliza acentos, números no lugar de letras (4=a, 3=e, 1=i, 0=o, 5=s, 7=t, @=a, $=s) e letras repetidas
const BAD_ROOTS = ['porra', 'caralh', 'karalh', 'buceta', 'bucet', 'xoxota', 'xereca', 'xota', 'puta', 'puto', 'putinha', 'viado', 'viadinh', 'bixa', 'bicha',
  'vagabund', 'arrombad', 'cuzao', 'cusao', 'cuzinh', 'fdp', 'filhodaput', 'foder', 'fodase', 'fodas', 'fodid', 'merd', 'bosta', 'bostinh', 'porrinh', 'caralinh', 'cuzinho', 'piroca', 'pirok', 'rola',
  'punheta', 'siririca', 'boquete', 'chupaminha', 'pauno', 'paunocu', 'corno', 'otario', 'babaca', 'retardad', 'mongoloid', 'estupr', 'pedofil', 'nazi', 'hitler',
  'crioulo', 'fuck', 'fuk', 'shit', 'bitch', 'cunt', 'dick', 'pussy', 'whore', 'slut', 'nigg', 'nigga', 'faggot', 'retard', 'sexo', 'porn', 'xvideo', 'peitud', 'gostos'];
// palavras normais que contêm um trecho acima e não devem ser bloqueadas
const OK_WORDS = ['computa', 'disputa', 'reputa', 'imputa', 'deputad', 'amputa', 'putamen', 'rolamento', 'rolando', 'rolagem', 'controla', 'escola', 'carola', 'crola',
  'marola', 'corola', 'pirola', 'patrola', 'petrola', 'pintor', 'pintura', 'pintado', 'pintassilgo', 'shitake', 'dickens', 'bichano', 'sexton',
  'consexo', 'sussex', 'essex', 'scunthorpe', 'pintinho', 'rolao', 'rolinha', 'otaku', 'diaspora', 'espora', 'merdeka'];
function normName(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[4@]/g, 'a').replace(/3/g, 'e').replace(/[1!|]/g, 'i').replace(/0/g, 'o').replace(/[5$]/g, 's').replace(/7/g, 't')
    .replace(/[^a-z]/g, '').replace(/(.)\1+/g, '$1');
}
function badName(s) {
  let n = normName(s);
  for (const w of OK_WORDS) n = n.split(normName(w)).join('#');
  return BAD_ROOTS.some(r => n.includes(normName(r)));
}

function askNick(first,then){askText(first?'BEM-VINDO!':'SEU NOME',NET.canRename?'Seu nome foi trocado pela moderação. Escolha um novo (3 a 16 letras ou números).':'Escolha seu nome de jogador (3 a 16 letras ou números). Atenção: depois não dá para trocar!',save.nick||'',v=>{
  if(v!=null){const n=cleanNick(v);save.nick=n;persist();netSend(helloMsg(n));sfx('go');}
  else if(first&&!save.nick){save.nick='Jogador'+Math.floor(Math.random()*900+100);persist();}
  if(then)then();},{max:16,ph:'Ex.: Alisson',check:v=>cleanNick(v).length<3?'Use pelo menos 3 letras ou números.':badName(v)?'Esse nome não é permitido. Escolha outro.':null});}
function ident(){if(!save.ident||!save.ident.pid){const h=n=>{const a=new Uint8Array(n);(window.crypto||{}).getRandomValues?crypto.getRandomValues(a):a.forEach((v,i)=>a[i]=Math.random()*256|0);return [...a].map(v=>v.toString(16).padStart(2,'0')).join('');};save.ident={pid:h(12),key:h(16)};persist();}return save.ident;}
function helloMsg(name){const I=ident();return {t:'hello',name,ver:'2.5.2',pid:I.pid,key:I.key,title:save.title||'',icon:save.icon||idOf('Saci')||''};}