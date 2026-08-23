-- ============================================================================
-- company_logos + company_reg  (run ONCE in Supabase -> SQL Editor)
-- ----------------------------------------------------------------------------
-- Splits logos into TWO ROLES rather than one list, because that is how they
-- actually sit on a drawing:
--
--   kind = 'company'        exactly one. Renders on a white tile inside the
--                           teal panel, column 1.
--   kind = 'accreditation'  up to two. Render on white in column 2.
--
-- One plus two is three, which is the renderer's hard cap before the strip
-- overflows (MAX_TITLE_LOGOS in lib/titleBlock.js).
--
-- Both limits are enforced HERE, in the database, not just in the UI:
--   * one composite unique index on (user_id, kind, sort_order)
--   * check constraints pinning company to slot 0 and accreditations to 0/1
--
-- The existing private company-logos BUCKET and its per-user folder policies
-- are reused unchanged; this file adds no storage policies.
--
-- company_profile.logo_path / logo_data_url are LEFT IN PLACE and still
-- populated. The app falls back to them if this table can't be read, exactly
-- as it already falls back when logo_data_url is missing. Nothing is dropped
-- in this change.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Registration number on the profile
-- ---------------------------------------------------------------------------
alter table public.company_profile
  add column if not exists company_reg text;

-- ---------------------------------------------------------------------------
-- 2. The logos table
-- ---------------------------------------------------------------------------
create table if not exists public.company_logos (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  kind         text not null check (kind in ('company', 'accreditation')),
  storage_path text,
  data_url     text,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);

-- ONE FULL unique index, not two partial ones.
--
-- The caps were first written as partial indexes -- unique (user_id) where
-- kind = 'company', unique (user_id, sort_order) where kind = 'accreditation'.
-- Those express the rule precisely but the app cannot use them: PostgREST's
-- upsert onConflict takes COLUMN NAMES only and has no way to supply the
-- WHERE predicate a partial index requires, so every upsert failed with
-- "no unique or exclusion constraint matching the ON CONFLICT specification".
--
-- A composite index over (user_id, kind, sort_order) is nameable by
-- onConflict, and the two check constraints below pin the slots so the caps
-- come out identical:
--
--   company    sort_order is forced to 0, so (user, 'company', 0) is unique
--              -- exactly one company row per account.
--   accred.    sort_order is 0 or 1, so at most two rows per account.
create unique index if not exists company_logos_user_kind_slot
  on public.company_logos (user_id, kind, sort_order);

-- Superseded by the composite index above. Dropped so a database upgraded
-- from the first version of this file ends up in the same shape as a fresh
-- install.
drop index if exists public.company_logos_one_company_per_user;
drop index if exists public.company_logos_accreditation_slot_unique;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'company_logos_company_slot'
  ) then
    alter table public.company_logos
      add constraint company_logos_company_slot
      check (kind <> 'company' or sort_order = 0);
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'company_logos_accreditation_slot'
  ) then
    alter table public.company_logos
      add constraint company_logos_accreditation_slot
      check (kind <> 'accreditation' or sort_order in (0, 1));
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 3. Row-level security -- same pattern as company_profile
-- ---------------------------------------------------------------------------
alter table public.company_logos enable row level security;

drop policy if exists "Users manage their own company logos" on public.company_logos;

create policy "Users manage their own company logos"
  on public.company_logos
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 4. Migrate the single existing logo into a 'company' row
-- ---------------------------------------------------------------------------
-- Idempotent: the NOT EXISTS guard means re-running this changes nothing, and
-- it never overwrites a company row someone has already replaced through the
-- app. The source columns are left untouched.
insert into public.company_logos (user_id, kind, storage_path, data_url, sort_order)
select p.user_id, 'company', p.logo_path, p.logo_data_url, 0
  from public.company_profile p
 where p.logo_path is not null
   and not exists (
     select 1 from public.company_logos l
      where l.user_id = p.user_id and l.kind = 'company'
   );

-- ============================================================================
-- VERIFICATION -- run these after the above and send me the output.
-- ============================================================================

-- (a) RLS ON and NOT forced. Expect rls_enabled = true, rls_forced = false.
select relname,
       relrowsecurity      as rls_enabled,
       relforcerowsecurity as rls_forced
  from pg_class
 where relname = 'company_logos';

-- (b) The policy. Expect ONE row: cmd = ALL, and both qual and with_check
--     reading (auth.uid() = user_id).
select policyname, cmd, roles, qual, with_check
  from pg_policies
 where schemaname = 'public' and tablename = 'company_logos';

-- (c) The caps. Expect three rows: the composite unique index
--     company_logos_user_kind_slot, and the two slot check constraints.
select indexname as name, 'index' as kind from pg_indexes
 where schemaname = 'public' and tablename = 'company_logos'
   and indexname like 'company_logos_%'
union all
select conname, 'constraint' from pg_constraint
 where conrelid = 'public.company_logos'::regclass and contype = 'c'
   and conname in ('company_logos_company_slot', 'company_logos_accreditation_slot')
 order by name;

-- (d) The registration column. Expect one row: company_reg | text.
select column_name, data_type
  from information_schema.columns
 where table_schema = 'public' and table_name = 'company_profile'
   and column_name = 'company_reg';

-- (e) The migration. Expect migrated_company_logos to equal
--     profiles_with_a_logo -- every existing logo carried over.
select
  (select count(*) from public.company_profile where logo_path is not null) as profiles_with_a_logo,
  (select count(*) from public.company_logos where kind = 'company')        as migrated_company_logos,
  (select count(*) from public.company_logos where kind = 'accreditation')  as accreditation_logos;
