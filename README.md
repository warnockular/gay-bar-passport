# Gay Bar Passport

Gay Bar Passport is a luxury queer travel journal app foundation built with Next.js 15, TypeScript, Tailwind CSS, shadcn/ui conventions, Supabase client setup, TanStack Query, Zod, React Hook Form, and Lucide icons.

Phase 3 adds usable authentication and profile management: sign up, sign in, magic links, password reset, protected sessions, profile creation, and avatar uploads.

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

Supabase is optional for local setup mode, but required for real sign-in, protected sessions, profile management, and authenticated visit data.

## Project Structure

- `app/` contains App Router routes. Pages like `/venues`, `/passport`, `/journal`, `/dashboard`, and `/auth/sign-in` live here.
- `components/` contains reusable layout and display components.
- `components/ui/` contains shadcn-style primitives such as buttons, cards, inputs, labels, badges, and separators.
- `features/` contains product-specific feature modules. Auth forms/actions live in `features/auth/`, and profile editing lives in `features/profile/`.
- `lib/` contains shared app utilities, environment validation, and Supabase client factories.
- `hooks/` contains reusable React hooks.
- `services/` contains external service wrappers and database reads. `services/unsplash.ts` is the placeholder image service.
- `schemas/` contains Zod schemas shared by forms and future server actions.
- `types/` contains shared TypeScript types, including the placeholder Supabase database type.
- `database/` contains migrations and optional seed SQL.
- `supabase/` contains CLI project configuration for linking a real Supabase project.

## Routes

- `/` landing page
- `/auth/sign-in`
- `/auth/sign-up`
- `/auth/reset-password`
- `/auth/update-password`
- `/dashboard`
- `/profile`
- `/venues`
- `/passport`
- `/journal`

## Phase 3 Notes

Implemented:

- Supabase schema for profiles, venues, visits, passport stamps, and journal entries.
- Row Level Security policies for user-owned data.
- Supabase Auth sign-in, sign-up, sign-out, magic link, password reset, and password update actions.
- Middleware protection for `/dashboard`, `/passport`, `/journal`, `/profile`, and `/auth/update-password`.
- Profile form with display name, home city, and avatar upload.
- Public `avatars` storage bucket with owner-scoped upload/update/delete policies.
- Session-aware navigation and dashboard profile entry point.
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
3. Run `database/migrations/002_phase_3_auth_profiles.sql`.
4. Optionally run `database/seed.sql`.
5. Copy your project URL and anon key into `.env.local`.
6. In Supabase Auth settings, set the site URL to your local or Vercel URL.
7. Add redirect URLs for:
   - `http://localhost:3000/auth/callback`
   - `https://your-vercel-domain.vercel.app/auth/callback`

## Deployment Plan

Use GitHub, Supabase, and Vercel:

1. Push this project to a GitHub repository.
2. Create or link a Supabase project and run the migrations.
3. Import the GitHub repository into Vercel.
4. Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_SITE_URL` in Vercel project environment variables.
5. Deploy from Vercel.
