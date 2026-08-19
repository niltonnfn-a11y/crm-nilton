create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id),
  name text not null,
  email text not null,
  phone text,
  company text,
  notes text,
  created_at timestamptz not null default now()
);

alter table contacts enable row level security;

drop policy if exists "Users manage their own contacts" on contacts;
create policy "Users manage their own contacts"
  on contacts
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists deals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id),
  contact_id uuid not null references contacts(id) on delete cascade,
  title text not null,
  value numeric not null default 0,
  stage text not null default 'novo'
    check (stage in ('novo', 'em_contato', 'proposta_enviada', 'negociacao', 'ganho', 'perdido')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table deals enable row level security;

drop policy if exists "Users manage their own deals" on deals;
create policy "Users manage their own deals"
  on deals
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
