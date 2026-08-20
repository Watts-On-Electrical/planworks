-- ============================================================================
-- Work Planner: row-level security  (run ONCE in Supabase -> SQL Editor)
-- ----------------------------------------------------------------------------
-- FIXES A CONFIRMED CROSS-USER DATA LEAK. Both planner tables were created with
-- RLS OFF and no policies, so any signed-in user could read -- and, through the
-- client's unscoped delete/upsert, modify -- every other account's planner rows.
-- planner_settings is the more sensitive of the two: its `data` column holds
-- each account's shareToken, so an open table hands out working public share
-- links for every planner.
--
-- The client (lib/planner.js) also filters by user_id now, but that is only a
-- second lock. This file is the actual boundary.
--
-- Confirmed before writing this:
--   * planner_jobs: 100 rows, 0 with a null user_id -- nothing is orphaned, so
--     enabling RLS cannot strand a row away from its owner.
--   * planner_shared(): owner = postgres (superuser), prosecdef = true,
--     search_path = public, and it requires a token of >= 16 chars, returning
--     only that token owner's rows.
--
-- WHY THE PUBLIC SHARE LINK KEEPS WORKING
-- planner_shared() is SECURITY DEFINER and runs as postgres, which BYPASSES row
-- level security. Enabling RLS below therefore does not close the anonymous
-- read-only door at /planner/view -- that door stays gated by the token alone.
--
-- >>> DO NOT ADD "FORCE ROW LEVEL SECURITY" TO THESE TABLES. <<<
-- FORCE applies RLS even to the table owner, which WOULD break the share
-- function and take every contractor's view-only link down with it. "ENABLE" is
-- deliberately the only thing switched on here.
--
-- This file does not touch, alter or re-create planner_shared() in any way.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Turn RLS on (enable only -- never force, see above)
-- ---------------------------------------------------------------------------
alter table public.planner_jobs     enable row level security;
alter table public.planner_settings enable row level security;

-- ---------------------------------------------------------------------------
-- 2. Owner-scoped policies
-- ---------------------------------------------------------------------------
-- Identical in shape to the proven "Users manage their own projects" policy:
--   using      -> the rows this account may see, update or delete
--   with check -> what this account is allowed to write, which is what stops
--                 anyone inserting or updating a row carrying someone else's
--                 user_id
drop policy if exists "Users manage their own planner jobs"     on public.planner_jobs;
drop policy if exists "Users manage their own planner settings" on public.planner_settings;

create policy "Users manage their own planner jobs"
  on public.planner_jobs
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage their own planner settings"
  on public.planner_settings
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================================
-- VERIFICATION -- run these after the above and check the output.
-- ============================================================================

-- (a) RLS must be ENABLED and NOT FORCED on both tables.
--     Expect two rows, each: rls_enabled = true, rls_forced = false.
--     If rls_forced is ever true, the public share link is broken.
select relname,
       relrowsecurity      as rls_enabled,
       relforcerowsecurity as rls_forced
  from pg_class
 where relname in ('planner_jobs', 'planner_settings')
 order by relname;

-- (b) The policies. Expect exactly TWO rows, one per table, each:
--       cmd = ALL
--       qual       = (auth.uid() = user_id)
--       with_check = (auth.uid() = user_id)
select tablename, policyname, cmd, roles, qual, with_check
  from pg_policies
 where schemaname = 'public'
   and tablename in ('planner_jobs', 'planner_settings')
 order by tablename;

-- (c) Untouched, for reassurance: the share function should be exactly as it
--     was -- prosecdef = true, owner = postgres.
select proname, proowner::regrole as owner, prosecdef as security_definer
  from pg_proc
 where proname = 'planner_shared';

-- ----------------------------------------------------------------------------
-- AFTER RUNNING: test both halves before trusting it.
--   1. Sign in as the second test account -> its planner must now be empty of
--      the other account's jobs.
--   2. Open an existing /planner/view?t=<token> link in a logged-out window ->
--      the shared week must still load.
-- ----------------------------------------------------------------------------
