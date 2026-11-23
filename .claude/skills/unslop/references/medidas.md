# Medidas

Valores de partida. Se o jogo já tem um sistema bom, mantenha os valores dele e só corrija o uso.

## Grade

- Trabalhe na resolução lógica do jogo (no Duel Legends Arena: 480×270). Coordenadas e tamanhos inteiros.
- Escala de espaço em px lógicos: 2, 4, 6, 8, 12, 16, 24, 32.
  - Dentro de botão/painel: 4 a 8
  - Entre itens de um grupo: 4 a 6
  - Entre grupos: 12 a 16
  - Margem da tela: 8 a 12 (área segura do celular: ≥ 8)
- Sprites e fontes pixel em fator inteiro (1×, 2×, 3×). Um fator para os sprites comuns da tela; o destaque pode usar o fator seguinte.

## Toque

- Alvo mínimo ≈ 44 px CSS. Em px lógicos: `44 ÷ escala`. Com 480 lógicos num celular deitado de ~800 px CSS de largura (escala ~1,7): **botões com pelo menos 26 px lógicos de altura**, 22 para botões raros e secundários.
- Entre alvos vizinhos: ≥ 4 px lógicos.

## Texto (canvas 480×270)

| Papel | Fonte | Tamanho |
|---|---|---|
| Título da tela | pixel de exibição (Press Start 2P) | 12–16 |
| Botão principal | pixel de exibição | 10–12 |
| Botão comum | pixel de exibição | 8 |
| Frase, descrição | legível (Pixelify Sans) | 9–10 |
| Mínimo absoluto (meta, rodapé) | legível | 8 |

- Três papéis de cor de texto: principal (quase branco), secundário (cinza-azulado claro), apagado (contraste ≥ 4,5:1 com o fundo).
- Texto sobre arena: contorno de 1 px na cor do fundo escuro.

## Cor

- **Neutros**: 4 ou 5 degraus de um mesmo tom (fundo, painel, painel elevado, moldura, texto apagado). Botões comuns usam o painel elevado.
- **Uma cor de ação**: a mais forte da tela, no botão principal e na seleção.
- **Cores de significado**: reservadas. Raridade, elemento, time, moedas, vida (verde), dano (vermelho), cura. Nunca em botão comum.
- Sombra/afundamento de botão: um degrau mais escuro do próprio botão, 2–3 px embaixo.

## Movimento (60 fps)

| Coisa | Duração |
|---|---|
| Toque em botão (afundar 1–2 px) | 60–100 ms |
| Troca de tela | 120–200 ms |
| Pausa de impacto (hitstop) | 40–100 ms, proporcional ao golpe |
| Tremor de tela | 2–4 px, 100–250 ms, só em golpe forte/K.O. |
| Flash de acerto | 1–3 quadros |
| Número de dano | sobe 8–16 px, some em 400–700 ms |
| Pulso de "pede ação" | ciclo de 0,8–1,2 s, 1 elemento por tela |
