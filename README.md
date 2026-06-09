# Gay Bar Passport

Gay Bar Passport is a luxury queer travel journal app foundation built with Next.js 15, TypeScript, Tailwind CSS, shadcn/ui conventions, Supabase client setup, TanStack Query, Zod, React Hook Form, and Lucide icons.

Phase 2 adds the first real data and auth foundation: Supabase migrations, generated-style database types, protected routes, auth actions, and initial TanStack Query hooks.

## Run Locally

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

If you use npm instead:

```bash
npm install
npm run dev
```

## Environment Variables

Copy `.env.example` to `.env.local`.

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Supabase is optional for local setup mode, but required for real sign-in, protected sessions, and authenticated visit data.

## Project Structure

- `app/` contains App Router routes. Pages like `/venues`, `/passport`, `/journal`, `/dashboard`, and `/auth/sign-in` live here.
- `components/` contains reusable layout and display components.
- `components/ui/` contains shadcn-style primitives such as buttons, cards, inputs, labels, badges, and separators.
- `features/` is reserved for product-specific feature modules. The Phase 1 auth form lives in `features/auth/`.
- `lib/` contains shared app utilities, environment validation, and Supabase client factories.
- `hooks/` contains reusable React hooks.
- `services/` contains external service wrappers. `services/unsplash.ts` is the placeholder image service.
- `schemas/` contains Zod schemas shared by forms and future server actions.
- `types/` contains shared TypeScript types, including the placeholder Supabase database type.
- `database/` contains the Phase 2 migration and optional seed SQL.
- `supabase/` contains CLI project configuration for linking a real Supabase project.

## Routes

- `/` landing page
- `/auth/sign-in`
- `/auth/sign-up`
- `/dashboard`
- `/venues`
- `/passport`
- `/journal`

## Phase 2 Notes

Implemented:

- Supabase schema for profiles, venues, visits, passport stamps, and journal entries.
- Row Level Security policies for user-owned data.
- Supabase Auth sign-in, sign-up, and sign-out actions.
- Middleware protection for `/dashboard`, `/passport`, and `/journal`.
- Public venue query hook with static fallback data before Supabase is configured.
- Authenticated visit query hook, ready for future visit logging.

Not implemented yet:

- Venue CRUD.
- Visit logging forms.
- Journal CRUD.
- Analytics calculations.
- Passport stamp earning rules.

## Supabase Setup

1. Create a Supabase project.
2. Run `database/migrations/001_initial_phase_2_schema.sql`.
3. Optionally run `database/seed.sql`.
4. Copy your project URL and anon key into `.env.local`.
5. In Supabase Auth settings, set the site URL to your local or Vercel URL.

## Deployment Plan

Use GitHub, Supabase, and Vercel:

1. Push this project to a GitHub repository.
2. Create or link a Supabase project and run the migration.
3. Import the GitHub repository into Vercel.
4. Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_SITE_URL` in Vercel project environment variables.
5. Deploy from Vercel.
