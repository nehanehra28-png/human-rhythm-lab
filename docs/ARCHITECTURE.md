# Architecture

Status: proposal. Confirmed stack: Next.js monorepo, OpenRouter, GitHub, Vercel. Implemented foundation: npm workspaces, Next.js 16, React 19, TypeScript, and Supabase.

## Proposed layout

- apps/web: participant/admin Next.js app and server endpoints.
- packages/domain: schedule and validation logic when sharing warrants it.
- packages/ui: shared components only if useful beyond the app.
- docs: specifications and decisions.

## Proposed data entities

User (identity, server-controlled role); Cohort (shared content and meeting settings); Membership (user/cohort, timezone, server-controlled started_at invitation timestamp); Experience (day, structured content, media, publication state); DietPlan (content, version, publication state); CheckIn (membership, day, mood/energy/sleep/notes); Habit and HabitEntry; ExperienceResponse; WeeklyReview (window, source version, model, result/status); FeedbackCall (cohort, time, URL); ClosingFeedback.

Supabase handles authentication, Postgres, and private media. Notes are separated from scores to enforce participant-only access. The migration remains unapplied. Media uploads and HTTPS links are supported; keep large media out of Git.

## Authorization and scheduling

Derive identity from the server session. Scope participant queries to owned memberships. Verify admin roles server-side; never trust client-supplied roles. Check cohort membership for content and meeting links. Invitation tokens, if used, expire and are single-use.

Compute personal program day from invitation and current calendar dates in the participant timezone, not elapsed 24-hour blocks. Handle pre-start/post-program states. Daily unlocking is confirmed. Local midnight advances each personal day independently. New invitations start Day 1; shared content does not imply a shared calendar.

## AI and deployment

Server builds a minimized permitted-data payload, calls OpenRouter, validates output, and stores the reflection. Prevent duplicate generation and enforce usage limits. Verify provider/model data settings before sending real data.

Vercel hosts apps/web. Separate preview/production data and credentials. Repository, project, migration workflow, and media service selection happen during implementation; nothing has been provisioned.


## First-build update — 6 October 2026

See DECISIONS.md for the latest questionnaire answers and README.md for verified implementation status. The Next.js app now exists. Supabase is selected for auth, database, and private media; its migration has not been applied. Admin access excludes private notes. Daily unlocking and diet-phase check-ins are confirmed. Weekly AI is scheduled automatically after each completed program week, with a daily job and bounded processing. Local-time unlocking and 90-day retention remain provisional; retention deletion is not implemented.
