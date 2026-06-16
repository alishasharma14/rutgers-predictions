# UPick

A virtual prediction market for Rutgers students. Predict outcomes on sports, campus life, and dining using virtual points — no real money involved — and climb the leaderboard.

Think **Fantasy Football + Prediction Markets + Rutgers Culture.**

## How it works

- Every student starts with 1,000 points and can claim a 100-point daily bonus.
- Markets ask a yes/no question ("Will Rutgers football beat Penn State?"). Odds move based on how many points are wagered on each side.
- Wager points on YES or NO. Your payout odds lock in at bet time, so they don't change even if the market moves afterward.
- Talk to other students about a market in the comments thread under each card.
- When a market closes, an admin resolves it YES/NO and every wager settles automatically — winners get paid, points and P&L update.
- Climb the leaderboard, ranked by settled bet P&L among students with 3+ settled wagers.

## Tech stack

- **Next.js 16** (App Router, React Server Components, Server Actions)
- **React 19**
- **Tailwind CSS v4** (theme tokens via `@theme inline` in [globals.css](app/globals.css), not `tailwind.config.js`)
- **Supabase** (Postgres + RLS) for markets, wagers, users, and comments
- **DM Sans / DM Mono** via `next/font/google`

> This project pins a Next.js version with breaking changes from older docs/training data. If you're touching framework-level conventions, check `node_modules/next/dist/docs/` before assuming the old App Router behavior holds.

## Project structure

```
app/
  page.tsx                    # market feed (server component, fetches markets + wagers)
  leaderboard/page.tsx         # ranked standings (sorted by settled bet P&L)
  positions/page.tsx            # current user's wager history
  admin/
    page.tsx                     # lists open/closed markets, resolve YES/NO
    actions.ts                    # resolveMarket server action — settles wagers, pays out
  login/
    page.tsx                      # login/signup form, gated to @rutgers.edu
    actions.ts                     # login/signup/logout server actions
  layout.tsx                    # nav, fonts, UserProvider/ToastProvider, server-side auth check
  context/UserContext.tsx        # client-side userId/points/bets/P&L state, synced to Supabase
  components/
    MarketsView.tsx            # category filter + market grid (client)
    MarketCard.tsx               # odds, bet panel, comments, live/closing badges (client)
    PositionsView.tsx              # P&L summary + open/settled filter (client)
    HeroBar.tsx                      # points / rank / bets / ROI stat bar
    DailyBanner.tsx                    # daily bonus claim
    NavPoints.tsx                        # live points pill in nav
    PageTabs.tsx                          # tab-style nav between the three routes
    ToastProvider.tsx                      # toast notifications
lib/supabase/
  client.ts                    # browser Supabase client (@supabase/ssr)
  server.ts                    # server Supabase client, reads/writes the session cookie
  proxy.ts                      # session-refresh + auth-redirect logic, used by proxy.ts
proxy.ts                       # this Next.js version's renamed middleware.ts — runs updateSession on every request
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
  points int not null default 1000,
  bet_pnl int not null default 0
);

create table markets (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  category text not null,
  status text not null default 'open',      -- 'open' | 'closed'
  resolution text,                            -- 'YES' | 'NO' | null
  closes_at timestamptz,
  is_live boolean not null default false,
  created_at timestamptz not null default now()
);

create table wagers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  market_id uuid not null references markets(id),
  choice text not null,                       -- 'YES' | 'NO'
  amount int not null,
  odds_at_bet numeric,                        -- implied probability locked in at bet time
  settled boolean not null default false,
  payout integer,                             -- points returned if won, 0 if lost
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

create policy "users insert own wagers" on wagers for insert with check (auth.uid() = user_id);
create policy "users insert own comments" on comments for insert with check (auth.uid() = user_id);
create policy "users update own row" on users for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "public update markets" on markets for update using (true);
create policy "public update wagers" on wagers for update using (true);
```

`markets`/`wagers` updates stay open (`using (true)`) since settlement runs through the `/admin` server action, not a per-user check — there's no admin role column yet, so anyone signed in can currently resolve markets.

### 5. Auth trigger

`users` rows are no longer seeded by hand — signing up through Supabase Auth (gated to `@rutgers.edu` in the app) creates the `auth.users` row, and this trigger mirrors it into `public.users`:

```sql
create or replace function public.handle_new_user()
returns trigger as $$
begin
  if new.email not like '%@rutgers.edu' then
    raise exception 'Only @rutgers.edu emails are allowed';
  end if;
  insert into public.users (id, email, points, bet_pnl)
  values (new.id, new.email, 1000, 0);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

Markets are still seeded directly via SQL, e.g.:

```sql
insert into markets (question, category, closes_at, is_live) values
  ('Will Rutgers football beat Penn State?', 'Football', now() + interval '4 days', false),
  ('Will the dining hall bring back Wednesday wings?', 'Campus', now() + interval '14 days', false);
```

### 6. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign up with a `@rutgers.edu` email. The admin tool for resolving markets lives at [http://localhost:3000/admin](http://localhost:3000/admin) — it's not linked in the nav, and any signed-in user can currently reach it since there's no admin role yet.

## Current state

- **Auth is live** — Supabase email/password auth gated to `@rutgers.edu` (checked client-side, server-side, and in the `handle_new_user` trigger). `proxy.ts` (this Next.js version's renamed `middleware.ts`) redirects signed-out requests to `/login` and refreshes the session cookie on every request.
- Every wager, comment, points balance, and P&L figure is now scoped to the real authenticated user (`auth.uid()`) instead of a hardcoded placeholder.
- Market resolution and settlement are live via `/admin`: closing a market pays out every wager based on its locked-in odds and updates `users.points` / `users.bet_pnl`.
- Markets support `closes_at` (countdown badge, blocks new bets once passed) and `is_live` (pulsing LIVE badge), but nothing currently enforces auto-closing — an admin still has to resolve manually.
- Comments are open to any signed-in user; no gating by wager status.

## Roadmap

- **Admin role** — right now `/admin` is reachable by any signed-in user; add an `is_admin` flag on `users` and gate the route/server action behind it.
- **Market creation UI** — right now markets are only added via SQL; an authenticated admin form would replace that.
- **Comment moderation** — `chat_mode` per market (`public` | `gated` until a bet is placed), a `hidden` flag on comments, YES/NO position tags on comments.
