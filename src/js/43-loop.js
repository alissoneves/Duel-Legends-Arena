// ---------- LOOP ----------
let last=performance.now();
function loop(now){try{musicTick();}catch(e){}if(window.__frozen){last=now;requestAnimationFrame(loop);return;}const dt=Math.min(0.05,(now-last)/1000);last=now;try{update(dt);render();}catch(e){console.error(e);}requestAnimationFrame(loop);}
const ready=document.fonts&&document.fonts.load?Promise.race([Promise.all([document.fonts.load(`8px ${PX}`),document.fonts.load(`10px ${PS}`)]),new Promise(r=>setTimeout(r,2500))]):Promise.resolve();
ready.then(()=>requestAnimationFrame(loop));
// instalar como app (só na página própria)
try{if('serviceWorker' in navigator&&/github\.io$/.test(location.hostname))navigator.serviceWorker.register('sw.js');}catch(e){}
// convite por link: ?sala=CÓDIGO entra direto na sala
try{const sala=new URLSearchParams(location.search).get('sala');if(sala){NET.autoJoin=sala.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8);save.accAsked=true;save.tutAsked=true;const go=()=>{state='online';netConnect();};if(!save.nick)setTimeout(()=>askNick(true,go),600);else go();}}catch(e){}
setInterval(()=>{if(ERRQ.length&&NET.status==='on')netSend({t:'err',list:ERRQ.splice(0)});},15000);
window.__dla={errPush,ERRQ,get LB(){return LB},REC,recExport,startTutorial,ACH,achCheck,stx,weekLegend,weekIdx,missToday,weekState,dayIdx,weekDay,missTrack,NET,netSend,get G2(){return G},buildArena,get save(){return save},set state(v){state=v},step(n,dt){for(let i=0;i<n;i++)update(dt);render();if(window.__post)window.__post();},ctx,text,PX,PS,logo,setPick(o){pick=o;},get pick(){return pick},ARENAS,set albSel(v){albSel=v},BAL,get T(){return T},get state(){return state},get G(){return G},onButton,CHARS,sim(i,j,ai){const me=CHARS[i],foe=CHARS[j];pick={me,foe,arena:ARENAS[ai]};pick.arena.bg=pick.arena.bg||buildArena(pick.arena);startMatch();G.p.bot=true;G.p.face=1;state='fight';let n=0;
 while(!G.over&&n<4000){update(1/30);n++;}const res={w:G.winner===G.p?0:G.winner===G.b?1:-1,hp:[Math.round(G.p.hp),Math.round(G.b.hp)],t:Math.round(99-G.time)};state='title';G=null;return res;},
 test(i){const me=CHARS[i];const foe=CHARS[(i*7+3)%CHARS.length===i?(i+1)%CHARS.length:(i*7+3)%CHARS.length];pick={me,foe,arena:ARENAS[i%ARENAS.length]};pick.arena.bg=pick.arena.bg||buildArena(pick.arena);startMatch();cdT=0.01;}};
})();
