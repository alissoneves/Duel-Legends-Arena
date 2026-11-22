// ---------- SAVE ----------
let save={mastery:{},seen:{},wins:0,games:0,rank:{pts:0,best:0,season:1},hist:[],opt:{sfx:0.8,music:0.5,diff:1,tips:true},howto:false};
try{const s=JSON.parse(localStorage.getItem('dla_proto')||'null');if(s)save=Object.assign(save,s);}catch(e){}
rankInit();save.opt=Object.assign({sfx:0.8,music:0.5,diff:1,tips:true},save.opt||{});
function persist(){try{localStorage.setItem('dla_proto',JSON.stringify(save));}catch(e){}}
const GEMS=['Sem patente','Quartzo','Ametista','Topázio','Esmeralda','Safira','Rubi','Diamante','Diamante Negro'];
const GEMCOL=['#9aa3c7','#e8e8f0','#b07aff','#ffc04d','#46d160','#4f8dff','#ff4d5e','#bff4ff','#6a5acd'];
function gemOf(pts){return Math.min(8,Math.floor(pts/100));}