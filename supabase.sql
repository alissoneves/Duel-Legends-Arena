-- Duel Legends Arena: tabela da ranqueada (rodar uma vez no SQL Editor do Supabase)
create table if not exists players (
  pid text primary key,
  keyh text not null,
  name text,
  rank jsonb,
  score int default -1,
  updated timestamptz default now()
);
create index if not exists players_score_idx on players (score desc);
-- ninguém de fora acessa a tabela; só o servidor do jogo, com a chave secreta
alter table players enable row level security;
