-- Migrates an already-deployed passcode-era database (single shared 'main'
-- row, open policies) to real per-user accounts. Run in two passes.

-- ===== PASS 1 — run now, before anyone signs up =====

alter table entries add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- ===== PASS 2 — run once you've signed up through /signup on the live site =====
-- Replace YOUR_USER_ID below with your real auth uid: Authentication -> Users
-- in the Supabase dashboard, copy the UUID next to your email.

-- update entries set user_id = 'YOUR_USER_ID' where user_id is null;
-- update accounts set id = 'YOUR_USER_ID' where id = 'main';

-- alter table entries alter column user_id set not null;

-- drop policy if exists "app read/write entries" on entries;
-- drop policy if exists "app read/write accounts" on accounts;

-- create policy "users manage their own entries" on entries
--   for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- create policy "users manage their own account row" on accounts
--   for all using (auth.uid() = id) with check (auth.uid() = id);
