# Agent instructions

Read README.md and docs/DECISIONS.md before implementation. This workspace contains a Next.js app in apps/web, specifications, and an unapplied Supabase migration. Proposed defaults are not confirmed requirements. User instructions take precedence.

## Product and security rules

- Preserve personal invitation-based timelines, shared cohort content, and participant/admin roles.
- Enforce participant ownership and admin authorization server-side on every operation.
- Keep OpenRouter keys and calls server-side.
- AI reflects on recorded data; it does not diagnose or prescribe diets, hydration, or treatment.
- Preserve health callouts and allow skipping without failure labels.
- Weekly reflections appear directly to participants.
- Never fabricate program content, activity completion, findings, or deployment status.

## Implementation

Use TypeScript for the proposed Next.js monorepo. Select versions and providers using current official documentation when implementation begins. Follow the selected UI library. Add shared packages only when warranted. Keep secrets out of source control and avoid logging notes or AI payloads. Use synthetic development data and document required variables in .env.example.

## Verification and delivery

Verify cross-participant isolation, admin permissions, schedule boundaries, published-content visibility, and AI failure behavior. Run npm run typecheck, npm test, and npm run build. Cloud authorization tests require a configured test Supabase project; do not report them as passed without executing them. Check mobile accessibility and media fallbacks. Report actual verification and limitations. Update documents when decisions change. GitHub publishing and Vercel deployment belong to the later implementation phase.
