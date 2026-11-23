(()=>{
'use strict';
// erros no aparelho do jogador: guardados e enviados ao servidor (página /erros)
const ERRQ=[];function errPush(m,st){m=String(m||'').slice(0,200);if(!m)return;const e=ERRQ.find(x=>x.m===m);if(e){e.n++;return;}let w='';try{w=state;}catch(x){}if(ERRQ.length<10)ERRQ.push({m,s:String(st||'').slice(0,800),n:1,w});}
window.addEventListener('error',e=>errPush(e.message,e.error&&e.error.stack));
window.addEventListener('unhandledrejection',e=>{const r=e.reason;errPush('Promise: '+((r&&r.message)||r),r&&r.stack);});
const W=480,H=270;
const cv=document.getElementById('c'),ctx=cv.getContext('2d');
ctx.imageSmoothingEnabled=false;
// K = pixels reais por pixel do jogo. Inteiro quando possível (pixels iguais); fracionário só se o inteiro encolher a tela mais de 15%.
let K=1;
function fit(){const dpr=window.devicePixelRatio||1,dMax=Math.min(innerWidth/W,innerHeight/H)*dpr,kI=Math.floor(dMax);let d=kI>=1&&kI/dMax>=0.85?kI:dMax;d=Math.max(1,Math.min(6,d));
 const bw=Math.round(W*d),bh=Math.round(H*d);if(cv.width!==bw||cv.height!==bh){cv.width=bw;cv.height=bh;}K=bw/W;ctx.imageSmoothingEnabled=false;cv.style.width=(bw/dpr)+'px';cv.style.height=(bh/dpr)+'px';}
addEventListener('resize',fit);fit();
const PX='"Press Start 2P", monospace', PS='"Pixelify Sans", sans-serif';
const rnd=(a,b)=>a+Math.random()*(b-a), clamp=(v,a,b)=>v<a?a:v>b?b:v, lerp=(a,b,t)=>a+(b-a)*t;
const TAU=Math.PI*2;
function angDiff(a,b){let d=a-b;while(d>Math.PI)d-=TAU;while(d<-Math.PI)d+=TAU;return Math.abs(d);}
