# House Tracker

A personal web app to track properties you're considering buying. Paste a Zoopla URL,
and the app pulls the price, address, beds/baths, tenure and EPC. Add pros, cons,
viewing dates, ratings, and compare houses side-by-side.

Mobile-friendly: install to your iPhone home screen via Safari → Share → Add to Home Screen.

## Setup (one-time, ~20 min)

You need three free accounts: **Supabase** (database), **ScraperAPI** (Zoopla price
fetcher — Zoopla blocks direct scraping), and **Vercel** (hosting).

### 1. Supabase

1. Sign up at https://supabase.com → "New project"
2. Pick a name + region (London / `eu-west-2` is fine), generate a DB password, "Create"
3. Once it's ready, go to **SQL Editor → New query**, and paste in the entire SQL block
   below (this is the contents of `supabase/migrations/0001_init.sql`). Click **Run**.

   ```sql
   create extension if not exists "pgcrypto";

   create table if not exists properties (
     id              uuid primary key default gen_random_uuid(),
     user_id         uuid not null references auth.users(id) on delete cascade,
     zoopla_url      text not null,
     viewing_date    date,
     address         text,
     current_price   integer,
     beds            smallint,
     baths           smallint,
     tenure          text,
     epc_rating      text,
     property_type   text,
     photo_url       text,
     status          text not null default 'shortlist'
                     check (status in ('shortlist','viewing_booked','viewed','offered','rejected','withdrawn')),
     rating          smallint check (rating between 1 and 5),
     pros            jsonb not null default '[]'::jsonb,
     cons            jsonb not null default '[]'::jsonb,
     notes           text,
     raw_snapshot    jsonb,
     created_at      timestamptz not null default now(),
     updated_at      timestamptz not null default now()
   );

   create index if not exists properties_user_idx on properties(user_id, viewing_date);

   create table if not exists price_history (
     id           uuid primary key default gen_random_uuid(),
     property_id  uuid not null references properties(id) on delete cascade,
     price        integer not null,
     fetched_at   timestamptz not null default now()
   );

   create index if not exists price_history_property_idx on price_history(property_id, fetched_at);

   alter table properties enable row level security;
   alter table price_history enable row level security;

   drop policy if exists "own properties" on properties;
   create policy "own properties" on properties
     for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

   drop policy if exists "own price history" on price_history;
   create policy "own price history" on price_history
     for all using (
       exists (select 1 from properties p where p.id = property_id and p.user_id = auth.uid())
     ) with check (
       exists (select 1 from properties p where p.id = property_id and p.user_id = auth.uid())
     );

   create or replace function set_updated_at() returns trigger language plpgsql as $$
   begin
     new.updated_at := now();
     return new;
   end; $$;

   drop trigger if exists properties_updated_at on properties;
   create trigger properties_updated_at before update on properties
     for each row execute function set_updated_at();
   ```

   You should see "Success. No rows returned" — that's correct, the script creates
   tables but doesn't query any data.
4. Grab three values to paste into Vercel later. The Supabase dashboard has been
   reshuffled recently, so depending on what you see:
   - **Project URL** (e.g. `https://abcdefg.supabase.co`) → look under **Settings →
     Data API**, or **Settings → General**, or **Settings → API**, depending on UI version
   - **anon / public key** (long string starting with `eyJ…`, sometimes labelled
     "publishable") → **Settings → API Keys** (or **Settings → API** in older UI)
   - **service_role key** (also starts with `eyJ…`, marked "secret — never expose in
     browser") → same page as the anon key, may need to click "Reveal"

   Ignore the **Integrations** section — that's for connecting to third-party services,
   not what we need.

### 2. ScraperAPI

1. Sign up at https://www.scraperapi.com (free tier — 1,000 credits/month, no card needed)
2. Copy your API key from the dashboard

### 3. Vercel

1. Push this repo to GitHub (private repo is fine)
2. Sign up at https://vercel.com with GitHub, "Add New… → Project", import the repo
3. Before clicking **Deploy**, expand **Environment Variables** and paste in:

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
   | `SCRAPERAPI_KEY` | ScraperAPI key |
   | `CRON_SECRET` | any random string (used to authenticate scheduled price refresh) |

4. Click **Deploy**. After ~2 min you get a URL like `house-tracker-xyz.vercel.app`
5. Back in Supabase: in the left sidebar, click **Authentication** (its own top-level
   section, not inside Settings). Find **URL Configuration**:
   - **Site URL**: paste your Vercel URL (e.g. `https://house-tracker-abc.vercel.app`)
   - **Redirect URLs**: also add `https://house-tracker-abc.vercel.app/auth/callback`
   - Save

   Without this, the magic-link email will redirect to the wrong place and login won't work.

### 4. Install on iPhone

1. Open the Vercel URL in **Safari** (not Chrome — only Safari supports Add to Home Screen)
2. Sign in: enter your email, hit **Send magic link**, open the email on your phone, tap the link
3. Tap the **Share** button at the bottom → scroll down → **Add to Home Screen** → **Add**

## Local development

```bash
cp .env.local.example .env.local   # fill in values from above
npm install
npm run dev
```

Open http://localhost:3000.

## How it works

- `app/api/listings` — POST scrapes the Zoopla URL via ScraperAPI, parses the
  `__NEXT_DATA__` and JSON-LD blobs, stores everything in Supabase
- `app/api/cron/refresh` — runs Mon + Thu at 07:00 UTC (`vercel.json`), re-fetches
  every property's current price, writes a row to `price_history` only when it changes
- The detail page also has a manual "Refresh price" button if you want to check now

## When something breaks

The most likely failure is Zoopla changing their HTML and the parser missing a field.
The full HTML response is stored in `properties.raw_snapshot` per scrape, so the parser
can be patched without re-fetching.

If ScraperAPI returns 403 or runs out of credits, the app keeps working — you can type
the price in by hand and the listing still saves.
