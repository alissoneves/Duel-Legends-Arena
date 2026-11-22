# Duel Legends Arena — projeto Godot

Base do jogo no Godot 4, com a mesma lógica do protótipo do navegador: 110 lendas sorteadas, 7 arenas com elementos, poderes A/B/C, dash, bloqueio com guarda e bloqueio perfeito, bot, sorteio por raridade, maestria e coleção salvas.

**Novo nesta versão:** modos 1x1, 2x2, 3x3, 5x5 e todos contra todos contra bots; torneio de 16 vagas com chave; telas de Coleção e Perfil com histórico; ajuste fino de dano por personagem (`TUNE`). No torneio, as lutas entre bots são decididas na hora por uma estimativa de vantagem, sem rodar a luta inteira.

**Versão 2.2 (igual à versão web 2.2, menos o replay):**
- ranqueada com escolha de 1 entre 3 lendas; sorteio em grade nos modos em equipe;
- fila casual chama um bot depois de 20 s; contador de pessoas online;
- golpes com mais impacto (pausa, tremida, amassado, vibração, clarão no nocaute);
- aviso antes do especial, chance de virada, bônus no centro da arena, arena fechando a partir de 40 s;
- prêmio diário de 7 dias (dia 7: lenda fixa por 24 h), 1ª vitória do dia em dobro, próximo objetivo no menu;
- revanche e desafio aos últimos rivais;
- economia nova (itens mais caros, desmanchar por Pó Mágico);
- excluir conta, link da Política de Privacidade e opção de vibração;
- 110 lendas, com Nerojor, The Knight e Cabeça de Cuia.

Ainda não testado num computador com Godot. O aviso automático de erros só existe na versão web.

## Como abrir

1. Baixe o **Godot 4.3 ou mais novo** (versão padrão, não a .NET) em godotengine.org. É gratuito e não precisa instalar: é só abrir o executável.
2. Descompacte este .zip numa pasta.
3. No Godot, clique em **Importar**, escolha o arquivo `project.godot` desta pasta e confirme.
4. Aperte **F5** (ou o botão ▶ no canto superior direito) para jogar.

Se aparecer algum erro, ele fica no painel **Saída** (Output) ou **Depurador** (Debugger), na parte de baixo da tela. Copie a mensagem e me mande que eu corrijo.

## Controles

| Ação | PC | Celular |
| --- | --- | --- |
| Mover | WASD ou setas | Joystick à esquerda |
| Mirar | Mouse | Automática |
| Poder A | Clique esquerdo (segurar) | Botão A |
| Poder B | E | Botão B |
| Especial C | Q | Botão C |
| Dash | Espaço | Botão DASH |
| Bloquear | Shift ou botão direito | Botão BLOQ |
| Pausa | Esc | Botão II |

## Estrutura

| Arquivo | O que tem |
| --- | --- |
| `project.godot` | Configuração: tela de 480 x 270 ampliada sem borrar, celular deitado |
| `scenes/main.tscn` | Cena principal |
| `scripts/main.gd` | Todo o jogo: telas, modos, torneio, ranqueada, sorteio, luta, poderes, bot, bloqueio, HUD, perfil |
| `scripts/sprites.gd` | Gera os desenhos em pixel art (provisórios) |
| `data/characters.json` | As 108 lendas: status, elemento, raridade, poderes e aparência |

Os números de equilíbrio ficam no topo de `main.gd`: `BAL` (dano corpo a corpo, queda de dano de longe, cura etc.) e `TUNE` (ajuste de dano de cada personagem). As divisões da ranqueada ficam em `DIVS`.

## Para gerar o jogo

- **PC (Windows, Linux, Mac):** menu Projeto > Exportar > Adicionar > escolha o sistema. Na primeira vez o Godot pede para baixar os "modelos de exportação".
- **Android:** precisa do Android SDK e de uma chave. O Godot tem um guia oficial: procure "Exporting for Android" na documentação.
- **Steam:** quando chegar a hora, usamos o plugin GodotSteam para conquistas, amigos e convites.

## O que ainda é provisório

- **Arte:** os personagens são desenhados por código. A troca para a arte final é por personagem, com sprite sheets (parado, andar, A, B, C, dash, dano, derrota).
- **Fonte:** usa a fonte padrão do Godot. Para o visual pixel, coloque a fonte *Press Start 2P* (licença livre OFL) na pasta do projeto e defina como fonte padrão em Configurações do Projeto > GUI > Tema.
- **Som:** ainda sem efeitos sonoros nem música.
- **Online e salas:** os modos de equipe já existem contra bots; jogar contra outras pessoas fica para a fase 3 do roteiro.

## Novo na versão 0.6 (igual ao protótipo v0.6)

- **Ritmo e equilíbrio:** lutas mais lentas e o novo equilíbrio corpo a corpo x distância (constante `BAL`).
- **Mapa maior com câmera**, esconderijos temáticos por arena e setas na borda para quem está fora da tela.
- **Ranqueada estilo LoL** (`scripts/ranked.gd`): Ferro a Desafiante, divisões IV a I, PDL, MMR oculto, colocação e proteção de rebaixamento.
- **Itens** (`scripts/items.gd` + `data/items.json`): 204 itens em 6 espaços e 6 raridades, loja, mochila, forja de +1 a +10 (a partir do +8 pode falhar e voltar 1 a 3 níveis, nunca quebra) e teto de bônus (150 normal, 50 na ranqueada).
- **Caixa da Sorte** ao subir de elo, com roleta e chances visíveis.
- **Preparação** antes da luta: equipar itens e PRONTO.
- **Como jogar, dicas nas primeiras partidas, opções** (dificuldade, dicas, tela cheia) e **estatísticas** no fim da luta.
- Ainda não tem música nem efeitos sonoros (o protótipo web tem).

Ao exportar, inclua `*.json` em *Filtros para exportar arquivos que não são recursos*, senão os dados de personagens e itens ficam de fora.


## Novo na versão 0.8 (igual ao protótipo v0.8)

- **Online:** telas Online, Salas, Sala e Partida rápida, usando o mesmo servidor do protótipo (`servidor/server.js` no repositório). Um jogador no Godot e outro no navegador podem jogar juntos: o sorteio usa o mesmo gerador (mulberry32) nos dois.
- **Caixa de texto** para nome, sala, senha e endereço do servidor (abre o teclado no celular).
- **Loja nova:** promoções da semana, catálogo completo com filtros, visuais e Gemas.
- **Visuais** (auras, rastros, títulos, emotes com a tecla T ou o botão ☺, molduras) e **Passe de Temporada** de 30 níveis.
- **Preparação:** selo EQUIPADO, X para tirar e lista do item atual.
- **Joystick:** zera ao trocar de app ou perder o foco, e no começo de cada luta.
