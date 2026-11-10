-- Explicit approval required before applying to any database.
-- Server invitations need membership INSERT; client grants remain unchanged.
begin;
grant insert on public.memberships to service_role;
commit;
