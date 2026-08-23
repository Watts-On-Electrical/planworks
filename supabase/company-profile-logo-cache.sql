-- ============================================================================
-- company_profile: cached logo for rendering  (run ONCE in Supabase SQL Editor)
-- ----------------------------------------------------------------------------
-- company_profile is now the authoritative source of company identity, and the
-- title block on every drawing is derived from it.
--
-- logo_path stays the authoritative pointer into the private company-logos
-- bucket. This column holds a small downscaled data-URI of the same image,
-- used ONLY for rendering, because the signed URL cannot be used for that:
--
--   * html2canvas taints its canvas fetching a remote image, and the PDF
--     export photographs the DOM with html2canvas -- a tainted canvas throws
--     and takes the whole export down.
--   * signed URLs expire after 8 hours, so a logo that looked fine on screen
--     would silently vanish from a PDF exported the next morning.
--
-- The data-URI is written when the logo is uploaded (it is already in hand at
-- that point, downscaled to ~260px, so no extra work or round trip).
--
-- The app tolerates this column being absent -- reads and writes fall back to
-- the column set without it -- so running this is not urgent, but until it is
-- run no logo will appear on drawings.
-- ============================================================================

alter table public.company_profile
  add column if not exists logo_data_url text;

-- ----------------------------------------------------------------------------
-- VERIFY. Expect one row: column_name = logo_data_url, data_type = text.
-- ----------------------------------------------------------------------------
select column_name, data_type
  from information_schema.columns
 where table_schema = 'public'
   and table_name   = 'company_profile'
   and column_name  = 'logo_data_url';

-- RLS is unchanged: the existing "Users manage their own company profile"
-- policy covers every column on the table, new ones included. Confirm with:
--   select policyname, cmd, qual, with_check
--     from pg_policies
--    where schemaname = 'public' and tablename = 'company_profile';
