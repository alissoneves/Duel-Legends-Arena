# Histórico de versões

| Versão | Foco | Servidor |
|---|---|---|
| 1.0 | Menu Contra Bots / Online, ranqueada só online, salas até 10 jogadores (5x5) | 1.0 |
| 1.1 | 37 lendas redesenhadas com folclore e mitos (108 no total) | 1.1 |
| 1.2 | PDL calculado no servidor, Supabase, Ranking Top 50 | 1.2 |
| 1.3 | Contas com usuário e senha (scrypt), até 5 aparelhos | 1.3 |
| 1.4 | Boas-vindas (Criar / Entrar / Sem conta), ranqueada exige conta | 1.3 |
| 1.5 | Lenda da semana, missões diárias, herói de fim de semana, bordas de elo e temporadas, convite por código, conquistas, tutorial, replay vertical | 1.4 |
| 2.5.3 | Resposta visual nos botões: com o mouse em cima, o botão clareia e o cursor vira mãozinha (o que não é botão fica com o cursor normal); botão indisponível (Gemas) dá som de "não" e balança | 2.1 |
| 2.5.2 | Correção: jogador novo podia ficar preso no sorteio (PREPARAR! não respondia) por causa de um aviso aberto que não aparecia na tela; agora os avisos aparecem em qualquer tela e, com aviso aberto, só os botões dele funcionam; botões clareiam por um instante ao serem tocados; subtítulo do sorteio 1x1 não encosta mais nos rótulos | 2.1 |
| 2.5.1 | Segurança: links com ?server= de fora não trocam mais o servidor (protege login e senha); servidor com páginas internas protegidas por chave, limites de tentativas pelo endereço real, estatísticas só de lendas que existem e, na ranqueada, quem sai no meio perde | 2.1 |
| 2.5 | Visual mais limpo (unslop) em todas as telas: tela inicial com botão JOGAR e barra de abas (Loja, Coleção, Missões, Perfil), tela JOGAR (Contra Bots / Online), títulos e botões padronizados, plurais certos, coleção mostrando 110 lendas no resultado; imagem nítida na resolução real da tela; sombra e luz nos sprites das lendas | 2.0 |
| 2.4 | Tradução completa dos nomes de itens (238) e golpes das lendas (330) para inglês e espanhol; Godot junto | 2.0 |
| 2.3 | Idiomas: português, inglês e espanhol (Opções → IDIOMA; dicionário em `src/js/16a-idiomas.js` e `godot/data/i18n.json`); bots que se ajustam à sequência de vitórias/derrotas; tela de fim de temporada com borda, elo máximo e posição; Godot atualizado junto | 2.0 |
| 2.2 | Política de Privacidade (`privacidade.html`); excluir conta / apagar dados online no jogo; erros do jogo enviados ao servidor (página `/erros`); opção de vibração; código dividido em `src/` com `build.js`; lenda renomeada para Nerojor, The Knight (nome curto "Nerojor" onde falta espaço) | 1.9 |
| 2.1 | 110 lendas: Nerojor (Humano, Épico, cavaleiro) e Cabeça de Cuia (Água, Raro, lenda do Piauí); online exige a versão 2.1 | 1.8 |
| 2.0 | Aviso de 0,35 s antes do especial (anel vermelho; atordoar interrompe); quem tem pouca vida carrega o especial mais rápido; bônus no centro da arena a cada 20 s (cura, velocidade, carga); arena fecha a partir de 40 s, a cada 12 s, até ficar pequena | 1.7 |
| 1.9 | Economia mais apertada (~550 GD por dia): itens 2 a 3x mais caros, recompensas menores; vender itens virou desmanchar por Pó Mágico | 1.7 |
| 1.8 | Prêmio diário de 7 dias (dia 7: roleta de lenda fixa por 24h); 1ª vitória do dia vale GD em dobro; revanche e desafio a rivais recentes; linha "Próximo objetivo" no menu; página `/retencao` com D1, D7 e D30 | 1.7 |
| 1.7 | Ranqueada: escolha 1 de 3 lendas; sorteio em grade 5+5 nos modos em equipe; fila casual chama um bot após 20 s; contador de pessoas online; golpes com mais impacto (som, pausa, tremida, vibração, clarão no nocaute); 3 primeiras partidas contra bots mais fáceis | 1.6 |
| 1.6 | Filtro de nomes, denúncias, nome fixo, ícones de perfil, caixa de elo 1x por elo/temporada, telemetria `/balanceamento`, página própria + PWA | 1.5 |

## Pastas
- `src/`: código do jogo dividido por assunto (`src/js/NN-nome.js`) e a casca HTML (`src/index.html`).
- `build.js`: junta tudo no `index.html` final. Rode `node build.js` depois de mexer em `src/`.
- Raiz: jogo web (`index.html`, PWA) e servidor (`server.js`, `supabase.sql`).
- `godot/`: porte Godot 4.3 da versão 2.4 (sem replay e sem o aviso de erros; ainda não testado).
