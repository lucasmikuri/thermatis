create extension if not exists pgcrypto;

create table if not exists public.app_store (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.orcamentos (
  id text primary key,
  nome text not null,
  telefone text,
  email text,
  servico text,
  mensagem text,
  status text default 'novo',
  data timestamptz,
  origem text,
  created_at timestamptz not null default now()
);

create table if not exists public.clientes (
  id text primary key,
  nome text not null,
  telefone text,
  email text,
  endereco text,
  obs text,
  data timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.visitas (
  id text primary key,
  nome text not null,
  data date,
  hora text,
  servico text,
  tecnico text,
  obs text,
  created_at timestamptz not null default now()
);

create index if not exists idx_orcamentos_data on public.orcamentos (data desc);
create index if not exists idx_clientes_data on public.clientes (data desc);
create index if not exists idx_visitas_data on public.visitas (data desc);
