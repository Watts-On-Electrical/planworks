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
--   * one company row per user -- a partial unique index on user_id
--   * two accreditations per user -- slots 0 and 1 only, one row per slot
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

-- At most ONE company logo per account.
create unique index if not exists company_logos_one_company_per_user
  on public.company_logos (user_id)
  where kind = 'company';

-- At most TWO accreditations per account: slots 0 and 1, one row per slot.
-- Expressed as a check plus a partial unique index so the cap is structural
-- rather than something the app has to remember to enforce.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'company_logos_accreditation_slot'
  ) then
    alter table public.company_logos
      add constraint company_logos_accreditation_slot
      check (kind <> 'accreditation' or sort_order in (0, 1));
  end if;
end $$;

create unique index if not exists company_logos_accreditation_slot_unique
  on public.company_logos (user_id, sort_order)
  where kind = 'accreditation';

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

-- (c) The two caps. Expect three rows: the company partial unique index, the
--     accreditation slot unique index, and the slot check constraint.
select indexname as name, 'index' as kind from pg_indexes
 where schemaname = 'public' and tablename = 'company_logos'
   and indexname like 'company_logos_%'
union all
select conname, 'constraint' from pg_constraint
 where conrelid = 'public.company_logos'::regclass and contype = 'c'
   and conname = 'company_logos_accreditation_slot'
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
