# Servidor online do Duel Legends Arena

Um arquivo só (`server.js`), sem dependências. Ele cuida do saguão, das salas (com ou sem senha), da partida rápida 1x1 e do sorteio igual para todos. Durante a luta, repassa as mensagens: quem criou a sala simula a partida e manda o estado para os outros cerca de 20 vezes por segundo, e os outros mandam só os comandos.

## Colocar no ar de graça (dá para fazer pelo tablet)

1. No GitHub, abra o repositório **Duel-Legends-Arena** e envie a pasta `servidor` (com `server.js` e `package.json`). Pelo navegador: **Add file → Upload files**.
2. Crie uma conta em **render.com** (pode entrar com o GitHub).
3. Clique em **New → Web Service** e escolha o repositório.
4. Preencha:
   - **Name:** `duel-legends-arena` (o jogo já procura `wss://duel-legends-arena.onrender.com`)
   - **Root Directory:** `servidor`
   - **Runtime:** Node
   - **Build Command:** deixe vazio (ou `echo ok`)
   - **Start Command:** `node server.js`
   - **Plano:** Free
5. Clique em **Deploy**. Quando terminar, abra o endereço que o Render mostrar: deve aparecer "servidor online funcionando".

Se o nome `duel-legends-arena` já estiver em uso no Render, use outro nome e, no jogo, toque em **ONLINE → SERVIDOR** e cole o endereço trocando `https://` por `wss://`.

**Plano grátis:** o servidor "dorme" depois de uns 15 minutos sem ninguém. A primeira conexão depois disso demora até 1 minuto. Para testes com amigos isso basta; no lançamento, use um plano pago ou outro serviço.

## Rodar no computador

```
cd servidor
node server.js
```

Depois abra o jogo com `?server=ws://localhost:8080` no fim do endereço.

## Mensagens (para quem for programar)

Todas em JSON pelo WebSocket. Principais: `hello`, `list`, `create`, `join`, `leave`, `slot`, `ready`, `quick` (chat pronto), `start`, `quickmatch`, `prepready`, `inp` (comandos → dono da sala), `snap` (estado do dono → todos), `end`. O servidor responde com `welcome`, `rooms`, `room`, `chat`, `start` (com a semente do sorteio), `prep`, `go`, `aborted` e `left`.

## Próximos passos de segurança

- Hoje quem criou a sala simula a luta, então essa pessoa poderia trapacear. Para a ranqueada online, a luta deve ser simulada no servidor (por exemplo, o Godot rodando sem tela).
- Recompensas (GD, maestria, elo) ainda são guardadas no aparelho de cada jogador. No jogo final, elas devem ficar no servidor, com login.
