# Histórico de versões

| Versão | Foco | Servidor |
|---|---|---|
| 1.0 | Menu Contra Bots / Online, ranqueada só online, salas até 10 jogadores (5x5) | 1.0 |
| 1.1 | 37 lendas redesenhadas com folclore e mitos (108 no total) | 1.1 |
| 1.2 | PDL calculado no servidor, Supabase, Ranking Top 50 | 1.2 |
| 1.3 | Contas com usuário e senha (scrypt), até 5 aparelhos | 1.3 |
| 1.4 | Boas-vindas (Criar / Entrar / Sem conta), ranqueada exige conta | 1.3 |
| 1.5 | Lenda da semana, missões diárias, herói de fim de semana, bordas de elo e temporadas, convite por código, conquistas, tutorial, replay vertical | 1.4 |
| 1.8 | Prêmio diário de 7 dias (dia 7: roleta de lenda fixa por 24h); 1ª vitória do dia vale GD em dobro; revanche e desafio a rivais recentes; linha "Próximo objetivo" no menu; página `/retencao` com D1, D7 e D30 | 1.7 |
| 1.7 | Ranqueada: escolha 1 de 3 lendas; sorteio em grade 5+5 nos modos em equipe; fila casual chama um bot após 20 s; contador de pessoas online; golpes com mais impacto (som, pausa, tremida, vibração, clarão no nocaute); 3 primeiras partidas contra bots mais fáceis | 1.6 |
| 1.6 | Filtro de nomes, denúncias, nome fixo, ícones de perfil, caixa de elo 1x por elo/temporada, telemetria `/balanceamento`, página própria + PWA | 1.5 |

## Pastas
- Raiz: jogo web (`index.html`, PWA) e servidor (`server.js`, `supabase.sql`).
- `godot/`: porte Godot 4.3 da versão 1.6 (ainda sem as mudanças da 1.7) (sem replay, ainda não testado).
