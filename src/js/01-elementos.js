// ---------- ELEMENTOS ----------
const STRONG={Fogo:['Gelo','Natureza','Vampiro'],'Água':['Fogo','Terra','Máquina'],Gelo:['Água','Terra'],'Elétrico':['Água','Máquina'],Natureza:['Água','Terra'],Terra:['Fogo','Elétrico'],Luz:['Trevas','Vampiro'],Trevas:['Luz','Humano','Elfo'],Humano:['Elfo','Elétrico'],Vampiro:['Humano','Natureza'],Elfo:['Vampiro','Máquina'],'Máquina':['Gelo','Natureza'],Neutro:[]};
function mult(a,d){if((STRONG[a]||[]).includes(d))return 1.5;if((STRONG[d]||[]).includes(a))return 0.75;return 1;}
const ELCOL={Fogo:'#ff6a3d','Água':'#4fa8ff',Gelo:'#9fe3ff',Luz:'#ffd23f',Vampiro:'#e0396a',Elfo:'#5fd4c4',Neutro:'#c9cbe6','Elétrico':'#ffe14d',Natureza:'#7ed957',Terra:'#d9a04a',Trevas:'#b07aff',Humano:'#ff9a7a','Máquina':'#4fc3ff'};
