// ---------- ÁUDIO ----------
let AC=null,soundOn=true;
let SFXG=null,MUSG=null,NOISE=null;
function ensureAudio(){try{if(!AC){AC=new (window.AudioContext||window.webkitAudioContext)();SFXG=AC.createGain();MUSG=AC.createGain();SFXG.connect(AC.destination);MUSG.connect(AC.destination);
 const nb=AC.createBuffer(1,AC.sampleRate*0.5,AC.sampleRate),d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;NOISE=nb;applyVolumes();}
 if(AC.state==='suspended')AC.resume();}catch(e){AC=null;}}
function applyVolumes(){if(!AC)return;const o=save.opt||{};SFXG.gain.value=soundOn?(o.sfx!=null?o.sfx:0.8):0;MUSG.gain.value=soundOn?(o.music!=null?o.music:0.5)*0.55:0;}