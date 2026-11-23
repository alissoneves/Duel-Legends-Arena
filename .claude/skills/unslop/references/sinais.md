# Sinais de slop em telas de jogo

Passe por todos os grupos e anote cada sinal com onde ele mora. Cada linha traz o sinal → a correção.

## Hierarquia e layout

- Muitos botões com o mesmo peso, sem uma ação principal → uma ação grande e forte, duas médias, o resto discreto e agrupado
- Botões de tamanhos quase iguais (ex.: 96 e 100 de largura) lado a lado → mesmo tamanho ou diferença clara de propósito
- Elementos sobrepostos sem querer: botão em cima de sprite, rótulo cortando moldura, painéis que se tocam → reposicionar na grade, com respiro
- Estatísticas soltas nos cantos (moedas, vitórias, coleção, elo) → uma barra de status fixa e calma
- Rodapé permanente com todos os controles → dica no tutorial, na pausa ou na primeira luta
- Tela cheia de coisas da mesma importância (molde "painel de controle") → escolher o que o jogador faz aqui e organizar em volta disso
- Mais de dois toques até lutar → encurtar o caminho

## Cor

- Botões arco-íris (cada um de uma cor, sem significado) → neutro para os comuns, uma cor de ação para o principal
- Cor de raridade, elemento ou moeda usada em botão comum (ex.: roxo de "épico" na mochila) → neutro; a cor volta só onde significa
- Cards irmãos cada um com uma borda de cor diferente, sem significado → uma moldura neutra; a cor vai no conteúdo (o modo, a lenda)
- Gradiente de matiz em painel, brilho colorido, contorno neon em tudo → neutro com um tom mais claro/escuro
- Muitos tons quase iguais de cinza/azul para texto → três papéis de texto: principal, secundário, apagado
- Texto direto sobre arena ou fundo animado sem contorno nem painel → painel escuro ou contorno de 1 px
- Contraste baixo (texto apagado em fundo escuro, ex.: rodapé ilegível) → ≥ 4,5:1

## Arte e ícones

- Sprites em tamanhos de pixel diferentes na mesma tela → um fator inteiro; o destaque pode ser maior de propósito
- Pixel art borrada (escala não inteira, coordenada fracionada, suavização ligada) → inteiros e `imageSmoothingEnabled = false`
- Arte lisa, com gradiente suave, antialias ou foto ao lado de pixel art → refazer no estilo do jogo
- Emoji como ícone ou enfeite no canvas → ícone pixel do conjunto do jogo ou nada
- Ícones de tamanhos e contornos diferentes → um tamanho, um contorno
- Logo com elementos desalinhados, sombra em direções diferentes, peças tortas sem motivo → alinhar à grade, uma direção de sombra
- Arte gerada com detalhes que não fecham (pixels irregulares, ruído, formas derretidas) → refazer ou remover

## Texto e fontes

- Três ou mais fontes, ou muitos tamanhos → duas fontes, três ou quatro tamanhos
- Frases longas em fonte pixel de exibição → fonte legível para frases
- Texto abaixo do mínimo legível no celular → subir para o mínimo (ver medidas)
- Placeholders visíveis: `dia(s)`, `x1`, `[nome]`, `undefined`, `NaN` → texto certo para cada caso
- Rótulos vagos: `PRÓXIMO`, `CLIQUE AQUI`, `OK!!` → dizer o que acontece
- Exclamação e hype em menu (`INCRÍVEL!`, `ÉPICO!!`) → calmo; exclamação só em momento de jogo
- Números em formatos diferentes na mesma tela (`1250`, `1.2k`, `1.250`) → um formato
- Texto sem tradução ou misturando idiomas → passar por `tr()` / tabela de idiomas

## HUD e combate

- Painel ou texto fixo no meio da arena → bordas
- Números de dano grandes demais, longos ou que ficam muito tempo → curtos, com contorno, somem rápido
- Rótulos de status de tamanhos e cores aleatórios → um estilo para todos
- Barras de vida/carga sem diferença clara entre os dois lados → mesma forma, espelhada, cor de lado/time
- Botões de toque pequenos ou onde o polegar arrasta → maiores, nos cantos de baixo

## Movimento e juice

- Pulso, brilho ou balanço contínuo em coisas que não pedem ação → parado
- Vários elementos pulsando na mesma tela → no máximo um, o que pede ação agora
- Tremor ou flash em menus e telas de texto → só em evento de jogo
- Combate sem resposta (acerto sem flash, sem som, sem pausa de impacto) → adicionar feedback curto e proporcional
- Transições de tela lentas ou que travam o toque → rápidas, o toque funciona logo

## Monetização e recompensas

- Preço riscado sem preço cheio real, desconto inventado → só desconto verdadeiro
- Contador de tempo falso ou que reinicia → só prazo real
- Selo/bolinha de notificação em quase tudo → só onde há algo para fazer
- Oferta ocupando o lugar do botão de jogar → jogar continua sendo a ação principal
