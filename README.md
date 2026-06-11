# Gay Bar Passport

Gay Bar Passport is a luxury queer travel journal app for discovering LGBTQ+ venues, logging visits, collecting passport stamps, writing destination journals, following travelers, viewing analytics, and operating the platform through an admin layer.

## Local Setup

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Environment Variables

Copy `.env.example` to `.env.local`.

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Supabase is required for auth, profiles, visits, journal entries, social features, analytics, and admin operations.

## Validation Commands

```bash
pnpm typecheck
pnpm lint
pnpm build
```

`pnpm build` may fail in restricted environments if `fonts.googleapis.com` cannot be resolved by `next/font`. In Vercel and normal networked environments, the build is expected to complete.

## Supabase Migrations

Run migrations in order from `supabase/migrations/` or `database/migrations/`:

1. `001_initial_phase_2_schema.sql`
2. `002_phase_3_auth_profiles.sql`
3. `003_phase_4_venue_directory.sql`
4. `004_phase_5_visit_passport_system.sql`
5. `005_phase_6_travel_journal.sql`
6. `006_phase_7_social_layer.sql`
7. `007_phase_7_public_profiles_policy.sql`
8. `008_phase_7_public_journal_read_policy.sql`
9. `009_phase_9_admin_platform.sql`

After Phase 9, manually promote an initial admin:

```sql
update public.profiles
set role = 'admin'
where id = '<USER_ID>';
```

## Vercel Deployment

Deploy from GitHub to Vercel. Production and Preview environments need:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL=https://gay-bar-passport.vercel.app`

Supabase Auth should include redirect URLs for local and production callback routes:

- `http://localhost:3000/auth/callback`
- `https://gay-bar-passport.vercel.app/auth/callback`

## CI

GitHub Actions runs:

- install dependencies with pnpm
- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`

Build requires network access for Google Fonts.

## Project Structure

- `app/` App Router routes
- `components/` shared UI, layout, state, and admin components
- `features/` feature-specific forms/actions
- `lib/` auth, admin guards, env, Supabase clients
- `services/` server-side reads and aggregation
- `schemas/` Zod schemas
- `types/` shared TypeScript and Supabase types
- `database/` and `supabase/` migrations

## Manual Git Rescue Workflow

Some Codex desktop workspaces can read the repository but cannot write `.git/index.lock`. When that happens:

```bash
git status --short
git add <changed-files>
git commit -m "<message>"
git push origin main
```

Run those commands from a local terminal with normal repository permissions.

## Known Limitations

- Analytics map/heat map needs future UX polish.
- Comment workflow needs more interaction feedback.
- Notifications need deeper cross-user verification.
- Feed cards need stronger visual hierarchy.
- Dashboard/profile navigation needs future IA cleanup.
- Mobile responsiveness needs a full review pass.
- Passport stamp visuals and achievement presentation need refinement.
- Journal editor/photo galleries need richer editing controls.
- Admin workflows need deeper moderation QA.

## Phase 10 Pass 1 Backlog

- Add route-level error boundaries where server actions are most complex.
- Add automated accessibility checks.
- Move from deprecated `next lint` to the ESLint CLI before Next 16.
- Add smoke tests for auth, visit logging, journal, social, analytics, and admin access.
- Add production log/monitoring integration.
