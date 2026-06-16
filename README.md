# ScarletPicks

A virtual prediction market for Rutgers students. Predict outcomes on sports, campus life, and dining using virtual points — no real money involved — and climb the leaderboard.

Think **Fantasy Football + Prediction Markets + Rutgers Culture.**

## How it works

- Every student starts with 1,000 points and can claim a 100-point daily bonus.
- Markets ask a yes/no question ("Will Rutgers football beat Penn State?"). Odds move based on how many points are wagered on each side.
- Wager points on YES or NO. If the market resolves your way, you win a payout based on the odds at the time you bet.
- Talk to other students about a market in the comments thread under each card.
- Climb the leaderboard, ranked by points among students with 3+ settled wagers.

## Tech stack

- **Next.js 16** (App Router, React Server Components)
- **React 19**
- **Tailwind CSS v4** (theme tokens via `@theme inline` in [globals.css](app/globals.css), not `tailwind.config.js`)
- **Supabase** (Postgres + RLS) for markets, wagers, users, and comments
- **DM Sans / DM Mono** via `next/font/google`

> This project pins a Next.js version with breaking changes from older docs/training data. If you're touching framework-level conventions, check `node_modules/next/dist/docs/` before assuming the old App Router behavior holds.

## Project structure

```
app/
  page.tsx                  # market feed (server component, fetches markets + wagers)
  leaderboard/page.tsx       # ranked standings
  positions/page.tsx          # current user's wager history
  layout.tsx                   # nav, fonts, UserProvider/ToastProvider
  context/UserContext.tsx       # client-side points/bets state, synced to Supabase
  components/
    MarketsView.tsx           # category filter + market grid (client)
    MarketCard.tsx              # odds, bet panel, comments (client)
    HeroBar.tsx                  # points / rank / bets / ROI stat bar
    DailyBanner.tsx                # daily bonus claim
    NavPoints.tsx                    # live points pill in nav
    PageTabs.tsx                      # tab-style nav between the three routes
    ToastProvider.tsx                  # toast notifications
lib/supabase.ts               # shared Supabase client
```

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Database schema

In the Supabase SQL editor, create the core tables:

```sql
create table users (
  id uuid primary key references auth.users(id),
  email text not null,
  points int not null default 1000
);

create table markets (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  category text not null,
  status text not null default 'open',      -- 'open' | 'closed'
  resolution text,                            -- 'YES' | 'NO' | null
  created_at timestamptz not null default now()
);

create table wagers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  market_id uuid not null references markets(id),
  choice text not null,                       -- 'YES' | 'NO'
  amount int not null,
  settled boolean not null default false,
  created_at timestamptz not null default now()
);

create table comments (
  id uuid primary key default gen_random_uuid(),
  market_id uuid not null references markets(id),
  user_id uuid not null references users(id),
  text text not null,
  created_at timestamptz not null default now()
);
```

### 4. Row-level security

The app currently uses the anon key with no auth, so RLS policies must explicitly allow reads/writes:

```sql
alter table markets enable row level security;
alter table wagers enable row level security;
alter table users enable row level security;
alter table comments enable row level security;

create policy "public read markets" on markets for select using (true);
create policy "public read wagers" on wagers for select using (true);
create policy "public read users" on users for select using (true);
create policy "public read comments" on comments for select using (true);

create policy "public insert wagers" on wagers for insert with check (true);
create policy "public insert comments" on comments for insert with check (true);
create policy "public update users" on users for update using (true);
```

### 5. Seed data

`users.id` has a foreign key to `auth.users(id)`, so the placeholder user must exist in `auth.users` first:

```sql
insert into auth.users (
  id, instance_id, aud, role, email,
  encrypted_password, email_confirmed_at, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'placeholder@rutgers.edu',
  '', now(), now(), now()
);

insert into users (id, email, points) values
  ('00000000-0000-0000-0000-000000000001', 'placeholder@rutgers.edu', 1000);

insert into markets (question, category) values
  ('Will Rutgers football beat Penn State?', 'Football'),
  ('Will the dining hall bring back Wednesday wings?', 'Campus');
```

### 6. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Current state

- No authentication yet — every request acts as a single hardcoded `PLACEHOLDER_USER_ID`.
- Market resolution and payout settlement are not implemented; `wagers.settled` and `betPnL` exist but nothing sets them yet.
- Comments are open to anyone; no gating by wager status.

## Roadmap

- **Resolution & settlement** — admin view to close markets, set YES/NO resolution, calculate payouts, update `users.points` and `betPnL`.
- **Market metadata** — add `closes_at` / `is_live` to `markets`; seed a fuller slate of Rutgers markets across categories.
- **Positions upgrade** — show win/loss totals, an overall P&L summary, and an open-vs-settled filter.
- **Auth** — Supabase email auth restricted to `@rutgers.edu`, a trigger to auto-create the matching `public.users` row, swap `PLACEHOLDER_USER_ID` for `auth.uid()`.
- **Comment moderation** — `chat_mode` per market (`public` | `gated` until a bet is placed), a `hidden` flag on comments, YES/NO position tags on comments once auth lands.
