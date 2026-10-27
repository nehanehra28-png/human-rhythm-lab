-- Run ONLY in an isolated test project after migrations 001–006. Always rolls back.
-- Requires a SQL-editor/database owner connection; no real participant data used.
begin;
insert into auth.users(id) values
 ('10000000-0000-0000-0000-000000000001'),
 ('10000000-0000-0000-0000-000000000002'),
 ('10000000-0000-0000-0000-000000000003');
insert into public.cohorts(id,name,start_date) values
 ('20000000-0000-0000-0000-000000000001','Authorization test A',current_date),
 ('20000000-0000-0000-0000-000000000002','Authorization test B',current_date);
insert into public.memberships(user_id,cohort_id,role,started_at) values
 ('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','participant',now()-interval '20 days'),
 ('10000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000002','participant',now()-interval '20 days'),
 ('10000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000001','admin',now()-interval '20 days');
insert into public.checkins(user_id,cohort_id,day,mood,energy,sleep)
 select user_id,cohort_id,1,3,3,7 from public.memberships where role='participant';
insert into public.private_notes(user_id,cohort_id,day,notes)
 select user_id,cohort_id,day,'Synthetic private note' from public.checkins;
insert into public.experiences(cohort_id,day,title,published) values
 ('20000000-0000-0000-0000-000000000001',1,'Visible test',true),
 ('20000000-0000-0000-0000-000000000001',2,'Private draft',false);
do $$ begin
 if exists(select 1 from pg_tables where schemaname='public' and not rowsecurity)
 then raise exception 'Public table without RLS'; end if;
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
do $$ begin
 if (select count(*) from public.checkins)<>1 then raise exception 'Participant score isolation failed'; end if;
 if (select count(*) from public.private_notes)<>1 then raise exception 'Participant note isolation failed'; end if;
 if (select count(*) from public.experiences)<>1 then raise exception 'Draft visibility failed'; end if;
 begin
  perform * from public.cohort_progress('20000000-0000-0000-0000-000000000001');
  raise exception 'Participant admin RPC allowed';
 exception when insufficient_privilege then null; end;
 begin
  update public.memberships set role='admin' where user_id=auth.uid();
  raise exception 'Role escalation allowed';
 exception when insufficient_privilege then null; end;
 begin
  insert into public.phase_two_checks(user_id,cohort_id,day) values(auth.uid(),'20000000-0000-0000-0000-000000000002',16);
  raise exception 'Cross-cohort write allowed';
 exception when insufficient_privilege then null; end;
 begin
  insert into public.phase_two_checks(user_id,cohort_id,day) values(auth.uid(),'20000000-0000-0000-0000-000000000001',29);
  raise exception 'Future phase write allowed';
 exception when insufficient_privilege then null; end;
end $$;
select public.save_checkin_entry('20000000-0000-0000-0000-000000000001',21,1,1,7,'{}','completed',false,'Synthetic private note');
select public.save_checkin_entry('20000000-0000-0000-0000-000000000001',21,5,5,8,'{}','completed',false,'Synthetic private note');
do $$ begin
 if (select count(*) from public.checkin_entries where day=21)<>2 then raise exception 'History lost'; end if;
 if (select mood from public.checkins where day=21)<>5 then raise exception 'Latest snapshot incorrect'; end if;
end $$;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000003',true);
do $$ begin
 if exists(select 1 from public.checkins) then raise exception 'Admin direct participant table access'; end if;
 if (select count(*) from public.cohort_progress('20000000-0000-0000-0000-000000000001'))<>2 then raise exception 'Admin score summary failed'; end if;
 begin
  perform * from public.cohort_progress('20000000-0000-0000-0000-000000000002');
  raise exception 'Cross-cohort admin RPC allowed';
 exception when insufficient_privilege then null; end;
 if exists(select 1 from public.private_notes) then raise exception 'Admin can read participant notes'; end if;
 if exists(select 1 from public.checkin_entries) then raise exception 'Admin can read private history'; end if;
 if (select count(*) from public.experiences)<>2 then raise exception 'Admin draft access failed'; end if;
 if exists(select 1 from public.checkins where cohort_id='20000000-0000-0000-0000-000000000002') then raise exception 'Admin cross-cohort access'; end if;
end $$;
set local role anon;
do $$ begin
 begin
  perform 1 from public.checkins;
  raise exception 'Anonymous read allowed';
 exception when insufficient_privilege then null; end;
end $$;
rollback;
