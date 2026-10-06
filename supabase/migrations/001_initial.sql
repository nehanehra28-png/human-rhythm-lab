-- Apply to a new Supabase project. This migration does not seed medical content.
begin;
create table public.cohorts (
 id uuid primary key default gen_random_uuid(), name text not null,
 start_date date not null, meeting_url text not null default '', meeting_time timestamptz,
 diet_plan text not null default '', created_at timestamptz not null default now()
);
create table public.memberships (
 user_id uuid primary key references auth.users(id) on delete cascade,
 cohort_id uuid not null references public.cohorts(id) on delete cascade,
 role text not null default 'participant' check(role in ('participant','admin')),
 display_name text not null default '', timezone text not null default 'UTC'
);
create or replace function public.is_cohort_admin(cohort uuid) returns boolean
 language sql stable security definer set search_path=public as $$
 select exists(select 1 from memberships where user_id=auth.uid() and cohort_id=cohort and role='admin');
$$;
create or replace function public.is_cohort_member(cohort uuid) returns boolean
 language sql stable security definer set search_path=public as $$
 select exists(select 1 from memberships where user_id=auth.uid() and cohort_id=cohort);
$$;
create or replace function public.current_program_day(cohort uuid) returns integer
 language sql stable security definer set search_path=public as $$
 select ((now() at time zone m.timezone)::date-c.start_date)+1 from memberships m join cohorts c on c.id=m.cohort_id where m.user_id=auth.uid() and m.cohort_id=cohort;
$$;
revoke all on function public.is_cohort_admin(uuid),public.is_cohort_member(uuid),public.current_program_day(uuid) from public;
grant execute on function public.is_cohort_admin(uuid),public.is_cohort_member(uuid),public.current_program_day(uuid) to authenticated;
create table public.experiences (
 cohort_id uuid not null references public.cohorts(id) on delete cascade, day integer not null check(day between 1 and 14),
 title text not null, subtitle text not null default '', instructions text not null default '', needs text not null default '', why text not null default '',
 callout text not null default '', video text not null default '', transcript text not null default '', infographic text not null default '', alt text not null default '', published boolean not null default false,
 primary key(cohort_id,day)
);
create table public.checkins (
 user_id uuid not null references auth.users(id) on delete cascade,cohort_id uuid not null references public.cohorts(id) on delete cascade,
 day integer not null check(day between 1 and 30),mood integer not null check(mood between 1 and 5),energy integer not null check(energy between 1 and 5),sleep numeric not null check(sleep between 0 and 24),
 habits text[] not null default '{}',status text not null default 'not recorded' check(status in ('not recorded','completed','partially completed','skipped')),diet boolean not null default false,
 primary key(user_id,cohort_id,day)
);
create table public.private_notes (
 user_id uuid not null,cohort_id uuid not null,day integer not null,notes text not null default '' check(length(notes)<=2000),
 primary key(user_id,cohort_id,day),foreign key(user_id,cohort_id,day) references public.checkins(user_id,cohort_id,day) on delete cascade
);
create table public.reviews (
 user_id uuid not null references auth.users(id) on delete cascade,cohort_id uuid not null references public.cohorts(id) on delete cascade,
 week integer not null check(week between 1 and 4),reflection text not null default '',status text not null check(status in ('pending','completed','failed','insufficient')),model text,prompt_version text,updated_at timestamptz not null default now(),primary key(user_id,cohort_id,week)
);
create table public.feedback (
 user_id uuid not null references auth.users(id) on delete cascade,cohort_id uuid not null references public.cohorts(id) on delete cascade,answers jsonb not null,primary key(user_id,cohort_id)
);
alter table public.cohorts enable row level security;
alter table public.memberships enable row level security;
alter table public.experiences enable row level security;
alter table public.checkins enable row level security;
alter table public.private_notes enable row level security;
alter table public.reviews enable row level security;
alter table public.feedback enable row level security;
create policy cohort_read on public.cohorts for select to authenticated using(public.is_cohort_member(id));
create policy cohort_edit on public.cohorts for update to authenticated using(public.is_cohort_admin(id)) with check(public.is_cohort_admin(id));
create policy member_read on public.memberships for select to authenticated using(user_id=auth.uid() or public.is_cohort_admin(cohort_id));
create policy own_timezone on public.memberships for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create function public.validate_member_timezone() returns trigger language plpgsql set search_path=public as $$
begin
 if not exists(select 1 from pg_timezone_names where name=new.timezone) then raise exception 'Invalid timezone';end if;
 return new;
end;$$;
create trigger validate_timezone before insert or update on public.memberships for each row execute function public.validate_member_timezone();
-- Role and cohort assignment are never writable by participants or admins through the browser.
revoke update on public.memberships from authenticated;
grant update(timezone) on public.memberships to authenticated;
create policy published_experience on public.experiences for select to authenticated using(public.is_cohort_admin(cohort_id) or (public.is_cohort_member(cohort_id) and published and day<=public.current_program_day(cohort_id)));
create policy admin_experience_insert on public.experiences for insert to authenticated with check(public.is_cohort_admin(cohort_id));
create policy admin_experience_update on public.experiences for update to authenticated using(public.is_cohort_admin(cohort_id)) with check(public.is_cohort_admin(cohort_id));
create policy scores_read on public.checkins for select to authenticated using((user_id=auth.uid() and public.is_cohort_member(cohort_id)) or public.is_cohort_admin(cohort_id));
create policy own_checkin_insert on public.checkins for insert to authenticated with check(user_id=auth.uid() and public.is_cohort_member(cohort_id) and day<=public.current_program_day(cohort_id) and public.current_program_day(cohort_id) between 1 and 30);
create policy own_checkin_update on public.checkins for update to authenticated using(user_id=auth.uid() and public.is_cohort_member(cohort_id)) with check(user_id=auth.uid() and public.is_cohort_member(cohort_id) and day<=public.current_program_day(cohort_id) and public.current_program_day(cohort_id) between 1 and 30);
create policy own_notes_read on public.private_notes for select to authenticated using(user_id=auth.uid() and public.is_cohort_member(cohort_id));
create policy own_notes_insert on public.private_notes for insert to authenticated with check(user_id=auth.uid() and public.is_cohort_member(cohort_id));
create policy own_notes_update on public.private_notes for update to authenticated using(user_id=auth.uid() and public.is_cohort_member(cohort_id)) with check(user_id=auth.uid() and public.is_cohort_member(cohort_id));
create policy own_reviews on public.reviews for select to authenticated using(user_id=auth.uid() and public.is_cohort_member(cohort_id));
create policy own_feedback_read on public.feedback for select to authenticated using(user_id=auth.uid() and public.is_cohort_member(cohort_id));
create policy own_feedback_insert on public.feedback for insert to authenticated with check(user_id=auth.uid() and public.is_cohort_member(cohort_id) and public.current_program_day(cohort_id)>=29);
create policy own_feedback_update on public.feedback for update to authenticated using(user_id=auth.uid() and public.is_cohort_member(cohort_id)) with check(user_id=auth.uid() and public.is_cohort_member(cohort_id) and public.current_program_day(cohort_id)>=29);
-- Atomic check-in + private note save. Invoker mode preserves RLS on both tables.
create function public.save_checkin(cohort uuid,program_day integer,mood_score integer,energy_score integer,sleep_hours numeric,habit_names text[],response_status text,diet_followed boolean,private_note text) returns void language plpgsql security invoker set search_path=public as $$
begin
 if cardinality(habit_names)>20 or exists(select 1 from unnest(habit_names) h where length(h)>60) then raise exception 'Invalid habits';end if;
 insert into checkins(user_id,cohort_id,day,mood,energy,sleep,habits,status,diet) values(auth.uid(),cohort,program_day,mood_score,energy_score,sleep_hours,habit_names,response_status,diet_followed)
 on conflict(user_id,cohort_id,day) do update set mood=excluded.mood,energy=excluded.energy,sleep=excluded.sleep,habits=excluded.habits,status=excluded.status,diet=excluded.diet;
 insert into private_notes(user_id,cohort_id,day,notes) values(auth.uid(),cohort,program_day,private_note) on conflict(user_id,cohort_id,day) do update set notes=excluded.notes;
end;$$;
revoke all on function public.save_checkin(uuid,integer,integer,integer,numeric,text[],text,boolean,text) from public;
grant execute on function public.save_checkin(uuid,integer,integer,integer,numeric,text[],text,boolean,text) to authenticated;
-- Private media. Paths are <cohort UUID>/<random file UUID>.<extension>.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('program-media','program-media',false,52428800,array['video/mp4','video/webm','image/png','image/jpeg','image/webp']);
create policy admin_media_upload on storage.objects for insert to authenticated with check(bucket_id='program-media' and exists(select 1 from public.memberships m where m.user_id=auth.uid() and m.role='admin' and m.cohort_id::text=(storage.foldername(name))[1]));
create policy published_media_read on storage.objects for select to authenticated using(bucket_id='program-media' and exists(select 1 from public.memberships m where m.user_id=auth.uid() and m.cohort_id::text=(storage.foldername(name))[1] and (m.role='admin' or exists(select 1 from public.experiences e where e.cohort_id=m.cohort_id and e.published and e.day<=public.current_program_day(m.cohort_id) and (e.video='storage:'||name or e.infographic='storage:'||name)))));
commit;
