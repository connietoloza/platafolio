-- Fresh install only. If you already ran the old single-user schema.sql
-- against this project, use supabase/migrate-to-auth.sql instead.

create table if not exists entries (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('in','out')),
  amount numeric not null,
  note text default '',
  cat text default 'other',
  date text not null,
  ts bigint not null
);

create table if not exists accounts (
  id uuid primary key references auth.users(id) on delete cascade,
  paypal numeric default 0,
  usbank numeric default 0,
  clp numeric default 0,
  rate numeric default 942,
  goal numeric default 6760,
  updated_at bigint
);

alter table entries enable row level security;
alter table accounts enable row level security;

create policy "users manage their own entries" on entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users manage their own account row" on accounts
  for all using (auth.uid() = id) with check (auth.uid() = id);

alter publication supabase_realtime add table entries;
alter publication supabase_realtime add table accounts;
