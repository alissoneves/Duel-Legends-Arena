---
name: unslop
description: Use quando pedirem para "unslop", polir, limpar, organizar ou redesenhar uma tela de JOGO (menu, tela inicial, loja, HUD, resultado, coleção) que parece genérica, feita por IA ou bagunçada — botões arco-íris, tudo com o mesmo peso, textos amontoados ou sobrepostos, pixel art borrada, estilos de arte misturados, emoji no lugar de ícone, efeitos que piscam sem motivo, HUD que atrapalha a luta, promoções e contadores que pressionam. Para jogos em canvas, pixel art, Godot ou engine; não para sites.
license: CC-BY-4.0
metadata:
  author: Damir Sokolovsky (original, para web); adaptado para jogos no Duel Legends Arena
  original: https://github.com/heydamir/unslop
---

# Unslop para jogos

Adaptado do **unslop** de Damir Sokolovsky ([@heydamir](https://x.com/heydamir)), licença CC BY 4.0. Esta versão troca as regras de interface web por regras de interface de jogo. Mantenha este crédito em qualquer cópia.

Em site, slop é brilho e gradiente espalhados por tudo. Em jogo, o slop tem outra cara: **cor sem significado, tudo gritando ao mesmo tempo e um estilo que poderia ser de qualquer jogo.** Cada botão de uma cor, dez ações com o mesmo peso, texto por cima de sprite, sprite borrado ao lado de sprite nítido, pulso e brilho em coisas que não pedem nada ao jogador.

Unslop de jogo **mantém o jogo** — regras, equilíbrio, modos, conteúdo, estilo de arte — e torna cada cor, tamanho, posição e efeito deliberado.

**Onde vai a riqueza.** No jogo, ela vai para o que se joga e se coleciona: lutadores, golpes, impacto, recompensa. Menus e HUD servem a isso. Fonte pixelada, MAIÚSCULAS em títulos, exclamação num K.O. e "juice" no combate **são do gênero, não são slop** — slop é usar isso em todo lugar, sem hierarquia.

## Como rodar

1. **Ver a tela rodando.** Ache o código que desenha a tela e tire capturas do jogo de verdade (no Duel Legends Arena, veja [Neste projeto](#neste-projeto)). Julgue o que o jogador vê, não só o código. Capture também no tamanho de celular se o jogo roda em celular.
2. **Auditar.** Passe por [references/sinais.md](references/sinais.md) e liste cada sinal, uma linha cada, com onde ele mora (arquivo/função).
3. **Decidir o tamanho da mudança.**
   - **Muito slop** (sinais em hierarquia, cor, arte e texto): os nove passes.
   - **Pouco slop**: só o que a auditoria achou, mantendo paleta, fontes e layout. Ideias maiores vão como sugestão no relatório.
   - **Sem slop**: diga isso e sugira no máximo três ajustes com valores exatos. Não mude tela boa só para mudar.
4. **Direção, e parar.** Escreva as cinco linhas abaixo, mostre auditoria + direção ao usuário e **espere a resposta antes de editar** (use a ferramenta de perguntas se houver). Só pule a espera se o usuário já disse para fazer direto.
5. **Nove passes, em ordem**, cada um na tela inteira antes do próximo.
6. **Checar.** Rode o checklist, capture de novo e compare com a auditoria. O que sobrou da lista, corrija. No máximo três rodadas de captura.
7. **Relatório**: direção, poucas linhas por passe, e o que ficou como sugestão.

Valores de partida para cada passe estão em [references/medidas.md](references/medidas.md).

## Direção

Cinco linhas curtas, tiradas do próprio jogo, nunca de moda.

- **Jogo.** O que é, para quem, onde se joga (celular deitado, PC, controle).
- **Caráter.** Duas ou três palavras concretas, como `rápido, malandro, de fliperama` ou `sombrio, lento, tenso`. Proibido: épico, incrível, moderno, clean, premium — servem para qualquer jogo.
- **Mundo.** De onde vem o jogo: arena de fliperama, livro de lendas, taverna, nave. Dá o tom dos neutros e das molduras.
- **Momentos.** Uma ou duas coisas por tela que recebem cor forte e detalhe — o lutador em destaque, a carta rara, o botão de lutar. Escreva quais.
- **Assinatura.** Um detalhe que só este jogo teria, usado com constância. Um só.

## 1. Grade de pixels

- Tudo em coordenadas inteiras da resolução lógica. Nada em meio pixel, nada escalado por fator quebrado — sprite e fonte pixel só em 1×, 2×, 3×.
- Um só tamanho de pixel na tela. Sprite em 2× ao lado de sprite em 3× é sinal de slop, a não ser que o maior seja o destaque de propósito.
- Espaços da escala (2, 4, 6, 8, 12, 16 px lógicos). Coisas iguais com tamanhos iguais: botões irmãos com a mesma altura, cards com o mesmo respiro.
- Alinhamento: colunas e linhas de base comuns. **Nada sobreposto sem querer** — botão em cima de sprite, texto cortando moldura, painel encostado na borda.

## 2. Hierarquia e fluxo

- **Uma ação principal por tela**, a maior e mais forte (na tela inicial, é lutar/jogar). No máximo duas secundárias com peso médio. O resto é discreto e agrupado.
- Agrupe por assunto: jogar, coleção/progresso, loja, sistema (opções, conta, som). Grupo mais perto de si do que do vizinho.
- Do abrir o jogo até lutar: no máximo dois toques.
- Informação de status (moedas, nível, coleção) fica num lugar fixo e calmo, não espalhada pelos cantos.

## 3. Cor

- Cor em jogo é linguagem. Separe papéis: **neutros** (fundo, painéis, molduras, botões comuns), **uma cor de ação** (botão principal, seleção) e **cores de significado** (raridade, elemento, time, vida, dano, cura, moeda).
- Cor de significado só aparece onde significa aquilo. Se roxo é "épico", botão roxo de "Mochila" mente para o jogador.
- Botões comuns usam o neutro. Botão de cor forte só para a ação principal e para o que tem significado.
- Sem gradiente de matiz em painel, sem brilho colorido em moldura, sem contorno neon em tudo. Um tom mais claro/escuro do mesmo neutro dá profundidade.
- Texto sobre fundo animado ou arena sempre com painel ou contorno de 1 px. Contraste do texto ≥ 4,5:1.

## 4. Ícones e arte

- Um estilo de arte: mesmo tamanho de pixel, mesma paleta, mesmo contorno. Nada de arte lisa com antialias, gradiente suave ou foto ao lado de pixel art.
- Emoji não entra no canvas do jogo. Vira ícone pixel do conjunto do jogo ou some.
- Ícones de um tamanho, alinhados, com a cor do texto que acompanham ou da sua cor de significado.
- Arte gerada por IA com detalhes que não batem com o resto (mãos estranhas, ruído, pixels de tamanhos variados) é refeita ou fica fora.

## 5. Fontes

- Fonte pixelada de exibição (títulos, botões curtos, números grandes) + uma fonte legível para frases. No máximo duas.
- MAIÚSCULAS são aceitas em títulos e botões curtos. Descrições, dicas e frases em texto normal.
- Poucos tamanhos (três ou quatro) e o mínimo legível no celular (ver medidas). Hierarquia por tamanho e cor.
- Números em um formato só por tela (`1.250 GD`, não `1250 GD` ao lado de `1.2k`).

## 6. Texto e voz

- Menus falam calmo e curto: `Jogar`, `Loja`, `Coleção`. Exclamação só em momentos de jogo — `VITÓRIA!`, `K.O.`, lenda nova.
- Nada de placeholder visível como `dia(s)`, `x1`, `[nome]`. Escreva o plural certo.
- Rótulos dizem o que acontece: `Resgatar dia 1`, não `PRÓXIMO`.
- Dicas de controle aparecem onde ajudam (tutorial, pausa, primeira luta), não como rodapé permanente.
- Sem promessa ou dado inventado.

## 7. HUD e leitura em jogo

- O jogador lê o HUD em fração de segundo: vida, energia/carga e tempo nas bordas, sempre no mesmo lugar.
- O centro da tela é da ação. Nada de painel parado cobrindo onde se luta.
- Números flutuantes curtos, com contorno, e somem rápido. Rótulos de status (`DOT`, `ATORDOADO`) pequenos e iguais entre si.
- Botões de toque: grandes o suficiente para o polegar e longe de onde se arrasta.

## 8. Feedback e juice

- Juice vai onde o jogo acontece: acerto, dano, K.O., recompensa, sorteio. Pausa de impacto, tremor, flash, partículas — curtos e proporcionais ao evento.
- Nos menus: resposta de toque rápida (botão afunda 1–2 px, som), troca de tela rápida.
- Pulso, brilho contínuo ou balanço só no que **pede ação de verdade** agora (prêmio pronto para resgatar). Um por tela, no máximo.
- Nada que fique piscando para sempre, nada que tire a leitura (tremor forte em menu, flash em tela de texto). Respeite opção de reduzir efeitos se o jogo tiver.

## 9. Recompensa e monetização honestas

- Preço riscado só se o preço cheio existiu de verdade. Contador de tempo só se o prazo é real.
- Bolinha/selo de notificação só quando há algo para fazer ali. Selo em tudo vira ruído.
- O que é pago e o que é grátis fica claro. Nada de layout que empurra a compra no lugar de jogar.

## Não faça

- Não mude regras, equilíbrio, modos, nomes das lendas nem a ordem das coisas que o jogador já conhece, a não ser que o usuário peça.
- Não troque o estilo de arte do jogo nem o nome/logo. Logo com defeito técnico (borrado, desalinhado) pode ser corrigido.
- Não tire feedback de combate para "limpar" — juice em combate é conteúdo.
- Não troque um enfeite por outro.
- Não invente recursos, números ou prêmios.

## Checklist

- [ ] Direção escrita e seguida em todos os passes
- [ ] Coordenadas inteiras, um tamanho de pixel, nada borrado, nada sobreposto sem querer
- [ ] Uma ação principal clara; o resto agrupado e mais discreto
- [ ] Cores com papel: neutros, uma cor de ação, cores de significado só onde significam
- [ ] Nenhum emoji no canvas, um estilo de arte
- [ ] Duas fontes no máximo, três ou quatro tamanhos, nenhum abaixo do mínimo legível
- [ ] Sem placeholders, exclamação só em momentos de jogo
- [ ] HUD nas bordas, centro livre, texto legível sobre a arena
- [ ] Juice no jogo; nos menus, no máximo um elemento pulsando e só se pede ação
- [ ] Preços, prazos e selos verdadeiros
- [ ] Teste do molde: trocando o nome do jogo, a tela serviria a outro jogo? Se sim, reforce a assinatura e os momentos

## Neste projeto

Duel Legends Arena: jogo web em canvas 480×270 (pixel art, escalado com `image-rendering: pixelated`), fontes Press Start 2P (`PX`) e Pixelify Sans (`PS`), jogado em celular deitado e no PC.

- Código em `src/js/` (cada tela é uma função `render…`, ex.: `renderTitle` em `35-render.js`; botões com `btn()` em `18-ui-botoes.js`; texto com `text()` em `19-texto.js`). **Nunca edite o `index.html` da raiz** — rode `node build.js` depois de mudar `src/`.
- Capturas: `node .claude/skills/unslop/scripts/capturar.mjs <pasta-saida> title modes shop` (estados de `state`; `luta:N` começa uma luta de teste com a lenda N; `--celular` captura em 844×390). Precisa de `playwright` ou `playwright-core`; o script diz como instalar se faltar. Usa o Edge ou Chrome já instalado.
- Textos passam por `tr()`: mudou um texto, atualize `src/js/16a-idiomas.js` (inglês e espanhol).
- Cores de significado já existentes: elemento (`ELCOL` em `01-elementos.js`), raridade das lendas (`RAR` em `03-personagens.js`) e dos itens (`RARI` em `08-itens-loja-e.js`), moedas GD (amarelo), Pó (roxo), Gemas (azul). Não gaste essas cores em botões comuns.
- Mudança visual não muda a versão online, mas publicar segue a skill `publicar-versao`.
- **Padrões já fixados** (siga em telas novas):
  - Título da tela: amarelo `#ffd23f`, 12 px, centralizado, com contorno.
  - Botão comum: `#2e3358` com texto branco. Ação principal: amarelo `#ffd23f` com texto escuro, uma por tela. Prêmio pronto para resgatar: verde `#8ef0a0`. Destrutivo: vermelho escuro.
  - VOLTAR sempre em `btn(id,8,244,80,20,'VOLTAR','#2e3358','#ffffff',7)`; botão de navegação do canto direito em `W-88,244,80,20`.
  - Plural com `pl(n,'dia','dias')` (em `19-texto.js`), nunca `dia(s)`. Se mudar o texto, ajuste o padrão em `16a-idiomas.js`.
  - Assinatura: o dado do sorteio (logo e botão JOGAR).
  - Tela inicial: JOGAR é a única ação grande; o resto fica na barra de abas (`tab()` + ícones 8×8 de `ICONS`/`icon()` em `18-ui-botoes.js`). Ícone novo entra em `ICONS`, no mesmo estilo (1 cor, 8×8, desenhado em 2×).
  - Resolução: o canvas desenha em `K` pixels reais por pixel do jogo (`fit()` em `00-inicio.js`; `render()` aplica `setTransform(K…)`). Continue desenhando em coordenadas 480×270; quem ler pixels do canvas (`createImageBitmap`, `getImageData`) multiplica por `K`.
  - Sprites passam por `finishSprite()` (luz de cima à esquerda) em `03-personagens.js`; o original fica em `SPR[id].raw` para comparar.
