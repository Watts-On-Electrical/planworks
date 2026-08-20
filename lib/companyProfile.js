"use client";

/* ============================================================================
 * Company profile — the account's own business details.
 * ----------------------------------------------------------------------------
 * One row per user in public.company_profile, one private logo per user in the
 * company-logos bucket. Both are locked to the owning account by RLS at the
 * database level (see supabase/company-profile-setup.sql) — the user_id set
 * here is for addressing the right row, NOT the security boundary. Even a
 * tampered client can only ever read or write its own row.
 *
 * The logo lives in Storage and the row keeps only its path, so the profile
 * row stays tiny and the bytes are streamed (and cached) by the browser.
 * ========================================================================= */

import { supabase } from "./supabase";

export const LOGO_BUCKET = "company-logos";

// Signed-URL lifetime for displaying the logo. Re-minted every time the screen
// opens, so expiry never bites mid-edit.
const SIGN_TTL = 60 * 60 * 8; // 8 hours

function client() {
  if (!supabase) throw new Error("Cloud storage isn't configured yet.");
  return supabase;
}

async function currentUserId() {
  const { data } = await client().auth.getUser();
  return data?.user?.id || null;
}

const uuid = () =>
  (crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`);

export const EMPTY_PROFILE = {
  company_name: "",
  address: "",
  phone: "",
  email: "",
  website: "",
  logo_path: null,
};

/** The signed-in user's profile, or EMPTY_PROFILE if they've never saved one. */
export async function getCompanyProfile() {
  const user_id = await currentUserId();
  if (!user_id) throw new Error("You're not signed in.");
  const { data, error } = await client()
    .from("company_profile")
    .select("company_name, address, phone, email, website, logo_path")
    .eq("user_id", user_id)
    .maybeSingle();
  if (error) throw error;
  return { ...EMPTY_PROFILE, ...(data || {}) };
}

/**
 * Write the profile. Upserts on user_id, so the first save creates the row and
 * every later one updates it — there is never a second row for an account.
 * Only the known columns are sent; anything else on the object is ignored.
 */
export async function saveCompanyProfile(profile) {
  const user_id = await currentUserId();
  if (!user_id) throw new Error("You're not signed in.");
  const row = {
    user_id,
    company_name: profile.company_name?.trim() || null,
    address: profile.address?.trim() || null,
    phone: profile.phone?.trim() || null,
    email: profile.email?.trim() || null,
    website: profile.website?.trim() || null,
    logo_path: profile.logo_path || null,
    updated_at: new Date().toISOString(),
  };
  const { error } = await client()
    .from("company_profile")
    .upsert(row, { onConflict: "user_id" });
  if (error) throw error;
}

/**
 * Put a logo in the private bucket under this user's own folder and return its
 * path. The "<uid>/" prefix is what the storage policies check, so a file can
 * only ever be written into the caller's own folder.
 */
export async function uploadCompanyLogo(blob) {
  const uid = await currentUserId();
  if (!uid) throw new Error("You're not signed in.");
  const path = `${uid}/${uuid()}.png`;
  const { error } = await client()
    .storage
    .from(LOGO_BUCKET)
    .upload(path, blob, { contentType: blob.type || "image/png", cacheControl: "3600", upsert: false });
  if (error) throw error;
  return path;
}

/** A short-lived URL for showing a stored logo. Null if it can't be signed. */
export async function signCompanyLogo(path) {
  if (!path) return null;
  try {
    const { data, error } = await client()
      .storage
      .from(LOGO_BUCKET)
      .createSignedUrl(path, SIGN_TTL);
    if (error) return null;
    return data?.signedUrl || null;
  } catch {
    return null;
  }
}
