-- Run this once in the Supabase SQL editor (Project -> SQL Editor -> New query).

create table if not exists entries (
  id text primary key,
  kind text not null check (kind in ('in','out')),
  amount numeric not null,
  note text default '',
  cat text default 'other',
  date text not null,
  ts bigint not null
);

create table if not exists accounts (
  id text primary key default 'main',
  paypal numeric default 0,
  usbank numeric default 0,
  clp numeric default 0,
  rate numeric default 942,
  updated_at bigint
);

insert into accounts (id) values ('main') on conflict (id) do nothing;

alter table entries enable row level security;
alter table accounts enable row level security;

-- This app has no per-user login of its own -- the passcode screen in front of
-- it is the only gate. These policies let the app's key read and write freely.
-- Keep the passcode private; don't share the Supabase URL/key elsewhere.
create policy "app read/write entries" on entries
  for all using (true) with check (true);

create policy "app read/write accounts" on accounts
  for all using (true) with check (true);

alter publication supabase_realtime add table entries;
alter publication supabase_realtime add table accounts;
