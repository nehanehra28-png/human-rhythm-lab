-- Preserve daily summaries; retain every explicit check-in privately.
begin;
create table public.checkin_entries (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 cohort_id uuid not null references public.cohorts(id) on delete cascade,
 day integer not null check(day between 1 and 30),
 mood integer not null check(mood between 1 and 5),
 energy integer not null check(energy between 1 and 5),
 sleep numeric not null check(sleep between 0 and 24),
 notes text not null default '' check(length(notes)<=2000),
 created_at timestamptz not null default now()
);
create index checkin_entries_owner on public.checkin_entries(user_id,cohort_id,day,created_at);
alter table public.checkin_entries enable row level security;
grant select,insert on public.checkin_entries to authenticated;
create policy entries_own_read on public.checkin_entries for select to authenticated
 using(user_id=auth.uid() and public.is_cohort_member(cohort_id));
create policy entries_own_insert on public.checkin_entries for insert to authenticated
 with check(user_id=auth.uid() and public.is_cohort_member(cohort_id)
 and day<=public.current_program_day(cohort_id) and public.current_program_day(cohort_id) between 1 and 30);
create function public.save_checkin_entry(cohort uuid,program_day integer,mood_score integer,energy_score integer,sleep_hours numeric,habit_names text[],response_status text,diet_followed boolean,private_note text)
 returns void language plpgsql security invoker set search_path=public as $$
begin
 perform public.save_checkin(cohort,program_day,mood_score,energy_score,sleep_hours,habit_names,response_status,diet_followed,private_note);
 insert into public.checkin_entries(user_id,cohort_id,day,mood,energy,sleep,notes)
 values(auth.uid(),cohort,program_day,mood_score,energy_score,sleep_hours,private_note);
end;$$;
revoke all on function public.save_checkin_entry(uuid,integer,integer,integer,numeric,text[],text,boolean,text) from public;
grant execute on function public.save_checkin_entry(uuid,integer,integer,integer,numeric,text[],text,boolean,text) to authenticated;
commit;
