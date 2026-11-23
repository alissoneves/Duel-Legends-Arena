# Skills do projeto — Etapa 1 — Plano de execução

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar as três skills (`criar-lenda`, `publicar-versao`, `postagem-instagram`) e as ferramentas de texto que elas usam (leitura das lendas, comparação de atributos, geração de legendas).

**Architecture:** Skills em `.claude/skills/<nome>/SKILL.md` (Markdown com frontmatter `name`/`description`). Ferramentas Node sem dependências em `ferramentas/`, testadas com `node --test`. As legendas são geradas a partir do `DATA` do jogo, e o teste confere que as 60 legendas de lenda do `insta/calendario.json` saem idênticas.

**Tech Stack:** Node 26 (`node:test`, `node:assert`), Markdown.

**Spec:** `docs/superpowers/specs/2026-11-23-skills-do-projeto-design.md`

A etapa 2 (card e vídeo com Playwright e ffmpeg) terá um plano próprio, escrito depois de extrair quadros dos vídeos atuais.

## Global Constraints

- Nada de dependência nova no `package.json` da raiz (é o do servidor).
- `index.html` da raiz é gerado: só `node build.js` mexe nele.
- Textos das skills e das ferramentas em português, curtos e diretos.
- Legendas: sem destaque especial para folclore; estilo das 3 primeiras postagens do calendário.
- Commits em português no padrão do repositório, terminando com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Push só com confirmação do usuário.

## Review Focus

- Nome com acento ou vírgula ("Cabeça de Cuia", "Nerojor, The Knight"): leitura e legenda devem funcionar; `numeroDa` acha pelo nome exato.
- Nome que não existe: as ferramentas devem parar com mensagem clara em português, não com erro de `undefined`.
- Golpe sem descrição depois dos dois-pontos: a linha B/C sai sem " — ".
- `03-personagens.js` com `DATA` em formato diferente (lenda nova gravada errada): `carregarLendas` deve falhar avisando, não devolver lista vazia.
- Caracteres UTF-8 (emojis, ç, ã): ler e escrever sempre em `utf8`.

---

### Task 1: Leitura das lendas (`ferramentas/dados.js`)

**Files:**
- Create: `ferramentas/dados.js`
- Create: `ferramentas/test/dados.test.js`
- Create: `.gitignore` (raiz) com `node_modules/`

**Interfaces:**
- Produces:
  - `carregarLendas(): Array<{n,r,e,s,p,A,B,C,spr}>` lê `src/js/03-personagens.js` (texto entre `const DATA=` e o primeiro `];` depois dele, via `JSON.parse`).
  - `numeroDa(nome: string): number` é a posição + 1 (o "Lenda nº" dos posts).
  - `acharLenda(nome: string)` devolve o objeto ou lança `Error('Lenda não encontrada: <nome>')`.
  - Exporta via `module.exports`.

- [ ] **Step 1: Escrever os testes**
  - `carregarLendas().length === 110`
  - `numeroDa('Saci') === 35`, `numeroDa('Iara') === 37`, `numeroDa('Zeus') === 22`
  - `acharLenda('Cabeça de Cuia').e === 'Água'`
  - `acharLenda('Nerojor, The Knight').r === 'Épico'`
  - `assert.throws(() => acharLenda('Ninguém'), /Lenda não encontrada: Ninguém/)`
- [ ] **Step 2:** `node --test ferramentas/test/` deve FALHAR (módulo não existe).
- [ ] **Step 3:** Implementar. Se `const DATA=` não for achado ou o JSON falhar, lançar `Error('Não consegui ler o DATA de src/js/03-personagens.js')`.
- [ ] **Step 4:** `node --test ferramentas/test/` deve PASSAR.
- [ ] **Step 5:** Commit "Ferramentas: leitura das lendas do jogo".

### Task 2: Comparar atributos por raridade (`ferramentas/raridade.js`)

**Files:**
- Create: `ferramentas/raridade.js`
- Create: `ferramentas/test/raridade.test.js`

**Interfaces:**
- Consumes: `carregarLendas()`.
- Produces:
  - `resumoRaridade(lendas): {[raridade]: {qtd, mediaSoma, min, max, media: [5 números]}}` onde soma = soma de `s`.
  - CLI `node ferramentas/raridade.js <Raridade> [ATQ DEF VEL ESP ESQ]` imprime o resumo da raridade. Com os 5 números, imprime também a soma proposta e as 3 lendas da raridade com a soma mais próxima.

- [ ] **Step 1: Testes**
  - quantidades: `{Comum:38, Raro:33, 'Épico':25, 'Lendário':14}`
  - `mediaSoma` de cada raridade está entre `min` e `max`
  - `media.length === 5`
- [ ] **Step 2:** rodar, deve FALHAR.
- [ ] **Step 3:** Implementar (CLI só quando `require.main === module`; raridade inválida mostra as válidas).
- [ ] **Step 4:** rodar, deve PASSAR; testar o CLI na mão: `node ferramentas/raridade.js Raro 80 70 70 80 75`.
- [ ] **Step 5:** Commit "Ferramentas: comparação de atributos por raridade".

### Task 3: Gerador de legendas (`ferramentas/insta/legenda.js`)

**Files:**
- Create: `ferramentas/insta/legenda.js`
- Create: `ferramentas/test/legenda.test.js`

**Interfaces:**
- Consumes: `acharLenda`, `numeroDa`.
- Produces:
  - `legendaLenda(post: number, nome: string, grupo: 'base'|'mito'|'br'): string`
  - `legendaConfronto(a: string, b: string): string`
  - `grupoDaLegenda(texto: string): 'base'|'mito'|'br'` (usado no teste e para ler o calendário)
  - CLI: `node ferramentas/insta/legenda.js lenda <post> "<Nome>" <grupo>` e `node ferramentas/insta/legenda.js confronto "<A>" "<B>"`.

Formato exato da legenda de lenda (linhas):
```
LENDA DO DIA #<post> ✨
<emoji> Lenda nº <numeroDa>: <Nome>!
<Raridade> · <Elemento>

A · <golpe A sem descrição>
B · <golpe B> — <descrição B>
C · <golpe C> — <descrição C>

ATQ x · DEF x · VEL x · ESP x · ESQ x

No Duel Legends Arena você não escolhe: o lutador é sorteado. Já tirou <Nome>? Conta aqui nos comentários! 👇
🎮 Jogue no navegador: link na bio

<hashtags>
```
- Golpe: texto antes do primeiro `:` (trim); descrição: depois (trim). Sem descrição → só o nome.
- Emojis: Água 🌊, Luz ☀️, Elétrico ⚡, Elfo 🍃, Fogo 🔥, Terra ⛰️, Natureza 🌿, Trevas 🌑, Humano ⚔️, Neutro 🎲, Gelo ❄️, Vampiro 🦇, Máquina ⚙️.
- Hashtags `base`: `#DuelLegendsArena #LendaDoDia #pixelart #indiegame #jogoindie #gamedevbrasil #jogobrasileiro`; `mito` = base + ` #mitologia #lendas`; `br` = base + ` #culturabrasileira`.
- Confronto:
```
⚔️ <A> x <B>! Quem vence essa luta?
Quem você acha que vence? Comenta aí 👇

🎮 Jogue grátis no navegador: link na bio

#DuelLegendsArena #jogoindie #pixelart #gamedevbrasil #indiegame
```

- [ ] **Step 1: Testes**
  - Para toda entrada `tipo: 'lenda'` do `insta/calendario.json`: `legendaLenda(p.n, p.nome, grupoDaLegenda(p.legenda)) === p.legenda`.
  - `legendaConfronto('Curupira','Medusa')` igual à legenda das 15:00 de `2026-11-24`.
  - `assert.throws(() => legendaLenda(1,'Ninguém','base'), /Lenda não encontrada/)`.
- [ ] **Step 2:** rodar, deve FALHAR.
- [ ] **Step 3:** Implementar. Grupo inválido lança `Error('Grupo deve ser base, mito ou br')`.
- [ ] **Step 4:** rodar, deve PASSAR (as 60 legendas idênticas). Se alguma diferir, olhar a diferença; se for ajuste feito à mão no calendário, registrar como exceção no teste com comentário, não mudar o formato.
- [ ] **Step 5:** Commit "Ferramentas: gerador de legendas do Instagram".

### Task 4: Skill `criar-lenda`

**Files:**
- Create: `.claude/skills/criar-lenda/SKILL.md`

Frontmatter: `name: criar-lenda`; `description:` "Use ao criar, adicionar ou desenhar uma lenda (personagem) nova no Duel Legends Arena — define kit, atributos e sprite e grava no web, nas traduções e no Godot."

Conteúdo, seguindo a seção "Skill 1" do spec:
1. Perguntar a ideia (nome, origem, raridade, elemento, estilo).
2. Listar os tipos de A/B/C que existem (copiar as listas do spec) e propor um kit; mostrar 1–2 lendas parecidas que já usam esses tipos como referência (`grep` no `03-personagens.js`).
3. Rodar `node ferramentas/raridade.js <Raridade> a b c d e` e mostrar a comparação antes de gravar.
4. Sprite: copiar a estrutura `spr` de uma lenda parecida e ajustar as cores.
5. Checklist de gravação: `src/js/03-personagens.js` (fim do `DATA`), `src/js/16a-idiomas.js` (golpes em en/es no `exact`), `godot/data/characters.json`, `godot/data/i18n.json`.
6. `node build.js`, `node --test ferramentas/test/` (atualizar o 110 do teste de dados), abrir o `index.html`.
7. Aviso fixo: lenda nova muda o sorteio, então é obrigatório usar a skill `publicar-versao` com `MIN_VER` subindo e redeploy no Render.

- [ ] **Step 1:** Escrever o SKILL.md.
- [ ] **Step 2: Verificar** contra a 2.1: cada arquivo do checklist existe e contém "Cabeça de Cuia" ou o golpe "Cuia d'Água" (`grep -l`). Esperado: os 4 arquivos.
- [ ] **Step 3:** Commit "Skills: criar-lenda".

### Task 5: Skill `publicar-versao`

**Files:**
- Create: `.claude/skills/publicar-versao/SKILL.md`

Frontmatter: `name: publicar-versao`; `description:` "Use ao publicar, lançar ou fechar uma versão nova do Duel Legends Arena (número da versão, CHANGELOG, build, commit e push para o GitHub Pages)."

Conteúdo, seguindo a seção "Skill 2" do spec, com os pontos exatos:
- `src/js/12-online.js`: `ver:'X.Y'` dentro de `helloMsg`
- `sw.js`: `const CACHE = 'dla-vXY'` (com letra no fim se for a mesma versão de novo, como `dla-v24b`)
- `CHANGELOG.md`: linha nova logo abaixo do cabeçalho da tabela, `| X.Y | resumo | servidor |`
- `README.md`: "Versão atual: **X.Y** (servidor S)."
- Servidor: `server.js` `const VERSION`, `package.json` `version`, `MIN_VER` quando todos precisam atualizar. Lembrar o redeploy no Render (plano grátis: primeira conexão lenta).
- `node build.js`, `node --test ferramentas/test/`, `git diff --stat`, commit "Versão X.Y: resumo", e pedir confirmação antes do `git push`.

- [ ] **Step 1:** Escrever o SKILL.md.
- [ ] **Step 2: Verificar** com `grep` que cada ponto existe hoje com o valor atual: `ver:'2.4'`, `dla-v24b`, `| 2.4 |`, `Versão atual: **2.4**`, `VERSION = '2.0'`, `MIN_VER = 2.1`.
- [ ] **Step 3:** Commit "Skills: publicar-versao".

### Task 6: Skill `postagem-instagram`

**Files:**
- Create: `.claude/skills/postagem-instagram/SKILL.md`

Frontmatter: `name: postagem-instagram`; `description:` "Use para criar postagens, legendas, calendário, cards ou vídeos do Instagram do Duel Legends Arena."

Conteúdo, seguindo a seção "Skill 3" do spec:
- Calendário: `insta/calendario.json`, um objeto por dia com `dia` e os horários `09:00` (lenda), `15:00` (vídeo) e `18:00` (lenda). Continuar a numeração `#N` e a data do último dia.
- Escolher lendas que ainda não foram postadas, alternando origens, sem dar destaque ao folclore. Grupo das hashtags: `br` para folclore brasileiro, `mito` para mitologias e lendas de outros lugares, `base` quando nenhum se aplica.
- Legendas sempre por `node ferramentas/insta/legenda.js`, nunca à mão.
- Arquivos: `lenda_NNN.jpg` (NNN = número do post com 3 dígitos); vídeos `NN_recurso.mp4` ou `gNN_a_vs_b.mp4` (minúsculas, espaços viram `_`, acentos mantidos).
- Mídias: enquanto a etapa 2 não estiver pronta, avisar quais imagens e vídeos faltam.
- Postagem manual pelo usuário; commit "Instagram: …".

- [ ] **Step 1:** Escrever o SKILL.md.
- [ ] **Step 2: Verificar:** gerar a legenda do post #62 com uma lenda ainda não postada e comparar o formato visualmente com o post #61 do calendário.
- [ ] **Step 3:** Commit "Skills: postagem-instagram".

### Task 7: Fechamento

- [ ] **Step 1:** `node --test ferramentas/test/` passa por inteiro.
- [ ] **Step 2:** Conferir que as 3 skills aparecem para o Claude Code (frontmatter válido: `---`, `name`, `description`, `---`).
- [ ] **Step 3:** Commit dos documentos (`docs/superpowers/…`) se ainda não estiverem commitados. Perguntar ao usuário antes do push.
