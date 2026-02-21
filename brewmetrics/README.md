# BrewMetrics

A production-ready, secure B2B SaaS for specialty coffee roasteries. **Pure data visualization — no AI.** Built with Next.js, TypeScript, Tailwind, Recharts, and Supabase.

## Tech Stack

- **Next.js 14+** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **shadcn-style UI** (Radix primitives + CVA)
- **Recharts**
- **Supabase** (database + auth only; no AI)

## Security

- **Supabase Authentication**: sign up, login, logout. Sessions via cookies (SSR).
- **Row Level Security (RLS)**: Users see only their own `roasting_records` and `profiles`.
- **Secrets**: Supabase URL and anon key in `.env.local`; never exposed in client code beyond the public anon key.

## Getting Started

1. Copy `.env.example` to `.env.local` and set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. In Supabase SQL Editor, run `supabase/schema.sql` to create tables and RLS.
3. Run the app:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You will be redirected to `/login` if not signed in.

## Features

- **Dashboard** — KPIs from your data, quality radar, trend chart, **Advanced Analytics** scatter (Roast Temperature vs Cupping Score).
- **Bean Profiles** — Full CRUD for roasting records (create, edit, delete). Fields: bean_name, roast_temperature, roast_time, grind_size, extraction_time, cupping_score, created_at, user_id.
- **Digital Twin** — Interactive simulation: sliders for temperature (180–230°C), grind (1–10), extraction (15–40s). Real-time quality score and gauge (formula-based, no AI).
- **Settings** — Placeholder.

## Project Structure

- `app/(dashboard)/` — Protected app (Dashboard, Bean Profiles, Digital Twin, Settings).
- `app/login`, `app/signup` — Auth pages.
- `app/auth/callback` — Supabase auth code exchange.
- `middleware.ts` — Protects routes; redirects unauthenticated users to login.
- `lib/supabase/` — Server and browser clients; types.
- `supabase/schema.sql` — Tables: `profiles`, `roasting_records`; RLS and trigger for new user profile.

## Deployment (Vercel)

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel environment variables. Build and deploy.

## Design

Coffee palette (brown, cream, dark gray). Responsive layout with sidebar and mobile menu. Stripe/Linear/Vercel-style UI.


