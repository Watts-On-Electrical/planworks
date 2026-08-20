-- ============================================================================
-- Company profile: table + logo bucket  (run ONCE in Supabase -> SQL Editor)
-- ----------------------------------------------------------------------------
-- Stores ONE row of company details per user (name, address, phone, email,
-- website, logo). This is private business data, so every path to it is locked
-- to the owning account at the DATABASE level -- the UI is never the guarantee.
--
-- Two separate locks are set up here:
--   1. public.company_profile  -- RLS, modelled on the projects table policy
--   2. storage bucket 'company-logos' -- per-user folder policies, modelled on
--      the plan-images bucket
--
-- Run the whole file. Then run the VERIFICATION queries at the bottom.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. The table
-- ---------------------------------------------------------------------------
-- user_id is the PRIMARY KEY, not just a column: that makes "one row per user"
-- a guarantee of the schema itself, so no bug in the app can ever create a
-- second profile for the same account. on delete cascade means the profile
-- disappears with the account.
--
-- The logo is stored as a PATH into the company-logos bucket, never as bytes
-- in the row -- same approach as plan images.
create table if not exists public.company_profile (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  company_name text,
  address      text,
  phone        text,
  email        text,
  website      text,
  logo_path    text,
  updated_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2. Row-level security on the table
-- ---------------------------------------------------------------------------
alter table public.company_profile enable row level security;

drop policy if exists "Users manage their own company profile" on public.company_profile;

-- One ALL policy, matching the proven "Users manage their own projects" pattern.
--   using      -> which rows this user can see / update / delete
--   with check -> what this user is allowed to write
-- The with check half is what stops anyone inserting or updating a row that
-- carries somebody else's user_id.
create policy "Users manage their own company profile"
  on public.company_profile
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 3. The logo bucket (private) + its policies
-- ---------------------------------------------------------------------------
-- Private, not public: logos are reached through short-lived signed URLs, so
-- the bucket can't be enumerated. Object paths are "<auth.uid()>/<uuid>.png",
-- and each policy checks that the first folder segment is the caller's own id.
insert into storage.buckets (id, name, public)
values ('company-logos', 'company-logos', false)
on conflict (id) do nothing;

drop policy if exists "company-logos read own"   on storage.objects;
drop policy if exists "company-logos insert own" on storage.objects;
drop policy if exists "company-logos update own" on storage.objects;
drop policy if exists "company-logos delete own" on storage.objects;

create policy "company-logos read own"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'company-logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "company-logos insert own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'company-logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "company-logos update own"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'company-logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "company-logos delete own"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'company-logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================================
-- VERIFICATION -- run these after the above and check the output.
-- ============================================================================

-- (a) RLS must be ON for the table. Expect rls_enabled = true.
select relname, relrowsecurity as rls_enabled
  from pg_class
 where relname = 'company_profile';

-- (b) The table policy. Expect ONE row:
--       cmd = ALL, qual = (auth.uid() = user_id), with_check = (auth.uid() = user_id)
select policyname, cmd, qual, with_check
  from pg_policies
 where schemaname = 'public' and tablename = 'company_profile';

-- (c) The four storage policies. Expect four rows, each testing
--     (storage.foldername(name))[1] = auth.uid()::text
select policyname, cmd
  from pg_policies
 where schemaname = 'storage' and tablename = 'objects'
   and policyname like 'company-logos%'
 order by policyname;

-- (d) The bucket must be PRIVATE. Expect public = false.
select id, public from storage.buckets where id = 'company-logos';
