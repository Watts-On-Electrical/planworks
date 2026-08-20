-- ============================================================================
-- projects table: row-level security  (run in Supabase -> SQL Editor)
-- ----------------------------------------------------------------------------
-- The dashboard can now delete a drawing. The UI guards that with a password
-- prompt, but the UI is not a security boundary -- anyone can call the API
-- directly with their own access token. The real guarantee has to come from
-- the database: a signed-in user may only ever read, change or delete rows
-- where projects.user_id = their own auth.uid().
--
-- STATUS: checked on the live project (Aug 2026) -- public.projects already has
-- RLS on with an ALL policy of (auth.uid() = user_id), which covers DELETE. So
-- NOTHING BELOW NEEDS RUNNING HERE. Running it anyway would DROP that working
-- ALL policy and replace it with four per-command ones. This file is kept as
-- the check procedure, and for setting up a fresh environment from scratch.
--
-- STEP 1 -- CHECK WHAT YOU ALREADY HAVE. Run this on its own first:
--
--   select relname, relrowsecurity as rls_enabled
--     from pg_class where relname = 'projects';
--
--   select policyname, cmd, qual, with_check
--     from pg_policies where schemaname = 'public' and tablename = 'projects';
--
-- If rls_enabled is true and you see a policy whose cmd is DELETE (or ALL)
-- with a qual of (auth.uid() = user_id), deletes are already protected and you
-- do NOT need to run anything below.
--
-- STEP 2 -- Only if the check above shows RLS off, or no DELETE policy, run
-- the rest of this file. It is idempotent and safe to re-run.
-- ============================================================================

alter table public.projects enable row level security;

drop policy if exists "projects select own" on public.projects;
drop policy if exists "projects insert own" on public.projects;
drop policy if exists "projects update own" on public.projects;
drop policy if exists "projects delete own" on public.projects;

create policy "projects select own"
  on public.projects for select to authenticated
  using (auth.uid() = user_id);

create policy "projects insert own"
  on public.projects for insert to authenticated
  with check (auth.uid() = user_id);

create policy "projects update own"
  on public.projects for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- The one this feature depends on. Without it, an authenticated user could
-- delete another account's drawing by id.
create policy "projects delete own"
  on public.projects for delete to authenticated
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- STEP 3 -- verify. Re-run the pg_policies query from step 1; you should see
-- four policies, one per command, each with (auth.uid() = user_id).
-- ----------------------------------------------------------------------------
