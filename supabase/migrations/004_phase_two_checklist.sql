begin;
alter table public.experiences drop constraint experiences_day_check;
alter table public.experiences add constraint experiences_day_check check(day between 1 and 15);
create table public.phase_two_checks (
 user_id uuid not null references auth.users(id) on delete cascade,
 cohort_id uuid not null references public.cohorts(id) on delete cascade,
 day integer not null check(day between 16 and 28),
 items jsonb not null default '{}'::jsonb check(jsonb_typeof(items)='object'),
 updated_at timestamptz not null default now(),
 primary key(user_id,cohort_id,day)
);
alter table public.phase_two_checks enable row level security;
grant select,insert,update on public.phase_two_checks to authenticated;
create policy phase_two_own_read on public.phase_two_checks for select to authenticated
 using(user_id=auth.uid() and public.is_cohort_member(cohort_id) and public.current_program_day(cohort_id)>=16);
create policy phase_two_own_insert on public.phase_two_checks for insert to authenticated
 with check(user_id=auth.uid() and public.is_cohort_member(cohort_id) and day<=public.current_program_day(cohort_id) and public.current_program_day(cohort_id) between 16 and 30);
create policy phase_two_own_update on public.phase_two_checks for update to authenticated
 using(user_id=auth.uid() and public.is_cohort_member(cohort_id))
 with check(user_id=auth.uid() and public.is_cohort_member(cohort_id) and day<=public.current_program_day(cohort_id) and public.current_program_day(cohort_id) between 16 and 30);
commit;
