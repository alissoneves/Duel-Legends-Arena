(()=>{
'use strict';
// erros no aparelho do jogador: guardados e enviados ao servidor (página /erros)
const ERRQ=[];function errPush(m,st){m=String(m||'').slice(0,200);if(!m)return;const e=ERRQ.find(x=>x.m===m);if(e){e.n++;return;}let w='';try{w=state;}catch(x){}if(ERRQ.length<10)ERRQ.push({m,s:String(st||'').slice(0,800),n:1,w});}
window.addEventListener('error',e=>errPush(e.message,e.error&&e.error.stack));
window.addEventListener('unhandledrejection',e=>{const r=e.reason;errPush('Promise: '+((r&&r.message)||r),r&&r.stack);});
const W=480,H=270;
const cv=document.getElementById('c'),ctx=cv.getContext('2d');
ctx.imageSmoothingEnabled=false;
function fit(){const s=Math.min(innerWidth/W,innerHeight/H);cv.style.width=Math.floor(W*s)+'px';cv.style.height=Math.floor(H*s)+'px';}
addEventListener('resize',fit);fit();
const PX='"Press Start 2P", monospace', PS='"Pixelify Sans", sans-serif';
const rnd=(a,b)=>a+Math.random()*(b-a), clamp=(v,a,b)=>v<a?a:v>b?b:v, lerp=(a,b,t)=>a+(b-a)*t;
const TAU=Math.PI*2;
function angDiff(a,b){let d=a-b;while(d>Math.PI)d-=TAU;while(d<-Math.PI)d+=TAU;return Math.abs(d);}
