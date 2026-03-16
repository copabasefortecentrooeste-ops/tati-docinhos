-- ============================================================
-- Taty Docinhos — Migration 002: customers + delivery config
-- Execute no Supabase SQL Editor
-- ============================================================

-- ── customers (perfil do cliente autenticado) ──────────────
create table if not exists customers (
  id           uuid primary key references auth.users(id) on delete cascade,
  full_name    text not null,
  phone        text not null,
  email        text not null,
  city         text not null default 'Pitangui',
  state        text not null default 'MG',
  cep          text not null default '35650-000',
  neighborhood text not null default '',
  street       text not null default '',
  number       text not null default '',
  complement   text,
  created_at   timestamptz not null default now()
);

alter table customers enable row level security;

create policy "customers_own_select" on customers for select using (auth.uid() = id);
create policy "customers_own_insert" on customers for insert with check (auth.uid() = id);
create policy "customers_own_update" on customers for update using (auth.uid() = id);

-- ── Extend store_config with delivery mode ─────────────────
alter table store_config add column if not exists delivery_mode  text not null default 'city_only';
alter table store_config add column if not exists default_city   text not null default 'Pitangui';
alter table store_config add column if not exists default_state  text not null default 'MG';
alter table store_config add column if not exists default_cep    text not null default '35650-000';

-- ── Extend orders with customer linkage and address ─────────
alter table orders add column if not exists customer_id uuid references auth.users(id);
alter table orders add column if not exists city        text;
alter table orders add column if not exists state       text;
alter table orders add column if not exists cep         text;
