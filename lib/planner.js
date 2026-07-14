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

// Monday (local midnight) of the current real week.
export function currentMonday() {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  const dow = (t.getDay() + 6) % 7;
  const m = new Date(t);
  m.setDate(t.getDate() - dow);
  return m;
}

function toISODate(dt) {
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + d;
}

// (week 0-3, day 0-5) -> real date string for storage.
function dateFor(w, d) {
  const m = currentMonday();
  m.setDate(m.getDate() + w * 7 + d);
  return toISODate(m);
}

// A stored row -> the shape the planner UI uses (with derived w, d).
function rowToJob(r) {
  const jd = new Date(r.job_date + "T00:00:00");
  jd.setHours(0, 0, 0, 0);
  const mon = currentMonday();
  const dayIdx = (jd.getDay() + 6) % 7; // 0=Mon .. 6=Sun
  const jobMon = new Date(jd);
  jobMon.setDate(jd.getDate() - dayIdx);
  const w = Math.round((jobMon.getTime() - mon.getTime()) / (7 * 86400000));
  return {
    id: r.id,
    c: r.contractor,
    w: w,
    d: dayIdx > 5 ? 5 : dayIdx,
    t: r.start_time || "",
    site: r.site || "",
    type: r.job_type || "",
    addr: r.addr || "",
    cust: r.cust || "",
    st: r.status || "booked",
    notes: r.notes || "",
  };
}

// Load all jobs in the visible 4-week window (this Monday .. Saturday of week 3).
export async function loadPlannerJobs() {
  const mon = currentMonday();
  const start = toISODate(mon);
  const end = new Date(mon);
  end.setDate(mon.getDate() + 3 * 7 + 5);
  const { data, error } = await client()
    .from("planner_jobs")
    .select("*")
    .gte("job_date", start)
    .lte("job_date", toISODate(end));
  if (error) throw error;
  return (data || []).map(rowToJob).filter((j) => j.w >= 0 && j.w <= 3);
}

// Insert or update a job. `job` carries { id, c, w, d, t, site, type, addr, cust, st, notes }.
export async function savePlannerJob(job) {
  const user_id = await currentUserId();
  if (!user_id) throw new Error("Not signed in.");
  const row = {
    id: job.id,
    user_id: user_id,
    job_date: dateFor(job.w, job.d),
    contractor: job.c,
    start_time: job.t || "",
    site: job.site || "",
    job_type: job.type || "",
    addr: job.addr || "",
    cust: job.cust || "",
    status: job.st || "booked",
    notes: job.notes || "",
    updated_at: new Date().toISOString(),
  };
  const { error } = await client().from("planner_jobs").upsert(row, { onConflict: "id" });
  if (error) throw error;
}

export async function deletePlannerJob(id) {
  const { error } = await client().from("planner_jobs").delete().eq("id", id);
  if (error) throw error;
}
