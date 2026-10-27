-- Explicit least-privilege grants in addition to record policies. Apply after 005.
begin;
-- All application tables: no anonymous access, no implicit DELETE/TRUNCATE rights.
alter table public.cohorts enable row level security;
alter table public.memberships enable row level security;
alter table public.experiences enable row level security;
alter table public.checkins enable row level security;
alter table public.private_notes enable row level security;
alter table public.reviews enable row level security;
alter table public.feedback enable row level security;
alter table public.checkin_entries enable row level security;
alter table public.phase_two_checks enable row level security;
revoke all on public.cohorts, public.memberships, public.experiences,
 public.checkins, public.private_notes, public.reviews, public.feedback,
 public.checkin_entries, public.phase_two_checks from public, anon, authenticated;
-- Column grants survive table-level revocation, so reset the previous grant too.
revoke update(timezone) on public.memberships from authenticated;
grant select on public.cohorts, public.memberships, public.experiences,
 public.checkins, public.private_notes, public.reviews, public.feedback,
 public.checkin_entries, public.phase_two_checks to authenticated;
grant update(meeting_url,meeting_time,diet_plan) on public.cohorts to authenticated;
grant update(timezone) on public.memberships to authenticated;
grant insert,update on public.experiences, public.checkins, public.private_notes,
 public.feedback, public.phase_two_checks to authenticated;
grant insert on public.checkin_entries to authenticated;
-- New tables/functions created by the migration owner have no automatic client access.
alter default privileges in schema public revoke all on tables from public, anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
-- Direct note writes must respect the same schedule as atomic check-in writes.
drop policy own_notes_insert on public.private_notes;
drop policy own_notes_update on public.private_notes;
create policy own_notes_insert on public.private_notes for insert to authenticated
 with check(user_id=auth.uid() and public.is_cohort_member(cohort_id)
 and day<=public.current_program_day(cohort_id) and public.current_program_day(cohort_id) between 1 and 31);
create policy own_notes_update on public.private_notes for update to authenticated
 using(user_id=auth.uid() and public.is_cohort_member(cohort_id))
 with check(user_id=auth.uid() and public.is_cohort_member(cohort_id)
 and day<=public.current_program_day(cohort_id) and public.current_program_day(cohort_id) between 1 and 31);
-- Trigger functions are not public RPC entry points.
revoke execute on function public.validate_member_timezone(), public.stamp_checkin_update() from public, anon, authenticated;
-- Admin summaries expose only authorized score fields, never habits or diet details.
drop policy scores_read on public.checkins;
create policy scores_read on public.checkins for select to authenticated
 using(user_id=auth.uid() and public.is_cohort_member(cohort_id));
create function public.cohort_progress(cohort uuid)
 returns table(user_id uuid,mood integer,energy integer,sleep numeric,day integer,status text,updated_at timestamptz)
 language plpgsql stable security definer set search_path=public as $$
begin
 if not public.is_cohort_admin(cohort) then raise exception 'Admin access required' using errcode='42501'; end if;
 return query select c.user_id,c.mood,c.energy,c.sleep,c.day,c.status,c.updated_at
 from public.checkins c where c.cohort_id=cohort;
end;$$;
revoke all on function public.cohort_progress(uuid) from public, anon, authenticated;
grant execute on function public.cohort_progress(uuid) to authenticated;
commit;
