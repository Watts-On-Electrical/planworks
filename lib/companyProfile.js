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

// The columns the app reads. logo_data_url is a small cached copy of the logo
// used for rendering (see companyProfileToTitleBlock); logo_path remains the
// authoritative pointer into the private bucket. Older databases predate the
// cache column, so every query falls back to the set without it.
const COLUMNS = "company_name, address, phone, email, website, logo_path, logo_data_url";
const COLUMNS_LEGACY = "company_name, address, phone, email, website, logo_path";

export const EMPTY_PROFILE = {
  company_name: "",
  address: "",
  phone: "",
  email: "",
  website: "",
  logo_path: null,
  logo_data_url: null,
};

/** The signed-in user's profile, or EMPTY_PROFILE if they've never saved one. */
export async function getCompanyProfile() {
  const user_id = await currentUserId();
  if (!user_id) throw new Error("You're not signed in.");
  const cl = client();
  let { data, error } = await cl
    .from("company_profile").select(COLUMNS).eq("user_id", user_id).maybeSingle();
  if (error) {
    // Most likely the logo_data_url column hasn't been added yet.
    console.warn("getCompanyProfile: retrying without the logo cache column:", error.message);
    ({ data, error } = await cl
      .from("company_profile").select(COLUMNS_LEGACY).eq("user_id", user_id).maybeSingle());
    if (error) throw error;
  }
  return { ...EMPTY_PROFILE, ...(data || {}) };
}

/**
 * Whether this account has a company_profile row at all. Deliberately separate
 * from getCompanyProfile(), which can't tell "never filled in" from "filled in
 * with blanks" -- onboarding must only ever trigger on the former.
 *
 * Fails SAFE: any error (not signed in, table missing because the setup SQL
 * hasn't been run) reports true, so a problem here can never trap someone on
 * an onboarding screen or nag them on every login.
 */
export async function hasCompanyProfile() {
  try {
    const user_id = await currentUserId();
    if (!user_id) return true;
    const { data, error } = await client()
      .from("company_profile")
      .select("user_id")
      .eq("user_id", user_id)
      .maybeSingle();
    if (error) { console.warn("hasCompanyProfile:", error.message); return true; }
    return Boolean(data);
  } catch (err) {
    console.warn("hasCompanyProfile failed:", err && err.message);
    return true;
  }
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
    logo_data_url: profile.logo_data_url || null,
    updated_at: new Date().toISOString(),
  };
  const cl = client();
  let { error } = await cl.from("company_profile").upsert(row, { onConflict: "user_id" });
  if (error) {
    // Same fallback as the read: save everything else rather than fail outright.
    console.warn("saveCompanyProfile: retrying without the logo cache column:", error.message);
    const { logo_data_url, ...legacy } = row;
    ({ error } = await cl.from("company_profile").upsert(legacy, { onConflict: "user_id" }));
    if (error) throw error;
  }
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
