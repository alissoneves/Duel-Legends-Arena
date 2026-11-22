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

-- v1.2: contas com usuário e senha (rodar também se a tabela já existia)
alter table players add column if not exists keys jsonb default '[]'::jsonb;
alter table players add column if not exists login text;
alter table players add column if not exists passh text;
create unique index if not exists players_login_idx on players (login);

-- v1.5: denúncias e dados de balanceamento
create table if not exists reports (
  id bigserial primary key,
  at timestamptz default now(),
  reporter text, reporter_name text,
  target text, target_name text,
  reason text
);
alter table reports enable row level security;
create table if not exists legend_stats (
  legend text not null,
  mode text not null,
  games int default 0,
  wins int default 0,
  primary key (legend, mode)
);
alter table legend_stats enable row level security;

create table if not exists activity (
  pid text not null,
  day int not null,
  secs int default 0,
  games int default 0,
  primary key (pid, day)
);
alter table activity enable row level security;

create table if not exists client_errors (
  msg text primary key,
  stack text, ver text, state text,
  n int default 0,
  first_at timestamptz, last_at timestamptz
);
alter table client_errors enable row level security;

-- para ver as denúncias mais recentes:
-- select at, reporter_name, target_name, reason from reports order by at desc limit 50;
