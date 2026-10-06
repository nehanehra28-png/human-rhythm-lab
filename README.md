# Human Rhythm Lab

A first working Next.js app for a guided 30-day wellness program for invited testers. Local development supports a clearly labeled sample-data preview. Cloud integrations require setup and live verification.

Participants sign in to their own dashboards. A cohort follows the same schedule: 14 days of guided experiences, a midpoint feedback call, 14 days of a shared admin-prepared diet plan, and two closing days. Weekly AI reflections appear directly to participants.

## Planned stack

Next.js monorepo, an owner-supplied MIT-licensed UI library, server-side OpenRouter, GitHub, and Vercel. Supabase is selected for authentication, Postgres, and private media storage. The project uses npm workspaces, Next.js 16, React 19, and TypeScript. Higgsfield is optional and outside MVP scope unless a specific need arises.

## Documents

- [Product brief](docs/PRODUCT_BRIEF.md)
- [MVP specification](docs/MVP_SPEC.md)
- [UI guidelines](docs/UI_GUIDELINES.md)
- [Architecture](docs/ARCHITECTURE.md)
- [AI behavior](docs/AI_BEHAVIOR.md)
- [Data privacy](docs/DATA_PRIVACY.md)
- [Implementation plan](docs/IMPLEMENTATION_PLAN.md)
- [Decisions](docs/DECISIONS.md)
- [Agent instructions](AGENTS.md)

## Setup status

Run from this folder:

```sh
npm install
npm run dev
```

Open http://127.0.0.1:3000. With no Supabase configuration, development uses sample content and browser storage. This is not a real multi-user account system. Production without Supabase configuration shows an unavailable-services screen, not demo admin controls.

```sh
npm run typecheck
npm test
npm run build
```

See [cloud setup](docs/SETUP.md) for invitations, media, AI, and deployment. `.env.example` contains placeholders only. Never commit credentials. A Supabase project is connected; hosting and AI remain pending. Local settings, screenshots, and backup archives are excluded from Git.

## First version

Participant dashboard, check-ins, habits, locked daily calendar, shared diet display, weekly charts, closing feedback, timezone preferences, and admin draft/publish editor. Live admin sign-in and experience publication have been verified. Invitation requests have succeeded, but email delivery still needs configuration and verification. Media and weekly AI testing are deferred.

The design uses Beautiful UI as a visual reference; no Beautiful UI source components or commercial icons have been copied. Icons come from lucide-react.

## Verification

TypeScript check, production build, and four calendar/summary tests passed. Browser checks covered saving and refreshing a synthetic check-in, draft visibility, future-day locking, and desktop/mobile layout. Database policies and provider calls remain unverified until services are configured.
