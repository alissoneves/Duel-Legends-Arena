---
name: postagem-instagram
description: Use para criar postagens, legendas, calendário, cards de "Lenda do Dia" ou vídeos do Instagram do Duel Legends Arena.
---

# Postagens do Instagram

O usuário posta à mão. O trabalho aqui é deixar pronto: calendário, legendas e mídias na pasta `insta/`, depois commit "Instagram: …".

## Estilo (não mude sem o usuário pedir)

- Legendas: o estilo é o das 3 primeiras postagens já publicadas (Lenda do Dia #1 Saci, #2 Iara, #3 Zeus). Vídeos: siga o "Padrão de marketing" abaixo.
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

## Padrão de marketing (aprovado pelo usuário em 25/11/2026)

Todo vídeo novo (Lenda do Dia, confronto, recurso do jogo) segue este padrão. Referência visual: jogos mobile como Brawl Stars — pode melhorar sempre que fizer sentido, e cores das letras/artes podem mudar.

- **Gancho em 1,5 s**: clarão, sprite gigante batendo na tela com tremor, nome/título entrando com mola. Nada de tela parada no começo.
- **Tipografia**: títulos e chamadas em **Lilita One** no estilo jogo mobile (degradê, contorno preto grosso, extrusão 3D, brilho no topo, leve inclinação) — função `brawl()`; números/impacto (K.O., VS da lenda do dia) em Boldonse; textos pequenos em Bricolage Grotesque. Fontes em `ferramentas/insta/fontes/` (todas OFL).
- **Luta**: janela 4:5 com cantos arredondados sobre o fundo desfocado da própria arena; HUD de jogo de luta (retratos, barras inclinadas com rastro branco, emblema VS); zoom e tremor em cada golpe; contador "N HITS"; nome do golpe com a tecla A/B/C na cor do card, no alto da janela (sem cobrir os lutadores); câmera lenta com barras de cinema antes do K.O.; K.O. congelado com clarão e raios; VITÓRIA.
- **Final (= capa)**: Lenda do Dia termina no card (`capa_NNN.jpg` = último quadro, usado como `cover_url`); confronto e recurso terminam no logo + "▶ JOGUE GRÁTIS · LINK NA BIO".
- **Som sempre**: chiptune com dinâmica (só baixo no gancho, música cheia na luta, subida antes do K.O., silêncio + estrondo no K.O., fanfarra, acorde final), soco por golpe, whoosh nos cortes, clique nos toques; volume normalizado (-14 LUFS).
- Texto nunca cobre o que importa da imagem; respeite a área segura do Reels (~250 px no topo, ~360 px embaixo).

Ferramentas (rode de dentro de `ferramentas/insta`, depois de `node build.js` na raiz):

- Lenda do Dia: `node reel.mjs <Lenda> <Rival> --n 7 --raridade Raro --golpes "A|B|C" --card ../../insta/lenda_007.jpg --seed S --arena N --saida X.mp4` e depois `python3 som_pro.py X.mp4 <n>`. A lenda sempre vence; código 2 = perdeu nesta semente, tente outra. Capa: último quadro (`ffmpeg -sseof -0.2 ... capa_NNN.jpg`).
- Confronto: `node reel.mjs <A> <B> --modo confronto --golpes "..." --golpesB "..." --seed S --saida gNN_a_vs_b.mp4` e `python3 som_pro.py gNN... <semente>`.
- Recurso do jogo (loja, modos, ranqueada, missões...): roteiro JSON em `roteiros/` (telas do jogo, legenda de cada cena, foco do zoom, toque) → `node feature.mjs roteiros/X.json --saida NN_x.mp4` e `python3 som_feat.py NN_x.mp4 <semente>`. Usa perfil de demonstração (coleção, maestrias e elo preenchidos).
- Confira 3 a 6 quadros (gancho, luta, K.O., final) antes de publicar.

## Mídias (ferramentas antigas)

- Vídeos (1080×1920, 30 fps, sem áudio, ~16 s): `ferramentas/insta/video.mjs`, gerados quadro a quadro pelo próprio jogo. Antes, `node build.js` na raiz e, na primeira vez, `npm i` dentro de `ferramentas/insta`. Rode de dentro de `ferramentas/insta`:
  - Confronto: `node video.mjs confronto Curupira Medusa --saida ../../insta/g21_curupira_vs_medusa.mp4`
  - Recurso: `node video.mjs recurso Saci Iara --titulo "DUELO 1x1" --sub "Você contra uma lenda" --frases "Sua lenda é sorteada|Esquive e bloqueie na hora certa|Carregue o especial|Derrube o rival" --saida ../../insta/01_duelo_1x1.mp4`
  - `--seed N` troca a luta (mesma semente = mesma luta); `--arena N` fixa a arena. Se não houver nocaute em 150 s, ele pede outra semente.
  - Confira 2 ou 3 quadros antes de entregar. Sem `--saida`, o vídeo vai para `ferramentas/insta/tmp/` (fora do git).
- Card da lenda (1080×1350): `card.js` ainda não existe. **Enquanto não existir**, liste para o usuário quais `lenda_NNN.jpg` do calendário ainda faltam em `insta/`.
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
