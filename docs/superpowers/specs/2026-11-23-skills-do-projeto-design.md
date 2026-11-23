# Skills do projeto Duel Legends Arena — desenho

Data: 2026-11-23

## Por quê

O dono do projeto trabalha com o Claude em lugares diferentes (nuvem, notebook, tablet) e as rotinas que se repetem — criar lenda, publicar versão, postar no Instagram — dependiam da memória de sessões anteriores. Os scripts que geraram as imagens e vídeos do Instagram ficaram em pastas temporárias de sessões na nuvem e se perderam. O objetivo é que qualquer sessão, em qualquer máquina, faça essas três coisas do mesmo jeito, só abrindo o projeto.

## Objetivos

1. Três skills do Claude Code dentro do repositório, em `.claude/skills/`, commitadas:
   - `criar-lenda`
   - `publicar-versao`
   - `postagem-instagram`
2. Ferramentas guardadas no projeto para gerar o card da lenda (`lenda_NNN.jpg`) e os vídeos (`.mp4`) do Instagram.

## Fora do escopo

- Postar automaticamente no Instagram (a postagem continua manual).
- Mudar o jogo, o servidor ou o visual dos posts.
- Testar o porte Godot (as skills só mantêm os dados dele em dia).

## O que seria um fracasso

- Uma lenda nova que quebra o online (versões diferentes sorteando lendas diferentes) por esquecer o `MIN_VER`.
- Uma lenda que aparece no web e não no Godot, ou sem tradução dos golpes.
- Ferramentas de mídia que sujam o site publicado (ex.: `node_modules` commitado ou servido pelo GitHub Pages).
- Textos do Instagram fora do estilo das três postagens já publicadas, ou dando destaque especial ao folclore.

## Restrições

- Notebook Windows 10, Node 26, Python 3.12 sem bibliotecas extras. Sem ffmpeg instalado no sistema.
- O usuário autorizou instalar Playwright (com Chromium) e ffmpeg **via npm, dentro do projeto**.
- O `package.json` da raiz é o do servidor (Render). Não recebe dependências novas.
- O `index.html` da raiz é gerado por `node build.js`; nunca editar direto.
- Commits seguem o padrão em português já usado ("Versão X.Y: …", "Instagram: …").

## Estrutura

```
.claude/skills/
  criar-lenda/SKILL.md
  publicar-versao/SKILL.md
  postagem-instagram/SKILL.md
ferramentas/insta/
  package.json          (playwright, ffmpeg-static)
  .gitignore            (node_modules, saídas temporárias)
  card.html             (modelo do card 1080x1350)
  card.js               (node card.js <n> <nomeDaLenda> <dd/mm> -> insta/lenda_NNN.jpg)
  video.js              (grava luta/modo do jogo e monta .mp4 vertical)
  LEIA-ME.md
.gitignore (raiz)       (node_modules/)
```

## Skill 1 — criar-lenda

Roteiro + checklist para adicionar uma lenda, com base na 2.1 (Nerojor e Cabeça de Cuia):

1. Conversar a ideia: nome, origem, raridade, elemento, estilo de luta.
2. Escolher o kit entre os tipos que já existem no motor (não inventar tipos novos sem código):
   - A: `melee` ou `proj` com `kind` em orb, star, web, spark, fire, shard, arrow, bubble, goo
   - B: zone, shield, blink, stealth, decoy, heavy, stun, root, dash, spin, mark, pull, volley, buff, summon, copy
   - C: flurry, beam, wave, fortress, rage, nova, storm, cone, heal, summon, trap, bigzone, swap, drain, copy
3. Atributos `s` = [ATQ, DEF, VEL, ESP, ESQ]: comparar com a média e a soma das lendas da mesma raridade e mostrar a comparação ao usuário antes de gravar.
4. Sprite `spr` (human ou creature), seguindo os campos já usados.
5. Gravar em todos os lugares:
   - `src/js/03-personagens.js` (`DATA`, no fim da lista — o número "Lenda nº" é a posição + 1)
   - `src/js/16a-idiomas.js` (nome dos golpes em inglês e espanhol; nome da lenda se fizer sentido)
   - `godot/data/characters.json` e `godot/data/i18n.json`
6. Rodar `node build.js` e abrir o jogo para ver o sprite e os golpes.
7. Avisar que lenda nova muda o sorteio: exige versão nova (skill `publicar-versao`) com `MIN_VER` do servidor subindo e redeploy no Render.

## Skill 2 — publicar-versao

1. Definir o número (X.Y) e o resumo com o usuário.
2. Atualizar: `ver` em `src/js/12-online.js` (helloMsg), `CACHE` em `sw.js`, linha nova no topo da tabela do `CHANGELOG.md`, "Versão atual" no `README.md`.
3. Se o servidor mudou: `VERSION` em `server.js`, `version` no `package.json`, coluna Servidor no CHANGELOG. Se a mudança exige que todos atualizem (ex.: lendas novas): subir `MIN_VER` e lembrar o redeploy no Render (plano grátis).
4. Se o Godot recebeu a mudança, citar no CHANGELOG.
5. `node build.js`, conferir se o `index.html` mudou.
6. Commit "Versão X.Y: resumo" e push para `main` (GitHub Pages publica). Pedir confirmação antes do push.

## Skill 3 — postagem-instagram

- Fonte de verdade: `insta/calendario.json` (2 lendas às 09:00 e 18:00 + 1 vídeo às 15:00 por dia).
- Textos seguem as 3 primeiras postagens já publicadas. Modelos:
  - Lenda: "LENDA DO DIA #N ✨ / emoji do elemento + Lenda nº X: Nome! / Raridade · Elemento / golpes A, B, C (B e C com descrição curta) / atributos / chamada do sorteio / link na bio / hashtags fixas".
  - Vídeo de recurso e vídeo de confronto ("X x Y! Quem vence essa luta?").
- Sem destaque especial para folclore (nem no texto, nem nas hashtags, nem na escolha das imagens).
- A skill: lê o calendário, continua a numeração, gera os textos, chama `card.js` / `video.js` para as mídias que faltam e atualiza o calendário. Faz commit "Instagram: …".

## Ferramentas de mídia

### Card (`card.js`)
- Modelo HTML 1080x1350 imitando os cards atuais: faixa amarela "LENDA DO DIA #N · dd/mm" em fonte pixelada, selos de raridade e elemento coloridos, nome grande amarelo com contorno, sprite ampliado com sombra, painel de atributos com barras na cor do elemento, painel A/B/C, rodapé "Lenda nº X" e "DUEL LEGENDS ARENA".
- O sprite é desenhado pelo próprio código do jogo (`buildProc` e afins carregados do `index.html`), para ficar igual ao jogo.
- Fontes: Google Fonts parecidas (a definir pelo builder comparando com `insta/lenda_002.jpg`). O resultado deve ficar **parecido**, não idêntico.
- Playwright tira o screenshot e salva JPG em `insta/`.

### Vídeo (`video.js`)
- Abre o `index.html` no Chromium do Playwright, coloca o jogo numa luta escolhida (lenda x lenda ou modo) com bots dos dois lados, grava quadros e monta MP4 vertical com `ffmpeg-static`.
- Layout de referência: extrair quadros dos vídeos atuais (`insta/g01_…mp4`, `insta/01_…mp4`) com o ffmpeg depois da instalação, e copiar o formato (tamanho, faixas de texto, duração).
- Pode exigir um "modo gravação" acionado por parâmetro na URL (ex.: `?gravar=...`) no código do jogo. Se exigir, essa é a única mudança no jogo, e ela não deve aparecer para jogadores normais.

## Ordem de trabalho

1. Etapa 1: `.gitignore`, as três skills, textos do Instagram funcionando.
2. Etapa 2: ferramentas de card e vídeo, depois ligar à skill do Instagram.

## Deixado para quem construir

- Texto exato de cada SKILL.md (curto, direto, em português).
- Escolha das fontes do card e detalhes do modo gravação.
