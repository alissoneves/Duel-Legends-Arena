---
name: criar-lenda
description: Use ao criar, adicionar ou desenhar uma lenda (personagem) nova no Duel Legends Arena — define kit de golpes, atributos e sprite e grava no jogo web, nas traduções e no Godot.
---

# Criar uma lenda nova

Uma lenda nova mexe em 4 arquivos e muda o sorteio do online. Siga a ordem e não pule o checklist.

## 1. Conversar a ideia

Pergunte (uma coisa por vez) o que faltar: nome, de onde vem (mitologia, folclore, criação original), raridade (Comum, Raro, Épico, Lendário), elemento e estilo de luta (perto, longe, controle, tanque...).

Elementos que existem: Elétrico, Água, Luz, Humano, Terra, Natureza, Fogo, Trevas, Gelo, Máquina, Elfo, Vampiro, Neutro. Elemento novo exige código e tradução novos: evite.

## 2. Kit de golpes

Use só tipos que o motor já tem (tipos novos exigem código em `src/js/26-poderes.js`):

- **A** (ataque básico): `{"t":"melee","r":26}` ou `{"t":"proj","kind":K}` com K em orb, star, web, spark, fire, shard, arrow, bubble, goo
- **B**: zone, shield, blink, stealth, decoy, heavy, stun, root, dash, spin, mark, pull, volley, buff, summon, copy
- **C** (especial): flurry, beam, wave, fortress, rage, nova, storm, cone, heal, summon, trap, bigzone, swap, drain, copy

Para ver como um tipo se comporta, procure lendas que já o usam: `grep -o '"B": "pull"[^}]*' src/js/03-personagens.js` ou leia algumas entradas do `DATA`.

Os textos dos golpes vão em `p`, um por golpe, no formato `"Nome do Golpe: descrição curta"`. A descrição é opcional (muitos A não têm). Ela aparece nas legendas do Instagram.

## 3. Atributos

`s` = [ATQ, DEF, VEL, ESP, ESQ]. **Regra do jogo: a soma é sempre 375**, em qualquer raridade. A raridade muda o perfil, não o total.

Rode e mostre ao usuário antes de gravar:

```
node ferramentas/raridade.js <Raridade> ATQ DEF VEL ESP ESQ
```

Ele mostra a média da raridade, avisa se a soma não for 375 e lista as 3 lendas de perfil mais parecido.

## 4. Sprite

Copie o `spr` de uma lenda parecida e ajuste as cores. Humanos: `{"t":"human", "o": roupa, "h": cabelo, "s": pele, "x": detalhe, "st": chapéu/estilo, "b": corpo, "w": arma, "cape"?: capa}`. Criaturas: `{"t":"creature", "o", "p", "f": [traços]}`. Use valores que já aparecem no `DATA` (o desenho é feito por `buildProc` no mesmo arquivo).

## 5. Gravar (checklist)

- [ ] `src/js/03-personagens.js`: nova entrada **no fim** do `DATA` (nunca no meio: a posição é o "Lenda nº" e muda o sorteio). Formato de referência: a entrada de "Cabeça de Cuia".
- [ ] `src/js/16a-idiomas.js`: no `exact`, o **nome** de cada golpe (a parte antes dos dois-pontos) com inglês e espanhol: `"Cheia do Rio":["River Flood","Crecida del Río"]`. Nomes de lendas e descrições não são traduzidos.
- [ ] `godot/data/characters.json`: a mesma entrada, no fim da lista.
- [ ] `godot/data/i18n.json`: o mesmo dicionário do `16a-idiomas.js`. Confira que ficaram iguais:
  ```
  node -e "const f=require('fs');const t=f.readFileSync('src/js/16a-idiomas.js','utf8').split(/\r?\n/)[3];console.log(JSON.stringify(JSON.parse(t.slice(t.indexOf('{'),t.lastIndexOf('}')+1)))===JSON.stringify(JSON.parse(f.readFileSync('godot/data/i18n.json','utf8')))?'i18n igual':'i18n DIFERENTE')"
  ```
- [ ] `godot/LEIA-ME.md` e comentário do `MIN_VER` em `server.js`: atualizar a contagem de lendas.
- [ ] `ferramentas/test/dados.test.js`: atualizar o total (110 → novo total).

## 6. Conferir

```
node build.js
node --test ferramentas/test/
```

Abra o `index.html` no navegador e veja a lenda no sorteio/coleção: sprite, golpes e textos em pt/en/es.

## 7. Aviso obrigatório

Lenda nova muda o sorteio: jogadores com versões diferentes sortearão lendas diferentes. Sempre termine indicando a skill `publicar-versao`, com **`MIN_VER` subindo no `server.js`** e **redeploy do servidor no Render**. Não publique uma lenda sem isso.
