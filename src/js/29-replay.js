// ---------- REPLAY (últimos segundos da luta, vídeo vertical para redes sociais) ----------
// guarda um recorte 216x216 entre você e o rival mais perto, 15 quadros por segundo, nos últimos ~7 segundos
let REPT=null;
const REC={buf:[],max:105,n:0,busy:false,msg:'',prog:0};
function recReset(){for(const b of REC.buf)try{b.close&&b.close();}catch(e){}REC.buf=[];REC.n=0;REC.cx=null;REC.cy=null;REC.msg='';}
function recCap(){if(!G||state!=='fight'||G.tut||(save.opt&&save.opt.replay===false)||!window.createImageBitmap)return;if((REC.n++)%2)return;
 const t=G.p.foe&&!G.p.foe.dead&&Math.hypot(G.p.foe.x-G.p.x,G.p.foe.y-G.p.y)<150?G.p.foe:G.p,mx=(G.p.x+t.x)/2-G.cam.x,my=(G.p.y+t.y)/2-G.cam.y-8;REC.cx=REC.cx==null?mx:REC.cx+(mx-REC.cx)*0.2;REC.cy=REC.cy==null?my:REC.cy+(my-REC.cy)*0.2;
 const sx=Math.round(clamp(REC.cx-108,0,W-216)),sy=Math.round(clamp(REC.cy-108,0,H-216));createImageBitmap(cv,sx,sy,216,216).then(bm=>{REC.buf.push(bm);while(REC.buf.length>REC.max){const o=REC.buf.shift();try{o.close();}catch(e){}}}).catch(()=>{});}
function recMime(){const L=['video/mp4;codecs=avc1.42E01E','video/mp4','video/webm;codecs=vp9','video/webm'];for(const m of L)if(window.MediaRecorder&&MediaRecorder.isTypeSupported(m))return m;return '';}
async function recExport(){if(REC.busy)return;const frames=REC.buf.slice();if(frames.length<10){REC.msg='Replay curto demais.';return;}const mime=recMime();if(!mime){REC.msg='Este navegador não grava vídeo.';return;}
 REC.busy=true;REC.msg='';REC.prog=0;const r=G.res,me=G.p.def;
 const oc=document.createElement('canvas');oc.width=720;oc.height=1280;const o=oc.getContext('2d');o.imageSmoothingEnabled=false;
 const stream=oc.captureStream(30),rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:4000000}),chunks=[];rec.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data);};
 const done=new Promise(res=>rec.onstop=res);rec.start(200);
 const fnt=(sz,f)=>`${sz}px ${f||PX}`;
 const frame=(bm,k)=>{o.fillStyle='#0b0c14';o.fillRect(0,0,720,1280);const g=o.createLinearGradient(0,0,0,1280);g.addColorStop(0,'rgba(224,57,62,0.25)');g.addColorStop(0.5,'rgba(11,12,20,0)');g.addColorStop(1,'rgba(79,141,255,0.25)');o.fillStyle=g;o.fillRect(0,0,720,1280);
  o.textAlign='center';o.fillStyle='#ffd23f';o.font=fnt(64);o.fillText('DUEL',360,130);o.fillStyle='#ffffff';o.font=fnt(44);o.fillText('LEGENDS',360,185);o.fillStyle='#e0393e';o.fillRect(250,205,220,46);o.fillStyle='#ffffff';o.font=fnt(30);o.fillText('ARENA',360,240);
  o.fillStyle='#0b0c14';o.fillRect(20,290,680,680);o.fillStyle='#e0393e';o.fillRect(32,302,680,680);o.fillStyle='#0b0c14';o.fillRect(20,290,680,680);o.drawImage(bm,0,0,216,216,30,300,660,660);
  o.font=fnt(42);o.fillStyle=r&&r.win?'#ffd23f':'#ff7a7a';o.fillText(r&&r.win?'VITÓRIA!':'QUASE...',360,1050);o.font=fnt(30,PS);o.fillStyle='#ffffff';o.fillText(`com ${me.name}`,360,1100);
  o.font=fnt(26,PS);o.fillStyle='#c9cbe6';o.fillText('Jogue no navegador · link na bio',360,1190);o.fillStyle='#8a8fb8';o.font=fnt(18,PS);o.fillText('@duellegendsarena',360,1230);
  REC.prog=k/frames.length;};
 for(let k=0;k<frames.length;k++){frame(frames[k],k);await new Promise(res=>setTimeout(res,1000/15));}
 const last=frames[frames.length-1];for(let k=0;k<15;k++){frame(last,frames.length);await new Promise(res=>setTimeout(res,1000/15));}
 rec.stop();await done;REC.busy=false;const ext=mime.includes('mp4')?'mp4':'webm';const blob=new Blob(chunks,{type:mime.split(';')[0]});const file=new File([blob],`duel-legends-replay.${ext}`,{type:blob.type});
 try{if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],text:'Olha essa luta no Duel Legends Arena! ⚔️'});REC.msg='Pronto!';return;}}catch(e){if(e&&e.name==='AbortError'){REC.msg='';return;}}
 const url=URL.createObjectURL(blob);try{const a=document.createElement('a');a.href=url;a.download=file.name;document.body.appendChild(a);a.click();a.remove();REC.msg=ext==='mp4'?'Vídeo salvo nos downloads!':'Vídeo salvo (.webm). Se o Instagram não aceitar, converta para MP4.';}catch(e){window.open(url,'_blank');REC.msg='Vídeo aberto em outra aba: segure para salvar.';}}