-- ============================================================
-- Taty Docinhos — Migration inicial
-- Execute este SQL no Supabase SQL Editor
-- https://awfulilrbzypwjvtrltj.supabase.co
-- ============================================================

-- ─── store_config (linha única) ───────────────────────────
create table if not exists store_config (
  id          int primary key default 1,
  name        text not null default 'Taty Docinhos',
  phone       text not null default '(11) 99999-8888',
  instagram   text not null default '@tatydocinhos',
  address     text not null default 'Rua das Flores, 123 - Centro',
  pix_key     text not null default 'pix@tatydocinhos.com.br',
  delivery_policy text not null default 'Entregamos em até 60 minutos para o centro.',
  logo        text,
  constraint single_row check (id = 1)
);

-- ─── categories ───────────────────────────────────────────
create table if not exists categories (
  id          text primary key,
  name        text not null,
  slug        text not null unique,
  image       text,
  description text
);

-- ─── products ─────────────────────────────────────────────
create table if not exists products (
  id           text primary key,
  name         text not null,
  description  text,
  base_price   numeric(10,2) not null default 0,
  image        text,
  category_id  text references categories(id) on delete set null,
  min_quantity int not null default 1,
  options      jsonb not null default '[]',
  featured     boolean not null default false,
  best_seller  boolean not null default false
);

-- ─── neighborhoods ────────────────────────────────────────
create table if not exists neighborhoods (
  id     text primary key,
  name   text not null,
  fee    numeric(10,2) not null default 0,
  active boolean not null default true
);

-- ─── coupons ──────────────────────────────────────────────
create table if not exists coupons (
  id        text primary key,
  code      text not null unique,
  type      text not null check (type in ('percentage','fixed')),
  value     numeric(10,2) not null,
  active    boolean not null default true,
  min_order numeric(10,2)
);

-- ─── business_hours ───────────────────────────────────────
create table if not exists business_hours (
  id          text primary key,
  day_of_week int not null check (day_of_week between 0 and 6),
  open_time   text not null default '09:00',
  close_time  text not null default '18:00',
  active      boolean not null default true
);

-- ─── orders ───────────────────────────────────────────────
create table if not exists orders (
  id             text primary key,
  code           text not null unique,
  status         text not null default 'received',
  items          jsonb not null default '[]',
  customer       jsonb not null default '{}',
  is_pickup      boolean not null default false,
  delivery_fee   numeric(10,2) not null default 0,
  subtotal       numeric(10,2) not null default 0,
  discount       numeric(10,2) not null default 0,
  total          numeric(10,2) not null default 0,
  payment_method text not null default 'pix',
  change_for     numeric(10,2),
  coupon_code    text,
  scheduled_date text,
  scheduled_time text,
  created_at     timestamptz not null default now()
);

-- ─── RLS: habilitar + políticas abertas (ajuste para produção) ──
alter table store_config    enable row level security;
alter table categories      enable row level security;
alter table products        enable row level security;
alter table neighborhoods   enable row level security;
alter table coupons         enable row level security;
alter table business_hours  enable row level security;
alter table orders          enable row level security;

-- Leitura pública para todos
create policy "public_read_store_config"  on store_config   for select using (true);
create policy "public_read_categories"    on categories      for select using (true);
create policy "public_read_products"      on products        for select using (true);
create policy "public_read_neighborhoods" on neighborhoods   for select using (true);
create policy "public_read_coupons"       on coupons         for select using (true);
create policy "public_read_hours"         on business_hours  for select using (true);
create policy "public_read_orders"        on orders          for select using (true);

-- Escrita com anon key (admin usa senha client-side; proteja com auth em produção)
create policy "anon_write_store_config"  on store_config   for all using (true) with check (true);
create policy "anon_write_categories"    on categories      for all using (true) with check (true);
create policy "anon_write_products"      on products        for all using (true) with check (true);
create policy "anon_write_neighborhoods" on neighborhoods   for all using (true) with check (true);
create policy "anon_write_coupons"       on coupons         for all using (true) with check (true);
create policy "anon_write_hours"         on business_hours  for all using (true) with check (true);
create policy "anon_write_orders"        on orders          for all using (true) with check (true);

-- ─── Seed inicial (execute apenas uma vez) ────────────────
-- As tabelas serão preenchidas automaticamente pelo app na
-- primeira execução. Se preferir pré-popular via SQL,
-- descomente e ajuste os INSERTs abaixo.

/*
insert into store_config (id, name, phone, instagram, address, pix_key, delivery_policy)
values (1, 'Taty Docinhos', '(11) 99999-8888', '@tatydocinhos',
        'Rua das Flores, 123 - Centro', 'pix@tatydocinhos.com.br',
        'Entregamos em até 60 minutos para o centro.')
on conflict (id) do nothing;

insert into categories (id, name, slug, description) values
  ('1', 'Brigadeiros Gourmet', 'brigadeiros',  'Feitos com chocolate belga'),
  ('2', 'Bolos & Bento Cakes',  'bolos',         'Perfeitos para presentear'),
  ('3', 'Doces Finos',          'doces-finos',   'Para eventos especiais'),
  ('4', 'Combos & Kits',        'combos',        'Monte sua caixa'),
  ('5', 'Tortas',               'tortas',        'Fatias ou inteiras')
on conflict (id) do nothing;

insert into neighborhoods (id, name, fee, active) values
  ('1', 'Centro',           5.00,  true),
  ('2', 'Jardim América',   8.00,  true),
  ('3', 'Vila Nova',       10.00,  true),
  ('4', 'Parque das Flores',12.00, true),
  ('5', 'Industrial',      15.00, false)
on conflict (id) do nothing;

insert into coupons (id, code, type, value, active, min_order) values
  ('1', 'DOCE10',   'percentage', 10, true,  50),
  ('2', 'FRETE0',   'fixed',       8, true,  null),
  ('3', 'PRIMEIRA', 'percentage', 15, true,  30)
on conflict (id) do nothing;

insert into business_hours (id, day_of_week, open_time, close_time, active) values
  ('1', 1, '09:00', '18:00', true),
  ('2', 2, '09:00', '18:00', true),
  ('3', 3, '09:00', '18:00', true),
  ('4', 4, '09:00', '18:00', true),
  ('5', 5, '09:00', '20:00', true),
  ('6', 6, '10:00', '16:00', true),
  ('7', 0, '00:00', '00:00', false)
on conflict (id) do nothing;
*/
