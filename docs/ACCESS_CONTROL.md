# Access control inventory

Updated 27 October 2026. Deny by default: an operation requires both an explicit grant and a matching record-level policy. No client-supplied user ID, cohort ID or role determines authorization. Hidden buttons are presentation only.

## Pages and server endpoints

| Surface | Read or change permission | Enforcement |
| --- | --- | --- |
| `/` (only app page; Dashboard, Experience, Reflections, Account and admin are client views) | Public sign-in shell and static branding; personal data only after verified membership | Page contains no server-rendered participant data. Every data request verifies the bearer token with Supabase `getUser`, loads that user's membership, validates participant/admin role, then applies RLS. Production has no sample-data fallback. |
| `GET /api/state` | Member's own cohort, own records; participant published/unlocked experiences; cohort admin can read drafts and cohort score summaries | User/cohort predicates plus RLS. Admin summary RPC authorizes exact cohort and returns only scores, response and timestamp, never notes/history/habits/diet. |
| `POST /api/state`: `checkin`, `checkinEntry` | Member's own available Days 1–31 while program active | Same origin, verified membership, validated values/day; invoker RPC derives `auth.uid()` and RLS enforces ownership/schedule. |
| `POST /api/state`: `phaseTwoChecklist` | Own available Days 16–31 while program active | Server derives user/cohort; validates day and checklist values; RLS repeats ownership/schedule checks. |
| `POST /api/state`: `timezone` | Own timezone only | Server user/cohort predicates, column grant, ownership policy and database timezone validation. |
| `POST /api/state`: `feedback` | Own closing feedback from Day 29 | Server identity and day check; ownership and day policy. |
| `POST /api/state`: `experience`, `settings` | Admin's own cohort only | Server admin check and cohort scope, column/value allowlists, admin RLS. |
| `POST /api/state`: `retryReviews` | Admin retries failed reviews in own cohort | Verified admin before service client; cohort and failed-status filters. Service key bypasses RLS. |
| `POST /api/invite` | Admin invites participant into admin's own cohort | Verified admin and same origin before privileged Auth invitation; membership role and cohort assigned server-side. No caller-selected role/cohort. |
| `GET /api/reviews` | Scheduled job only, not participant/admin bearer tokens | Exact server `CRON_SECRET` bearer check; missing secret denies. Privileged job enumerates participant memberships and scopes every review/check-in query to exact user/cohort/week. Structured records only; no private notes. |
| Unknown actions or unsupported HTTP methods | Denied | Action allowlist; Next.js rejects unimplemented methods. |

All mutations above except the secret-authenticated scheduled job require same-origin requests. Static assets contain no private records. Login OTP endpoints are Supabase-managed, not custom Next.js routes.

## Every application table

All nine tables have RLS enabled in migrations. Anonymous clients have no grants. No participant/admin client may DELETE or TRUNCATE records. A database owner/service role is a privileged operational exception, not an app user; keep its credentials server-side.

| Table | Participant read | Participant change | Cohort admin read/change |
| --- | --- | --- | --- |
| `public.cohorts` | Own cohort | None | Own cohort; change meeting URL/time and diet plan only |
| `public.memberships` | Own membership | Own timezone only | Own cohort memberships; own timezone only. Role, cohort, start time and invitation assignment require server provisioning. |
| `public.experiences` | Own cohort, published and unlocked day | None | Own cohort drafts/published content; insert/update only |
| `public.checkins` | Own records in own cohort | Own available days while current day is 1–31 | Own records only through table access. Cohort scores/completion via authorized `cohort_progress` RPC only; no habits, diet or notes and no changes to others. |
| `public.private_notes` | Own only | Own available days while current day is 1–31; linked check-in required | Own notes only; never other participants' notes |
| `public.checkin_entries` | Own only | Append own available days while program active; no edit/delete | Own history only; never participants' private history |
| `public.phase_two_checks` | Own only from personal Day 16 | Own available days 16–31 while program active | Own checklist only; no access to participants' item records |
| `public.feedback` | Own only | Own insert/update from Day 29 | Own only; no participant feedback access |
| `public.reviews` | Own only | None | Own only. Cron writes; authorized admin retry uses server service role scoped to cohort and failed status. |

## Storage, authentication and functions

`storage.objects` uses Supabase-managed RLS. Private `program-media` bucket: admin insert only under own cohort UUID folder; admin may read own cohort media; participant may read only an exact object referenced by a published, unlocked experience in own cohort. No client update/delete policy. Signed URLs are temporary bearer links and can be shared until expiry. HTTPS external media has its host's access policy.

`storage.buckets`, `auth.users` and other Supabase-managed system tables are maintained by Supabase. They are not application tables and must not be granted general public-schema access. Auth account operations use Supabase Auth; the invitation endpoint uses the server admin API. Do not blindly alter managed schemas.

`cohort_progress`: authenticated-only security-definer RPC, fixed search path, checks current user is admin of requested cohort before returning an allowlist of score fields.

`is_cohort_member`, `is_cohort_admin`, `current_program_day`: authenticated execution only, fixed search path, derive current user's membership; security-definer helpers expose no other member's records. `save_checkin` and `save_checkin_entry`: authenticated execution only, security invoker, derive user from `auth.uid()`, RLS applies. Trigger functions are not callable by app roles after migration 006.

## New tables and verification

Migration 006 resets client grants and revokes default table/function grants for the migration creator in `public`. Every future table must explicitly enable RLS and define least-privilege grants/policies before deployment. Defaults are per creator role; migrations run under another role need the same default-privilege setup. New views must use invoker security or remain inaccessible. Never assume a service-role query is protected by RLS.

Run `supabase/tests/access.sql` ONLY in an isolated Supabase test project after migrations 001–006. It uses synthetic participants in separate cohorts and an admin, tests privacy, draft visibility, escalation denial, future/cross-cohort write denial and repeated saves, and rolls back. The catalog assertion fails if any public table lacks RLS. Also exercise HTTP endpoints with separate real test tokens, phase-boundary clocks, media signing and AI provider failure before declaring the audit verified.

Status, 27 October 2026: migration 006 applied successfully to production. `live_access_readonly.sql` passed against existing memberships using database-role impersonation: all public tables have RLS, other users’ private records are invisible, cohort scope is enforced, anonymous score reads are denied and role-column escalation is denied. This does not verify browser tokens or synthetic writes. The rollback-only synthetic test suite and separate-token HTTP/media/AI failure tests remain pending in an isolated test project. Local typecheck, 13 unit tests and production build passed.

Reference: [Supabase RLS and grants](https://supabase.com/docs/guides/database/postgres/row-level-security).
