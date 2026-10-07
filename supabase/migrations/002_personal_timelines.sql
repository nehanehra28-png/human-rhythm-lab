-- Apply after 001_initial.sql. Content stays shared; scheduling is per member.
begin;
alter table public.memberships add column if not exists started_at timestamptz;
-- Preserve day numbers for members who have recorded data. Other existing
-- members start at migration time; new members start when invited.
update public.memberships m
set started_at = case when
 exists(select 1 from public.checkins c where c.user_id=m.user_id and c.cohort_id=m.cohort_id)
 or exists(select 1 from public.reviews r where r.user_id=m.user_id and r.cohort_id=m.cohort_id)
 or exists(select 1 from public.feedback f where f.user_id=m.user_id and f.cohort_id=m.cohort_id)
 then (select c.start_date::timestamp at time zone m.timezone from public.cohorts c where c.id=m.cohort_id)
 else now() end
where m.started_at is null;
alter table public.memberships alter column started_at set default now();
alter table public.memberships alter column started_at set not null;
-- Existing column-level grants permit changing timezone only, never start time.
create or replace function public.current_program_day(cohort uuid) returns integer
 language sql stable security definer set search_path=public as $$
 select ((now() at time zone m.timezone)::date - (m.started_at at time zone m.timezone)::date)+1
 from memberships m where m.user_id=auth.uid() and m.cohort_id=cohort;
$$;
revoke all on function public.current_program_day(uuid) from public;
grant execute on function public.current_program_day(uuid) to authenticated;
commit;
