"use client";

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// True only when the Vercel/local env vars are present.
export const isConfigured = Boolean(url && key);

// One shared browser client. Null if the app hasn't been linked to Supabase yet.
export const supabase = isConfigured
  ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } })
  : null;
