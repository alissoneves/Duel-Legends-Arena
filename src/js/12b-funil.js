// ---------- FUNIL (anônimo): em que etapa os jogadores novos desistem ----------
// Etapas: abriu o jogo (por dia), jogador novo, começou/terminou a 1ª luta, 5ª partida, tutorial.
// Vai por sendBeacon: funciona sem o online ligado e não atrasa o jogo. Só o identificador aleatório do aparelho.
function evUrl(){return serverUrl().replace(/^ws/,'http').replace(/\/+$/,'')+'/ev';}
function evSend(o){try{const b=JSON.stringify(Object.assign({p:ident().pid},o));if(navigator.sendBeacon&&navigator.sendBeacon(evUrl(),b))return;fetch(evUrl(),{method:'POST',body:b,keepalive:true,mode:'no-cors'}).catch(()=>{});}catch(x){}}
function hojeBR(){return new Date(Date.now()-3*3600e3).toISOString().slice(0,10);}
// once: só uma vez na vida do aparelho; sem once: uma vez por dia
function fev(e,once){try{save.fev=save.fev||{};if(once?save.fev[e]:save.fev[e]===hojeBR())return;save.fev[e]=once?1:hojeBR();persist();evSend({e});}catch(x){}}
(function funilInicio(){try{save.fev=save.fev||{};
 // quem já jogava antes do funil existir não conta como jogador novo nem como "1ª luta"
 if(!save.fev.new){if((save.games||0)>0){save.fev.new='antigo';save.fev.f_start=1;save.fev.f_end=1;if(save.games>=5)save.fev.g5=1;persist();}else fev('new',1);}
 fev('open');}catch(x){}})();
// erros de quem nunca entra no online também chegam (ao sair ou esconder a aba)
addEventListener('visibilitychange',()=>{try{if(document.hidden&&ERRQ.length&&NET.status!=='on')evSend({err:ERRQ.splice(0)});}catch(x){}});
