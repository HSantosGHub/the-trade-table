-- The Trade Table schema
-- Run this in the Supabase SQL editor (Project > SQL Editor > New query)

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------
create table categories (
  id          uuid primary key default gen_random_uuid(),
  key         text unique not null,          -- url-safe slug, e.g. 'baseball'
  label       text not null,                 -- display name, e.g. 'Baseball Cards'
  swatch      text not null default '#2F5233',
  active      boolean not null default true, -- controls filter-chip visibility only
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- buyers
-- ---------------------------------------------------------------------
create table buyers (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text,
  phone       text,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- items
-- ---------------------------------------------------------------------
create table items (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  category_id    uuid references categories(id) on delete set null,
  cost           numeric(10,2) not null default 0,
  value          numeric(10,2) not null default 0,
  status         text not null default 'listed' check (status in ('listed','sold','archived')),
  acquired_date  date not null default current_date,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index items_category_idx on items(category_id);
create index items_status_idx on items(status);

-- ---------------------------------------------------------------------
-- item_photos  (Supabase Storage holds the file; this stores the URL)
-- ---------------------------------------------------------------------
create table item_photos (
  id          uuid primary key default gen_random_uuid(),
  item_id     uuid not null references items(id) on delete cascade,
  url         text not null,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create index item_photos_item_idx on item_photos(item_id);

-- ---------------------------------------------------------------------
-- listings  (an item can be listed on several sites at once)
-- ---------------------------------------------------------------------
create table listings (
  id           uuid primary key default gen_random_uuid(),
  item_id      uuid not null references items(id) on delete cascade,
  site         text not null,               -- 'eBay', 'COMC', 'Facebook', 'TCGPlayer', ...
  posted_date  date not null default current_date,
  active       boolean not null default true,
  url          text,
  created_at   timestamptz not null default now()
);

create index listings_item_idx on listings(item_id);
create index listings_active_idx on listings(active);

-- ---------------------------------------------------------------------
-- sales  (one row per item once it sells — links item, buyer, price, site)
-- ---------------------------------------------------------------------
create table sales (
  id          uuid primary key default gen_random_uuid(),
  item_id     uuid not null references items(id) on delete cascade,
  buyer_id    uuid references buyers(id) on delete set null,
  price       numeric(10,2) not null,
  site        text not null,
  sale_date   date not null default current_date,
  created_at  timestamptz not null default now()
);

create index sales_item_idx on sales(item_id);
create index sales_buyer_idx on sales(buyer_id);

-- ---------------------------------------------------------------------
-- keep items.updated_at fresh
-- ---------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger items_set_updated_at
before update on items
for each row execute function set_updated_at();

-- ---------------------------------------------------------------------
-- Row Level Security
-- This app is for a single small business (you + your husband), so the
-- simplest safe setup is: only logged-in users (the accounts you create
-- for the two of you in Supabase Auth) can read or write anything.
-- ---------------------------------------------------------------------
alter table categories   enable row level security;
alter table buyers       enable row level security;
alter table items        enable row level security;
alter table item_photos  enable row level security;
alter table listings     enable row level security;
alter table sales        enable row level security;

create policy "authenticated read/write categories" on categories
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated read/write buyers" on buyers
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated read/write items" on items
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated read/write item_photos" on item_photos
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated read/write listings" on listings
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated read/write sales" on sales
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------
-- seed a starter set of categories
-- ---------------------------------------------------------------------
insert into categories (key, label, swatch) values
  ('baseball', 'Baseball Cards', '#2F5233'),
  ('starwars', 'Star Wars', '#8B3A3A'),
  ('mtg', 'Magic: TG', '#5B3A8B'),
  ('lego', 'Lego', '#C08A28');
