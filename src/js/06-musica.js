// ---------- MÚSICA (chiptune gerada na hora) ----------
const MUS={menu:{bpm:100,prog:[[57,60,64],[53,57,60],[48,52,55],[55,59,62]],lead:[76,null,72,null,74,null,69,null,72,null,67,null,71,null,74,null],drums:false},
 fight:{bpm:132,prog:[[57,60,64],[53,57,60],[48,52,55],[55,59,62]],lead:[76,74,72,74,72,69,67,69,72,74,76,79,76,74,72,71],drums:true}};
let musTrack=null,musStep=0,musNext=0;
const mtof=m=>440*Math.pow(2,(m-69)/12);
function tone(type,f,t,len,vol){const o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.0001,t+len);o.connect(g);g.connect(MUSG);o.start(t);o.stop(t+len+0.02);}
function drum(kind,t){if(kind==='k'){const o=AC.createOscillator(),g=AC.createGain();o.frequency.setValueAtTime(140,t);o.frequency.exponentialRampToValueAtTime(40,t+0.12);g.gain.setValueAtTime(0.5,t);g.gain.exponentialRampToValueAtTime(0.0001,t+0.15);o.connect(g);g.connect(MUSG);o.start(t);o.stop(t+0.17);}
 else{const s=AC.createBufferSource(),g=AC.createGain(),f=AC.createBiquadFilter();s.buffer=NOISE;f.type='highpass';f.frequency.value=kind==='h'?7000:1500;g.gain.setValueAtTime(kind==='h'?0.06:0.18,t);g.gain.exponentialRampToValueAtTime(0.0001,t+(kind==='h'?0.04:0.12));s.connect(f);f.connect(g);g.connect(MUSG);s.start(t);s.stop(t+0.15);}}
function musicTick(){if(!AC||!MUSG)return;const want=(state==='fight'||state==='countdown')?'fight':'menu';if(want!==musTrack){musTrack=want;musStep=0;musNext=AC.currentTime+0.05;}
 const M=MUS[musTrack],sp=60/M.bpm/4;if(musNext<AC.currentTime-0.5)musNext=AC.currentTime+0.05;
 while(musNext<AC.currentTime+0.15){const st=musStep%16,bar=Math.floor(musStep/16)%4,ch=M.prog[bar],t=musNext;
  if(st%2===0)tone('square',mtof(ch[0]-12+(st%4===2?12:0)),t,sp*1.8,0.07);
  tone('square',mtof(ch[st%3]+12),t,sp*0.9,musTrack==='fight'?0.025:0.018);
  const ln=M.lead[(bar*4+Math.floor(st/4))%16];if(st%4===0&&ln&&!(musTrack==='menu'&&bar%2))tone('triangle',mtof(ln),t,sp*3.6,0.07);
  if(M.drums){if(st%4===0)drum('k',t);if(st%8===4)drum('s',t);if(st%2===1)drum('h',t);}
  musNext+=sp;musStep++;}}
function thud(vol,len,freq){if(!AC||!NOISE||!soundOn)return;try{const t=AC.currentTime,s=AC.createBufferSource(),g=AC.createGain(),f=AC.createBiquadFilter();s.buffer=NOISE;s.playbackRate.value=0.8+Math.random()*0.4;f.type='lowpass';f.frequency.value=freq;g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.0001,t+len);s.connect(f);f.connect(g);g.connect(SFXG);s.start(t);s.stop(t+len+0.02);}catch(e){}}
function buzz(ms){try{if(save.opt.vib!==false&&navigator.vibrate)navigator.vibrate(ms);}catch(e){}}
function sfx(type){if(type==='hit')thud(0.16,0.09,1400);else if(type==='big')thud(0.28,0.22,900);else if(type==='ko')thud(0.35,0.4,600);if(!AC||!soundOn)return;try{const t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain();o.connect(g);g.connect(SFXG);
 const S={shoot:['square',520,260,0.05,0.04],hit:['square',180,80,0.08,0.06],big:['sawtooth',120,40,0.25,0.09],dash:['triangle',300,700,0.08,0.05],special:['sawtooth',220,880,0.3,0.06],beep:['square',660,660,0.08,0.05],go:['square',990,990,0.18,0.06],reveal:['triangle',520,1040,0.2,0.06],ko:['sawtooth',400,60,0.6,0.08],win:['triangle',523,1046,0.5,0.07]}[type];
 if(!S)return;o.type=S[0];const pv=type==='hit'?0.85+Math.random()*0.3:1;o.frequency.setValueAtTime(S[1]*pv,t);o.frequency.exponentialRampToValueAtTime(Math.max(30,S[2]),t+S[3]);g.gain.setValueAtTime(S[4],t);g.gain.exponentialRampToValueAtTime(0.0001,t+S[3]);o.start(t);o.stop(t+S[3]+0.02);}catch(e){}}
