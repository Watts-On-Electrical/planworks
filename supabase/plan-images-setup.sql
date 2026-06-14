-- ============================================================================
-- Plan-image storage setup  (run ONCE in Supabase → SQL Editor)
-- ----------------------------------------------------------------------------
-- Creates a PRIVATE bucket for imported floor-plan images and locks every
-- object down so a signed-in user can only read/write objects inside a folder
-- named after their own user id. Image paths are: "<auth.uid()>/<uuid>.jpg".
--
-- Private + signed URLs (not public) because these are clients' floor plans.
-- ============================================================================

-- 1. The bucket (private: public = false)
insert into storage.buckets (id, name, public)
values ('plan-images', 'plan-images', false)
on conflict (id) do nothing;

-- 2. Row-level security policies on storage.objects, scoped to this bucket.
--    storage.foldername(name)[1] is the first path segment = the owner's uid.

drop policy if exists "plan-images read own"   on storage.objects;
drop policy if exists "plan-images insert own" on storage.objects;
drop policy if exists "plan-images update own" on storage.objects;
drop policy if exists "plan-images delete own" on storage.objects;

create policy "plan-images read own"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'plan-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "plan-images insert own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'plan-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "plan-images update own"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'plan-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "plan-images delete own"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'plan-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
