# Security foundation deployment

The code and database migration in this branch must be deployed together.

## 1. Supabase migration

Apply:

`supabase/migrations/20260918172422_secure_progress_api.sql`

This migration:

- prevents browser clients from editing XP, coins, levels, and counters;
- adds an immutable reward ledger and duplicate-attempt protection;
- makes practice-day/streak updates atomic;
- moves API quotas from server memory to Postgres;
- stores quiz topics with mistakes.

## 2. Vercel environment variables

Keep the existing variables and add:

- `SUPABASE_SERVICE_ROLE_KEY` — server-only; never prefix with `NEXT_PUBLIC_`.
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` — Cloudflare Turnstile public site key.

## 3. Supabase CAPTCHA

In Supabase Dashboard open **Authentication → Bot and Abuse Protection**,
enable Cloudflare Turnstile, and enter its secret key. The frontend sends the
Turnstile token directly to `supabase.auth.signUp`.

## 4. Verification

Run:

```bash
npm ci
npm run check
npm audit --omit=dev
```

Expected: lint passes, tests pass, production build succeeds, and npm reports
zero production vulnerabilities.
