---
name: publicar-versao
description: Use ao publicar, lançar ou fechar uma versão nova do Duel Legends Arena — número da versão em todos os lugares, CHANGELOG, README, build, commit e push para o GitHub Pages (e servidor no Render quando preciso).
---

# Publicar uma versão

O push para `main` publica o jogo na hora no GitHub Pages (https://alissoneves.github.io/Duel-Legends-Arena/). Por isso: tudo conferido antes, e **push só com confirmação do usuário**.

## 1. Combinar com o usuário

- Número: X.Y (veja o atual em `README.md`, "Versão atual"). Mudança grande → X+1.0; o resto → X.Y+1.
- Resumo de uma linha do que mudou (vai no CHANGELOG e no commit).
- O servidor mudou? Todos os jogadores precisam atualizar (ex.: lenda nova, mudança no sorteio ou nas mensagens online)?

## 2. Atualizar o número (jogo)

- [ ] `src/js/12-online.js`: `ver:'X.Y'` dentro de `helloMsg`.
- [ ] `godot/scripts/main.gd`: `"ver": "X.Y"` no `hello` (se o Godot recebeu a mudança).
- [ ] `sw.js`: `const CACHE = 'dla-vXY'` (ex.: 2.5 → `dla-v25`). Se republicar a mesma versão, acrescente uma letra (`dla-v24b`). Sem isso, quem instalou o app continua com a versão velha.
- [ ] `CHANGELOG.md`: linha nova na tabela, **logo acima da linha da versão mais recente** (a tabela tem 1.0–1.5 em ordem crescente e depois as versões novas, da mais nova para a mais velha): `| X.Y | resumo | versão do servidor |`. Se o Godot foi junto, terminar o resumo com "; Godot junto" e atualizar a linha `godot/` em "Pastas".
- [ ] `README.md`: `Versão atual: **X.Y** (servidor S).`

## 3. Servidor (só se mudou ou se todos precisam atualizar)

- [ ] `server.js`: `const VERSION = 'S'`.
- [ ] `package.json`: `"version": "S.0"`.
- [ ] `server.js`: `const MIN_VER = X.Y;` quando versões antigas não podem mais jogar online (obrigatório com lenda nova), com o comentário explicando o motivo.
- [ ] Lembrar o usuário: **redeploy no Render** depois do push (o servidor está no plano grátis: dorme após ~15 min e a primeira conexão demora até 1 minuto). Se o `MIN_VER` subiu e o servidor não for republicado, nada muda; se o servidor for republicado antes do jogo, os jogadores ficam sem online até o GitHub Pages atualizar.

## 4. Montar e conferir

```
node build.js
node --test ferramentas/test/
git diff --stat
```

- O `index.html` precisa aparecer no diff (ele é gerado pelo `build.js`; nunca edite direto).
- Confira com `grep` que o número novo está em todos os lugares acima e que o antigo não sobrou: `grep -rn "X.Y-antiga" src/js/12-online.js sw.js README.md godot/scripts/main.gd`.
- Abra o `index.html` no navegador e faça uma partida rápida contra bot.

## 5. Commit e push

```
git add -A
git commit -m "Versão X.Y: resumo"
```

Mensagem em português, no padrão do histórico (`git log --oneline`), com a linha `Co-Authored-By` pedida pelo ambiente.

**Pergunte antes de `git push`.** Se estiver num branch, combine o merge em `main` com o usuário. Depois do push: GitHub Pages atualiza em 1–2 minutos; se o servidor mudou, lembrar o redeploy no Render.

## 6. Zip para o itch.io (sempre, sem esperar pedido)

```
node ferramentas/zip-itch.js
```

- Gera `DuelLegendsArena_web_vX.Y.zip` na pasta acima do repositório (fora do git), com a versão do README. Se já existir, é substituído.
- Contém `index.html`, ícones, `manifest.webmanifest` e `privacidade.html`. Para mudar a lista, edite `ARQUIVOS` no script.
- Ao terminar, diga ao usuário o caminho do zip para ele subir no itch.io.
- Gere de novo sempre que o jogo mudar depois do zip, mesmo sem versão nova (ex.: correção na mesma versão).
