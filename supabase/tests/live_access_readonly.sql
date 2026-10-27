-- Production-safe authorization probe: no row writes, secrets or record values returned.
-- Run as database owner after migration 006. The transaction always rolls back.
begin;
do $$
declare members jsonb; person jsonb; checked integer := 0; denied boolean;
begin
 if exists(select 1 from pg_tables where schemaname='public' and not rowsecurity)
 then raise exception 'Public table missing RLS'; end if;
 select jsonb_agg(jsonb_build_object('user_id',user_id,'cohort_id',cohort_id,'role',role)) into members from public.memberships;
 if members is null then raise exception 'No existing memberships to verify'; end if;
 for person in select value from jsonb_array_elements(members) loop
  perform set_config('request.jwt.claim.sub',person->>'user_id',true);
  execute 'set local role authenticated';
  if exists(select 1 from public.private_notes where user_id<>auth.uid()) then raise exception 'Other user notes visible'; end if;
  if exists(select 1 from public.checkin_entries where user_id<>auth.uid()) then raise exception 'Other user history visible'; end if;
  if exists(select 1 from public.phase_two_checks where user_id<>auth.uid()) then raise exception 'Other user checklist visible'; end if;
  if exists(select 1 from public.reviews where user_id<>auth.uid()) then raise exception 'Other user reviews visible'; end if;
  if exists(select 1 from public.feedback where user_id<>auth.uid()) then raise exception 'Other user feedback visible'; end if;
  if exists(select 1 from public.checkins where user_id<>auth.uid()) then raise exception 'Other user direct scores visible'; end if;
  if exists(select 1 from public.cohorts where id<>(person->>'cohort_id')::uuid) then raise exception 'Other cohort visible'; end if;
  if exists(select 1 from public.memberships where cohort_id<>(person->>'cohort_id')::uuid) then raise exception 'Other memberships visible'; end if;
  if person->>'role'='participant' then
   if exists(select 1 from public.experiences where not published or day>public.current_program_day(cohort_id) or cohort_id<>(person->>'cohort_id')::uuid) then raise exception 'Locked content visible'; end if;
   denied := false;
   begin perform * from public.cohort_progress((person->>'cohort_id')::uuid);
   exception when insufficient_privilege then denied := true; end;
   if not denied then raise exception 'Participant admin RPC allowed'; end if;
  else
   perform * from public.cohort_progress((person->>'cohort_id')::uuid);
  end if;
  denied := false;
  begin perform * from public.cohort_progress('ffffffff-ffff-ffff-ffff-ffffffffffff');
  exception when insufficient_privilege then denied := true; end;
  if not denied then raise exception 'Foreign cohort RPC allowed'; end if;
  denied := false;
  begin update public.memberships set role='admin' where false;
  exception when insufficient_privilege then denied := true; end;
  if not denied then raise exception 'Role column privilege available'; end if;
  execute 'reset role';
  checked := checked + 1;
 end loop;
 execute 'set local role anon';
 denied := false;
 begin perform 1 from public.checkins;
 exception when insufficient_privilege then denied := true; end;
 if not denied then raise exception 'Anonymous score grant available'; end if;
 execute 'reset role';
 raise notice 'Read-only record authorization passed for % existing memberships', checked;
end $$;
select 'PASS: RLS, record isolation, admin scope, anonymous denial and escalation denial' as authorization_result;
rollback;
