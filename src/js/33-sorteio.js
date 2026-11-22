// ---------- SORTEIO ----------
function updateDraw(dt){if(pick&&pick.choosing){drawT=0;return;}if(pick&&isMulti()){const n=1+(pick.allies||[]).length+(pick.foes||[]).length;if(!pick.gridN)pick.gridN=0;while(pick.gridN<n&&drawT>gridAt(pick.gridN)){pick.gridN++;sfx(pick.gridN===n?'reveal':'shoot');}}drawT+=dt;if(drawT>1.6&&!revealed[0]){revealed[0]=true;sfx('reveal');}if(drawT>3.0&&!revealed[1]){revealed[1]=true;sfx('reveal');}if(drawT>4.3&&!revealed[2]){revealed[2]=true;sfx('reveal');}}

