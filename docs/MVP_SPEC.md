# MVP specification

## Invitations and accounts

Invited testers sign in to personal dashboards; admins access an authorized management area. Supabase email/password sign-in and admin invitations are implemented; provider setup and live testing are pending.

Acceptance: unauthenticated access is rejected; participants cannot read others' records by changing identifiers; admin access is verified server-side.

## Personal program timelines

Each membership has a server-controlled invitation start timestamp. Its local calendar date governs days 1–14 experiences, days 15–28 diet, and days 29–30 closing review/feedback. A new invite starts Day 1 independently of other members. Configure the midpoint call separately.

Acceptance: two participants invited on different dates see their own day and phase. Content, media, check-ins, closing feedback and weekly reviews use the same personal timeline. New invitations begin at Day 1; future days stay locked. Participants confirm timezone. Invitation timestamps cannot be edited by participants.

## Experiences and media

Admin publishes introduction, instructions, preparation, explanation, health callouts, video, and infographic. The team creates assets outside the app. Proposed workflow: draft, preview, publish.

Acceptance: drafts stay hidden; health callouts precede instructions; missing media has a readable fallback; missing content displays an empty state. Do not invent content.

## Check-ins and habits

Mood, energy, sleep duration, optional notes, and movement/focus/bedtime/custom habit tracking. Proposed: one editable check-in per cohort day and completed/partially completed/skipped experience responses.

Acceptance: data persists after refresh, belongs to the signed-in participant, and is validated. Missing values are not charted as zero. Skipping has no failure label. Scales and custom-habit rules remain open.

## Shared diet plan

Admin prepares and publishes one common plan during days 15–28. AI does not generate or personalize it. Continued check-ins and daily adherence tracking are confirmed.

Acceptance: members see the same published plan; drafts stay hidden; revisions have a publication timestamp.

## Weekly review

Charts show recorded mood, energy, sleep, and habits. AI reflections appear directly. Proposed windows: days 1–7, 8–14, 15–21, 22–28. Generation is automatic after the program week ends; three entries are the provisional minimum.

Acceptance: reflections use only permitted participant data, acknowledge gaps, avoid prescriptions and causal certainty, and provide failure/retry states. Charts work without AI.

## Admin and feedback call

Admin views all participant progress and sets a Zoom or Teams link and call time. No meeting API or booking integration is required. Free-text notes remain private and are excluded from admin queries.

Acceptance: progress matches saved records; only cohort members can access meeting details; admin updates persist.

## Closing days

Days 29–30 contain final review and feedback. Questions, format, and optional AI closing summary remain open.


## First-build update — 6 October 2026

See DECISIONS.md for the latest questionnaire answers and README.md for verified implementation status. The Next.js app now exists. Supabase is selected for auth, database, and private media; its migration has not been applied. Admin access excludes private notes. Daily unlocking and diet-phase check-ins are confirmed. Weekly AI is scheduled automatically after each completed program week, with a daily job and bounded processing. Local-time unlocking and 90-day retention remain provisional; retention deletion is not implemented.
