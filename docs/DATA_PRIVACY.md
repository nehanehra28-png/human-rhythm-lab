# Data privacy

Design requirements and open decisions; not a completed privacy policy or legal compliance assessment.

## Data and access

Account identity, cohort membership, mood/energy/sleep, habit and experience responses, optional notes, weekly reflections, closing feedback. Weight, medical history, and dietary restrictions are not confirmed collection requirements.

Participants see their records and published cohort content. Admins see all progress. Admins cannot read participant notes. The UI explicitly states that notes remain private and that scores/completion are admin-visible.

## Proposed protections

Server-side authorization, encrypted transport, provider-supported storage protections, separate preview/production data, protected secret management, and synthetic test data. Avoid logging notes or AI payloads. Media access policy depends on the selected hosting service.

## AI disclosure

Explain what data is sent for reflections, to which providers, and why. Minimize it; exclude notes by default. Verify provider routing, retention, and data-use settings before launch; do not claim zero retention without evidence.

## Required launch decisions

Define withdrawal, export/deletion request flow, retention after the program, backup deletion timelines, staff access, participant notice/consent, jurisdiction, and age eligibility.

## Content review

The team owns content review. Draft health-related content, including supplied hydration formulas and medicine framing, requires qualified review before publication. Preserve relevant callouts and allow skipping. AI is not a substitute for that review.


## First-build update — 6 October 2026

See DECISIONS.md for the latest questionnaire answers and README.md for verified implementation status. The Next.js app now exists. Supabase is selected for auth, database, and private media; its migration has not been applied. Admin access excludes private notes. Daily unlocking and diet-phase check-ins are confirmed. Weekly AI is scheduled automatically after each completed program week, with a daily job and bounded processing. Local-time unlocking and 90-day retention remain provisional; retention deletion is not implemented.
