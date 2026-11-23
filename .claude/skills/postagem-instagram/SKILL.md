---
name: postagem-instagram
description: Use para criar postagens, legendas, calendário, cards de "Lenda do Dia" ou vídeos do Instagram do Duel Legends Arena.
---

# Postagens do Instagram

O usuário posta à mão. O trabalho aqui é deixar pronto: calendário, legendas e mídias na pasta `insta/`, depois commit "Instagram: …".

## Estilo (não mude sem o usuário pedir)

- O estilo é o das 3 primeiras postagens já publicadas (Lenda do Dia #1 Saci, #2 Iara, #3 Zeus).
- **Sem destaque especial para folclore**: nem no texto, nem nas hashtags, nem na escolha das lendas. Alterne origens (mitologias, folclore, criações originais).
- **Legendas sempre pela ferramenta, nunca escritas à mão.** O teste `ferramentas/test/legenda.test.js` garante que ela reproduz o calendário.

## Calendário: `insta/calendario.json`

Lista de dias, cada um assim:

```json
{ "dia": "AAAA-MM-DD",
  "09:00": { "tipo": "lenda", "n": 62, "nome": "Nome", "arquivo": "lenda_062.jpg", "legenda": "..." },
  "15:00": { "tipo": "video", "arquivo": "g21_a_vs_b.mp4", "legenda": "..." },
  "18:00": { "tipo": "lenda", "n": 63, "nome": "Nome", "arquivo": "lenda_063.jpg", "legenda": "..." } }
```

- Continue do último dia e do último `n` (o #1 foi o Saci, fora do calendário).
- `n` é o número do post ("LENDA DO DIA #n"), não o número da lenda no jogo.
- Arquivos: `lenda_NNN.jpg` (NNN = `n` com 3 dígitos); vídeos de recurso `NN_nome.mp4`; confrontos `gNN_a_vs_b.mp4` (minúsculas, espaço vira `_`, acentos mantidos).

Lendas que ainda não tiveram post:

```
node -e "const {carregarLendas}=require('./ferramentas/dados');const C=JSON.parse(require('fs').readFileSync('insta/calendario.json','utf8'));const f=new Set(['Saci']);for(const d of C)for(const h of ['09:00','18:00'])f.add(d[h].nome);console.log(carregarLendas().filter(l=>!f.has(l.n)).map(l=>l.n+' ('+l.r+', '+l.e+')').join('\n'))"
```

## Legendas

```
node ferramentas/insta/legenda.js lenda <n> "<Nome da lenda>" <base|mito|br> [longa|curta] ["origem"]
node ferramentas/insta/legenda.js confronto "<A>" "<B>"
```

- Grupo de hashtags: `mito` para mitologias e lendas de outros países (acrescenta #mitologia #lendas); `br` para folclore e cultura brasileira (acrescenta #culturabrasileira); `base` quando nenhum dos dois serve.
- Chamada: `longa` é o padrão ("Conta aqui nos comentários!"); `curta` só para variar.
- Origem: opcional, quando o nome não deixa claro de onde a lenda vem ("Mitologia nórdica", "Criação original", "Cultura popular brasileira").
- Vídeo de recurso (modo de jogo, sorteio, prêmio diário…): siga o modelo das legendas `01_…` a `10_…` do calendário: emoji + título em maiúsculas + uma frase, linha em branco, "🎮 Jogue grátis no navegador: link na bio", linha em branco, `#DuelLegendsArena #jogoindie #pixelart #gamedevbrasil #indiegame`.

Para gravar no calendário, gere o JSON com Node (`JSON.stringify(calendario, null, 1)`, como o arquivo atual) em vez de editar à mão: evita erro de aspas e de emoji.

## Mídias

- Card da lenda (1080×1350) e vídeos: ferramentas da etapa 2, em `ferramentas/insta/` (`card.js`, `video.js`). **Enquanto não existirem**, liste para o usuário quais `lenda_NNN.jpg` e `.mp4` do calendário ainda faltam em `insta/`.
- Para conferir o que falta:
  ```
  node -e "const fs=require('fs');const C=JSON.parse(fs.readFileSync('insta/calendario.json','utf8'));for(const d of C)for(const h of ['09:00','15:00','18:00'])if(!fs.existsSync('insta/'+d[h].arquivo))console.log(d.dia,h,d[h].arquivo)"
  ```

## Fechar

```
node --test ferramentas/test/
git add insta/
git commit -m "Instagram: <o que foi feito>"
```

Pergunte antes do push.
