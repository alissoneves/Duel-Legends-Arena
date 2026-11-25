(()=>{
'use strict';
// erros no aparelho do jogador: guardados e enviados ao servidor (página /erros)
const ERRQ=[];function errPush(m,st){m=String(m||'').slice(0,200);if(!m)return;const e=ERRQ.find(x=>x.m===m);if(e){e.n++;return;}let w='';try{w=state;}catch(x){}if(ERRQ.length<10)ERRQ.push({m,s:String(st||'').slice(0,800),n:1,w});}
window.addEventListener('error',e=>errPush(e.message,e.error&&e.error.stack));
window.addEventListener('unhandledrejection',e=>{const r=e.reason;errPush('Promise: '+((r&&r.message)||r),r&&r.stack);});
const W=480,H=270;
const cv=document.getElementById('c'),ctx=cv.getContext('2d');
ctx.imageSmoothingEnabled=false;
// K = pixels reais por pixel do jogo. Em tela comum, inteiro quando possível (pixels iguais); fracionário só se o inteiro encolher a tela mais de 15%.
let K=1;
// resolução adaptativa: kMax desce um degrau quando o jogo fica lento (aparelho fraco ou tela 4K)
let kMax=6;
// Tamanho na tela (CSS) não depende de kMax: kMax só baixa a resolução interna, nunca encolhe a tela.
function fit(){const dpr=window.devicePixelRatio||1,vw=innerWidth,vh=innerHeight;if(!vw||!vh)return;const dMax=Math.min(vw/W,vh/H)*dpr,kI=Math.floor(dMax);let d=dpr<2&&kI>=1&&kI/dMax>=0.85?kI:dMax; // celular (dpr≥2): ocupa a tela toda; pixel fracionário não apareced=Math.max(1,d);
 const k=Math.min(kMax,d),bw=Math.round(W*k),bh=Math.round(H*k);if(cv.width!==bw||cv.height!==bh){cv.width=bw;cv.height=bh;}K=bw/W;ctx.imageSmoothingEnabled=false;cv.style.width=Math.round(W*d/dpr)+'px';cv.style.height=Math.round(H*d/dpr)+'px';}
// ao girar o celular, alguns navegadores avisam antes de a tela mudar de tamanho: mede de novo logo depois
function refit(){fit();setTimeout(fit,120);setTimeout(fit,400);setTimeout(fit,900);}
addEventListener('resize',refit);addEventListener('orientationchange',refit);if(window.visualViewport)visualViewport.addEventListener('resize',refit);
if(screen.orientation&&screen.orientation.addEventListener)screen.orientation.addEventListener('change',refit);fit();
const PX='"Press Start 2P", monospace', PS='"Pixelify Sans", sans-serif';
const rnd=(a,b)=>a+Math.random()*(b-a), clamp=(v,a,b)=>v<a?a:v>b?b:v, lerp=(a,b,t)=>a+(b-a)*t;
const TAU=Math.PI*2;
function angDiff(a,b){let d=a-b;while(d>Math.PI)d-=TAU;while(d<-Math.PI)d+=TAU;return Math.abs(d);}
