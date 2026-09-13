# Know Your Money w/ Connie

A weekly money tracker — accounts, weekly in/out, category targets, and a tuition fund chart. Anyone can sign up and gets their own private tracker; your data is never visible to anyone else who signs up.

## 1. Create a free Supabase project

1. Go to [supabase.com](https://supabase.com), sign up, and create a new project (any name/region, free tier).
2. Open **SQL Editor → New query**, paste in the contents of [`supabase/schema.sql`](supabase/schema.sql), and run it. This creates the `entries` and `accounts` tables, with row-level security so each signed-in user only ever sees their own rows.
3. Open **Authentication → Providers** and make sure **Email** is enabled (it is by default). If you want people to be able to sign up and start using the app immediately without clicking a confirmation email, turn off **Confirm email** under **Authentication → Sign In / Providers → Email**.
4. Open **Project Settings → API**. You'll need the **Project URL** and the **anon public** key.

## 2. Set your local environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from step 1.4 above.

## 3. Run it locally

This project needs **Node.js 18.18 or newer**. Check yours with `node -v` — if it's older, install a newer one first (e.g. via [nvm](https://github.com/nvm-sh/nvm): `nvm install 20 && nvm use 20`).

```bash
npm install
npm run dev
```

Open http://localhost:3000, click **Create an account**, and sign up with an email and password.

## 4. Push to GitHub

```bash
git init
git add .
git commit -m "Initial tracker"
```

Then create an empty repo on [github.com/new](https://github.com/new) (don't add a README/license there), and:

```bash
git remote add origin https://github.com/<your-username>/<repo-name>.git
git branch -M main
git push -u origin main
```

## 5. Deploy on Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import the GitHub repo you just pushed.
2. In the import screen, add the two environment variables from your `.env.local` (Supabase URL, Supabase anon key).
3. Deploy. Vercel gives you a `.vercel.app` URL — that's your site. Anyone with the link can sign up for their own account.

Any time you `git push`, Vercel redeploys automatically.

## How the accounts work

Each person who signs up gets a real Supabase Auth account (email + password). Every row in `entries` and `accounts` is tagged with a `user_id`, and Postgres row-level security policies enforce that a signed-in user can only ever read or write rows where `user_id` matches their own — enforced by the database itself, not just the app's UI.

## Notes

- Data syncs in real time across any device you're logged into.
- Hover over the charts for a moment to see the tooltip with exact numbers.
