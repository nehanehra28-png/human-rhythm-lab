# Implementation plan

1. Resolve unlock policy, notes visibility, diet tracking, cohort timezone, late joining, scales, weekly trigger, closing feedback, and UI library. Review program content separately.
2. Select auth/database/media providers, package manager, current versions, OpenRouter model/settings, GitHub repository, and Vercel project. Verify official documentation and licenses when selecting.
3. Scaffold the monorepo; implement invitations, accounts, isolation, admin roles, shared schedule, and draft/published media content. Verify access and calendar boundaries.
4. Build dashboard, check-ins, habits, experience responses, shared diet content, charts, and meeting link. Validate persistence, partial data, mobile use, and accessibility.
5. Add weekly AI with minimized payloads, output validation, usage controls, retries, and closing feedback. Verify data isolation and instruction boundaries with synthetic data.
6. Finalize reviewed content, privacy disclosures, access, retention/deletion, and media/call configuration. Run relevant checks, push to the selected GitHub repository, deploy to Vercel, and verify production flows before invitations.

## Current status

Next.js prototype, Supabase migration and integration routes created. Local build, type check, date tests, and browser flows verified. No provider setup, GitHub push, Vercel deployment, or invitation delivery has occurred.


## First-build update — 6 October 2026

See DECISIONS.md for the latest questionnaire answers and README.md for verified implementation status. The Next.js app now exists. Supabase is selected for auth, database, and private media; its migration has not been applied. Admin access excludes private notes. Daily unlocking and diet-phase check-ins are confirmed. Weekly AI is scheduled automatically after each completed program week, with a daily job and bounded processing. Local-time unlocking and 90-day retention remain provisional; retention deletion is not implemented.
