-- Isolated development project ONLY, after001–007; exact execution needs approval.
-- No fixtures or quotas survive rollback.
begin;
select public.consume_app_budget(array['test:user','test:ip'],array[1,2],array[3600,3600]);
do $$ declare blocked boolean:=false;
begin
 begin perform public.consume_app_budget(array['test:user','test:ip'],array[1,2],array[3600,3600]);
 exception when raise_exception then
  if sqlerrm<>'Rate limit exceeded.' then raise; end if; blocked:=true;
 end;
 if not blocked then raise exception 'Quota bypass'; end if;
 if (select used from app_private.request_budgets where scope_key='test:ip')<>1 then raise exception 'Partial budget commit'; end if;
end $$;
set local role authenticated;
do $$ declare blocked boolean:=false;
begin
 begin perform public.consume_app_budget(array['test:forged'],array[10000],array[1]);
 exception when insufficient_privilege then blocked:=true; end;
 if not blocked then raise exception 'Client can pick own quota'; end if;
end $$;
reset role;
select 'PASS: quota denial, atomic rollback, private budget access' as result;
rollback;
