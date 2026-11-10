# Pilot security release

This patch adds durable API/write quotas, validated request bodies, development/preview database isolation, server-authorized upload allocation and explicit default-off AI/upload gates. Participant timelines and UI remain as deployed except the secured upload request flow and configuration guard.

## Required configuration and order

1. Verify a recent private database/media backup. Apply migrations007 and008 only; do not reapply001–006.
2. In Vercel Production set RATE_LIMIT_HASH_KEY to an independent random secret of at least32 characters, AI_REVIEWS_ENABLED=false and PROGRAM_UPLOADS_ENABLED=false. Never expose the hash key as NEXT_PUBLIC or in logs. Existing Supabase URL, public key, server key and APP_URL remain required.
3. Preview/development require their own development project credentials and NEXT_PUBLIC_SUPABASE_DEV_PROJECT_REF=bmrjzdnpiujfguycurrq. Unconfigured previews fail closed; do not copy production keys to previews.
4. Deploy the matching source and verify authenticated reads/writes, admin summaries and disabled feature gates. Migrations alone do not install HTTP quotas in the currently deployed older API.

## Evidence

On9 November2026 typecheck,21 unit tests and production build passed. An isolated offline production-backup restore accepted migration007 and retained every exported table row count. On10 November2026 twenty real-token development checks passed, including ownership, cross-cohort/admin scope, private-note denial, schedule/content locking and atomic quotas. Twenty simultaneous budget calls yielded5 successes/15 denials;12 concurrent app writes with the synthetic user preseeded to24/30 yielded6 successes/6 HTTP429 denials. The development server was stopped and synthetic fixtures retained. The development server-role invitation INSERT grant was subsequently applied and verified; client membership INSERT remains denied.

## Known limits

Custom per-user failed-OTP cooldown is not implemented. Provider Auth settings and delivery must be verified independently. Invitation account creation and cohort assignment are separate operations without complete retry/recovery. File-content inspection and AI-provider failure/spend verification remain pending; AI and new uploads must remain disabled. Vercel's trusted-IP path still requires deployment verification. Counter expiry is recorded but automatic deletion is not configured. Backup is local; off-device recovery and scheduling remain pending. A pilot requires reviewed content, participant notice/eligibility and an agreed manual retention/export/deletion process.

Do not represent development tests as production verification or claim that deployment has occurred until the release is complete.
