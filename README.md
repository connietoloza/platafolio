# Week in, Week out

Your own weekly money tracker — accounts, weekly in/out, category targets, and a tuition fund chart, as a real site you own and can put on Vercel.

## 1. Create a free Supabase project

1. Go to [supabase.com](https://supabase.com), sign up, and create a new project (any name/region, free tier).
2. Once it's ready, open **SQL Editor → New query**, paste in the contents of [`supabase/schema.sql`](supabase/schema.sql), and run it. This creates the `entries` and `accounts` tables.
3. Open **Project Settings → API**. You'll need the **Project URL** and the **anon public** key.

## 2. Set your local environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and fill in:
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from Supabase step 1.3 above
- `TRACKER_PASSCODE` — any passcode you want to type to open the site (this is the only login this app has — see **Security note** below)

## 3. Run it locally

This project needs **Node.js 18.18 or newer**. Check yours with `node -v` — if it's older, install a newer one first (e.g. via [nvm](https://github.com/nvm-sh/nvm): `nvm install 20 && nvm use 20`).

```bash
npm install
npm run dev
```

Open http://localhost:3000 and enter your passcode.

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
2. In the import screen, add the same three environment variables from your `.env.local` (Supabase URL, Supabase anon key, passcode).
3. Deploy. Vercel gives you a `.vercel.app` URL — that's your site.

Any time you `git push`, Vercel redeploys automatically.

## Security note

This app is gated by a single shared passcode, not a real login system — good enough to keep it off Google and out of casual reach, not bank-grade. Two things worth knowing:

- The Supabase anon key ships in the browser (that's normal for Supabase apps), and the database policies in `schema.sql` allow full read/write with that key — so anyone who both learns your passcode *and* inspects the network requests could read the Supabase URL/key directly. Keep the URL and passcode private, the same way you'd protect a shared budgeting spreadsheet.
- If you ever want this locked down further (e.g. real email/password login, or a server-side proxy so the Supabase key never reaches the browser), that's a follow-up worth asking for — it's a bigger change than this first version.

## Notes

- Data lives in your own Supabase project, synced in real time across any device you log into.
- Hover over the charts for a moment to see the tooltip with exact numbers.
