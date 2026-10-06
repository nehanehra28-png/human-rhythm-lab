# Decisions and open questions

Updated: 6 October 2026.

## Confirmed

- Invited testers with email/password accounts and personal dashboards.
- A group follows one shared start date for a 30-day program.
- Days 1–14 guided experiences, a midpoint feedback call, days 15–28 a shared admin-prepared diet plan, and days 29–30 closing review/feedback.
- The team creates written content, video, and infographics; an admin publishes them.
- Content unlocks daily; previous experiences remain accessible.
- Admins see completion and scores only. Participant notes stay private.
- Mood, energy, sleep, and diet adherence tracking continue through the diet phase.
- Weekly AI reflections appear automatically after each program week, directly to participants.
- Admin supplies a Zoom or Teams link.
- Participant timezone reflects where they join; testers confirm a city timezone.
- Warm green styling based on the Beautiful UI reference.
- Next.js monorepo, server-side OpenRouter, GitHub, Vercel.
- Builder chooses account/database/media services: Supabase selected.
- GitHub, Vercel, OpenRouter, and Supabase accounts/projects still need setup.

## Provisional implementation defaults

- Unlock at each participant's local midnight. Shared-time versus local-time unlock remains unresolved.
- One editable check-in per cohort day; scores range 1–5.
- Completed/partially completed/skipped responses, without failure labels.
- Personal custom rituals can be recorded in the daily check-in; reusable custom habit definitions are deferred.
- Review windows end on days 7, 14, 21, and 28. At least three entries are required for an AI reflection.
- Daily 06:00 UTC job processes up to four reviews; larger cohorts need queue capacity changes.
- Private notes are excluded from AI payloads.
- Videos/images upload to private storage, up to 50 MB each; HTTPS hosted media links also supported.
- Closing feedback: overall rating, most useful part, ease, changes noticed, improvement suggestions.
- Ninety-day post-program retention is proposed, not approved or automated.

## Open decisions before pilot launch

- Actual group size and start date; late-join rules; exact unlock synchronization.
- Midpoint call date/time/link; final reviewed experience/diet/media content.
- OpenRouter model, budget, routing/data practices, and disclosure.
- Closing feedback sharing and whether a final AI summary is needed.
- Operating jurisdiction, participant age eligibility, privacy notice, retention/export/deletion process.
- Repository, Vercel project, email delivery configuration, and cloud credentials.

## Implementation status

Local prototype works with labeled sample data and browser storage. Supabase sign-in, invitation, score/note storage, private media, and scheduled AI routes are written, but no Supabase migration or live provider test has run. See README.md and SETUP.md for verification and setup. Do not treat preview checks as cloud-security verification.
