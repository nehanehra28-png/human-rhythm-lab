-- REVIEW ONLY: do not execute without the user's exact migration approval.
-- Apply after 006. All quota consumption is atomic; no anonymous quota RPC.
begin;
create schema if not exists app_private;
revoke all on schema app_private from public, anon, authenticated;
create table app_private.request_budgets (
 scope_key text not null check(length(scope_key)<=200),
 window_start timestamptz not null,
 used integer not null check(used>0),
 expires_at timestamptz not null,
 primary key(scope_key,window_start)
);
alter table app_private.request_budgets enable row level security;
revoke all on app_private.request_budgets from public,anon,authenticated;
create function app_private.take_budget(scope text, maximum integer, seconds integer) returns void
 language plpgsql security definer set search_path=pg_catalog,app_private as $$
declare started timestamptz; accepted integer;
begin
 if maximum<1 or maximum>10000 or seconds<1 or seconds>86400 then raise exception 'Invalid budget.'; end if;
 started:=to_timestamp(floor(extract(epoch from statement_timestamp())/seconds)*seconds);
 insert into app_private.request_budgets(scope_key,window_start,used,expires_at)
 values(scope,started,1,started+make_interval(secs=>seconds))
 on conflict(scope_key,window_start) do update set used=request_budgets.used+1
 where request_budgets.used<maximum returning used into accepted;
 if accepted is null then raise exception 'Rate limit exceeded.' using errcode='P0001'; end if;
end;$$;
revoke all on function app_private.take_budget(text,integer,integer) from public,anon,authenticated;
create function public.consume_app_budget(scope_keys text[],max_counts integer[],window_seconds integer[]) returns void
 language plpgsql security definer set search_path=pg_catalog,app_private as $$
declare idx integer;
begin
 if cardinality(scope_keys) not between 1 and 4 or cardinality(scope_keys)<>cardinality(max_counts)
 or cardinality(scope_keys)<>cardinality(window_seconds) then raise exception 'Invalid budget.'; end if;
 for idx in 1..cardinality(scope_keys) loop
  perform app_private.take_budget(scope_keys[idx],max_counts[idx],window_seconds[idx]);
 end loop;
end;$$;
revoke all on function public.consume_app_budget(text[],integer[],integer[]) from public,anon,authenticated;
grant execute on function public.consume_app_budget(text[],integer[],integer[]) to service_role;
-- Direct Data API writes also consume an owner quota, even bypassing Next.js.
create function app_private.limit_record_write() returns trigger
 language plpgsql security definer set search_path=pg_catalog,public,app_private as $$
begin
 -- Privileged owner/service provisioning is outside participant quotas; RLS denies missing user identity for app roles.
 if auth.uid() is null then return new; end if;
 if new.user_id<>auth.uid() or not public.is_cohort_member(new.cohort_id)
 then raise exception 'Record access denied.' using errcode='42501'; end if;
 perform app_private.take_budget('record:'||tg_table_name||':'||auth.uid()::text,120,3600);
 return new;
end;$$;
revoke all on function app_private.limit_record_write() from public,anon,authenticated;
create trigger limit_checkin_writes before insert or update on public.checkins
 for each row execute function app_private.limit_record_write();
create trigger limit_entry_writes before insert on public.checkin_entries
 for each row execute function app_private.limit_record_write();
create trigger limit_checklist_writes before insert or update on public.phase_two_checks
 for each row execute function app_private.limit_record_write();
-- Uploads require a server-authorized, quota-reserved, single-path signed token.
-- Read policies remain unchanged. Do not enable API uploads until 007 is applied.
drop policy admin_media_upload on storage.objects;
-- Attempts survive failures/retries and are capped before each provider request.
create table app_private.review_attempts (
 user_id uuid not null references auth.users(id) on delete cascade,
 cohort_id uuid not null references public.cohorts(id) on delete cascade,
 week integer not null check(week between 1 and 4),
 attempts integer not null check(attempts between 1 and 3),
 last_attempt timestamptz not null,
 primary key(user_id,cohort_id,week)
);
alter table app_private.review_attempts enable row level security;
revoke all on app_private.review_attempts from public,anon,authenticated;
create function public.consume_review_attempt(participant uuid,cohort uuid,program_week integer) returns void
 language plpgsql security definer set search_path=pg_catalog,public,app_private as $$
declare accepted integer;
begin
 if not exists(select 1 from public.memberships m where m.user_id=participant and m.cohort_id=cohort and m.role='participant')
 then raise exception 'Record access denied.' using errcode='42501'; end if;
 perform app_private.take_budget('ai_daily:'||participant::text||':'||cohort::text,1,86400);
 insert into app_private.review_attempts(user_id,cohort_id,week,attempts,last_attempt)
 values(participant,cohort,program_week,1,statement_timestamp())
 on conflict(user_id,cohort_id,week) do update set attempts=review_attempts.attempts+1,last_attempt=statement_timestamp()
 where review_attempts.attempts<3 and review_attempts.last_attempt<=statement_timestamp()-interval '24 hours'
 returning attempts into accepted;
 if accepted is null then raise exception 'Rate limit exceeded.' using errcode='P0001'; end if;
end;$$;
revoke all on function public.consume_review_attempt(uuid,uuid,integer) from public,anon,authenticated;
grant execute on function public.consume_review_attempt(uuid,uuid,integer) to service_role;
-- Direct JSON writes accept exactly the same checklist keys/statuses as the API.
create function public.valid_phase_two_items(candidate jsonb) returns boolean
 language sql immutable strict set search_path=pg_catalog as $$
 select case when jsonb_typeof(candidate)<>'object' then false else not exists(
  select 1 from jsonb_each(candidate) entry where
  entry.key<>all(array['affirmations','goals','morning-water','juice','fruit','lunch-before','lunch-salad','lunch-cooked','lunch-after','dinner-before','dinner-salad','dinner-cooked','dinner-after','gratitude','greyscale','screens','daylight','earthing','meditation','water'])
  or entry.value not in ('"done"'::jsonb,'"skipped"'::jsonb)
 ) end;
$$;
revoke all on function public.valid_phase_two_items(jsonb) from public,anon,authenticated;
grant execute on function public.valid_phase_two_items(jsonb) to authenticated;
alter table public.phase_two_checks add constraint phase_two_items_valid check(public.valid_phase_two_items(items));
commit;
