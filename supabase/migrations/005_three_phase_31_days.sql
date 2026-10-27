begin;
alter table public.checkins drop constraint checkins_day_check;
alter table public.checkins add constraint checkins_day_check check(day between 1 and 31);
alter table public.checkin_entries drop constraint checkin_entries_day_check;
alter table public.checkin_entries add constraint checkin_entries_day_check check(day between 1 and 31);
alter table public.phase_two_checks drop constraint phase_two_checks_day_check;
alter table public.phase_two_checks add constraint phase_two_checks_day_check check(day between 16 and 31);
-- Do not invent timestamps for historical summaries.
alter table public.checkins add column updated_at timestamptz;
alter table public.checkins alter column updated_at set default now();
create function public.stamp_checkin_update() returns trigger language plpgsql security invoker set search_path=public as $$
begin new.updated_at = clock_timestamp(); return new; end;$$;
create trigger checkin_saved_timestamp before insert or update on public.checkins for each row execute function public.stamp_checkin_update();
drop policy own_checkin_insert on public.checkins;
drop policy own_checkin_update on public.checkins;
create policy own_checkin_insert on public.checkins for insert to authenticated with check(user_id=auth.uid() and public.is_cohort_member(cohort_id) and day<=public.current_program_day(cohort_id) and public.current_program_day(cohort_id) between 1 and 31);
create policy own_checkin_update on public.checkins for update to authenticated using(user_id=auth.uid() and public.is_cohort_member(cohort_id)) with check(user_id=auth.uid() and public.is_cohort_member(cohort_id) and day<=public.current_program_day(cohort_id) and public.current_program_day(cohort_id) between 1 and 31);
drop policy entries_own_insert on public.checkin_entries;
create policy entries_own_insert on public.checkin_entries for insert to authenticated with check(user_id=auth.uid() and public.is_cohort_member(cohort_id) and day<=public.current_program_day(cohort_id) and public.current_program_day(cohort_id) between 1 and 31);
drop policy phase_two_own_insert on public.phase_two_checks;
drop policy phase_two_own_update on public.phase_two_checks;
create policy phase_two_own_insert on public.phase_two_checks for insert to authenticated with check(user_id=auth.uid() and public.is_cohort_member(cohort_id) and day<=public.current_program_day(cohort_id) and public.current_program_day(cohort_id) between 16 and 31);
create policy phase_two_own_update on public.phase_two_checks for update to authenticated using(user_id=auth.uid() and public.is_cohort_member(cohort_id)) with check(user_id=auth.uid() and public.is_cohort_member(cohort_id) and day<=public.current_program_day(cohort_id) and public.current_program_day(cohort_id) between 16 and 31);
commit;
