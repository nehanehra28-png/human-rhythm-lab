# Decisions and open questions

Updated: 7 October 2026.

## Confirmed

- Invited testers with email/password accounts and personal dashboards.
- Each participant begins a personal 30-day timeline when invited. Content remains shared within the group.
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
- Supabase and GitHub are connected. A Vercel deployment exists; configuration and AI setup remain pending.

## Provisional implementation defaults

- Unlock at each participant's local midnight, relative to the invitation timestamp in their confirmed timezone.
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

- Actual group size; invitation delivery delays; whether to later change the trigger to first accepted invitation instead of invitation creation.
- Midpoint call date/time/link; final reviewed experience/diet/media content.
- OpenRouter model, budget, routing/data practices, and disclosure.
- Closing feedback sharing and whether a final AI summary is needed.
- Operating jurisdiction, participant age eligibility, privacy notice, retention/export/deletion process.
- Repository, Vercel project, email delivery configuration, and cloud credentials.

## Implementation status

Live admin sign-in and publication are verified; invitation delivery, media, isolation and AI testing remain pending. Personal timeline migration 002 must be applied to the existing Supabase project. See README.md and SETUP.md for verification and setup. Do not treat preview checks as cloud-security verification.
