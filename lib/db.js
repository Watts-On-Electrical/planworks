"use client";

import { supabase } from "./supabase";

function client() {
  if (!supabase) throw new Error("Cloud storage isn't configured yet.");
  return supabase;
}

async function currentUserId() {
  const { data } = await client().auth.getUser();
  return data?.user?.id || null;
}

// List the signed-in user's projects (newest first). Includes full data so the
// dashboard can render plan-preview thumbnails.
export async function listProjects() {
  const { data, error } = await client()
    .from("projects")
    .select("id, name, updated_at, data")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(r => ({
    id: r.id,
    name: r.name,
    updatedAt: r.updated_at,
    data: r.data,
  }));
}

export async function getProjectData(id) {
  const { data, error } = await client()
    .from("projects")
    .select("data")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data?.data || null;
}

// Insert a new project, returns its new id (uuid).
export async function insertProject(name, data) {
  const user_id = await currentUserId();
  const { data: row, error } = await client()
    .from("projects")
    .insert({ user_id, name: name || "Untitled drawing", data })
    .select("id")
    .single();
  if (error) throw error;
  return row.id;
}

export async function updateProjectRow(id, name, data) {
  const { error } = await client()
    .from("projects")
    .update({ name, data, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteProjectRow(id) {
  const { error } = await client().from("projects").delete().eq("id", id);
  if (error) throw error;
}

// Detect drawings saved on this device under the old browser-storage scheme.
export function localProjectsPending() {
  if (typeof window === "undefined" || !supabase) return 0;
  try {
    if (localStorage.getItem("planworks:migrated")) return 0;
    const raw = localStorage.getItem("planworks:index");
    if (!raw) return 0;
    const idx = JSON.parse(raw);
    return Array.isArray(idx) ? idx.length : 0;
  } catch { return 0; }
}

// One-time upload of this device's locally-saved drawings into the cloud account.
export async function migrateLocalProjects() {
  if (typeof window === "undefined") return 0;
  let count = 0;
  try {
    const raw = localStorage.getItem("planworks:index");
    if (!raw) return 0;
    const index = JSON.parse(raw);
    const user_id = await currentUserId();
    for (const e of index) {
      try {
        const projRaw = localStorage.getItem("planworks:proj:" + e.id);
        if (!projRaw) continue;
        const data = JSON.parse(projRaw);
        const name = e.name || data?.meta?.projectName || "Untitled drawing";
        const { error } = await client().from("projects").insert({ user_id, name, data });
        if (!error) count++;
      } catch { /* skip a bad row */ }
    }
    localStorage.setItem("planworks:migrated", "1");
  } catch (err) {
    console.error("migrate failed", err);
  }
  return count;
}

/* ============================================================================
 * USER SETTINGS  (per-account)
 * One row per user in public.user_settings (user_id uuid PK, data jsonb).
 * Used for the editable title block template (logos + detail lines).
 * Resilient: if the table doesn't exist yet, reads return null instead of
 * throwing, so the app falls back to defaults until the table is created.
 * ========================================================================= */
export async function getSettings() {
  if (!supabase) return null;
  try {
    const user_id = await currentUserId();
    if (!user_id) return null;
    const { data, error } = await client()
      .from("user_settings")
      .select("data")
      .eq("user_id", user_id)
      .maybeSingle();
    if (error) { console.warn("getSettings:", error.message); return null; }
    return data?.data || null;
  } catch (err) {
    console.warn("getSettings failed:", err.message);
    return null;
  }
}

export async function saveSettings(settings) {
  const user_id = await currentUserId();
  if (!user_id) throw new Error("Not signed in.");
  const { error } = await client()
    .from("user_settings")
    .upsert(
      { user_id, data: settings, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
  if (error) throw error;
}
