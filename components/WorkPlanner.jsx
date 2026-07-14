"use client";

import React, { useState, useRef, useEffect } from "react";
import { loadPlannerJobs, savePlannerJob, deletePlannerJob } from "@/lib/planner";

const CDEF = {
  joe:  { id: "joe",  name: "Joe Brown",       color: "#0e8a8a", tint: "#e8f4f4" },
  and:  { id: "and",  name: "Andrew Shepard",  color: "#2f6fed", tint: "#ecf1fe" },
  jack: { id: "jack", name: "Jack Edwards",    color: "#c9721a", tint: "#fbf1e6" },
  sam:  { id: "sam",  name: "Sam Ward",        color: "#7c4dd6", tint: "#f2ecfb" },
  ant:  { id: "ant",  name: "Anthony Wildman", color: "#d23f6a", tint: "#fce9ef" },
  s1:   { id: "s1",   name: "Available",       color: "#9aa5a5", tint: "#f4f6f6", avail: 1, slot: 1 },
  s2:   { id: "s2",   name: "Available",       color: "#9aa5a5", tint: "#f4f6f6", avail: 1, slot: 2 },
  s3:   { id: "s3",   name: "Available",       color: "#9aa5a5", tint: "#f4f6f6", avail: 1, slot: 3 },
};
const ROSTER = ["joe", "and", "jack", "sam", "ant", "s1", "s2", "s3"].map((k) => CDEF[k]);
const LEGEND = ["joe", "and", "jack", "sam", "ant"];
const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const TYPES = ["Rewire", "EICR", "Fault", "Consumer Unit", "EV Charger", "Lighting", "Heating", "Solar / Battery", "Inspection", "Snagging", "Callout", "Holiday", "Other"];
const STATUS = {
  booked:    { text: "Booked",    bg: "#eef1f3", fg: "#4a5560" },
  done:      { text: "Done",      bg: "#e4f3ea", fg: "#1f7a44" },
  cancelled: { text: "Cancelled", bg: "#fbe6e6", fg: "#c0392b" },
};

const fmt = (dt) => dt.getDate() + " " + MON[dt.getMonth()];
const cLabel = (c) => (c.avail ? "Spare slot " + c.slot : c.name);
const uid = () => "j-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6);

function weekDates() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dow = (today.getDay() + 6) % 7;
  const monday0 = new Date(today);
  monday0.setDate(today.getDate() - dow);
  return { today, monday0 };
}

const FONTS = "'Barlow', system-ui, sans-serif";
const COND = "'Barlow Condensed', 'Barlow', sans-serif";
const SEMI = "'Barlow Semi Condensed', 'Barlow', sans-serif";

function Pill({ st }) {
  return (
    <span style={{ display: "inline-block", font: "600 10px/1 " + FONTS, letterSpacing: ".04em", textTransform: "uppercase", padding: "3px 6px", borderRadius: 4, background: st.bg, color: st.fg }}>
      {st.text}
    </span>
  );
}

function JobCard({ j, onClick }) {
  const c = CDEF[j.c] || {};
  const st = STATUS[j.st] || STATUS.booked;
  const cancelled = j.st === "cancelled";
  const sub = [j.addr, j.cust].filter((x) => x && x !== "\u2014").join(" \u00b7 ") + (j.notes ? " \u2014 " + j.notes : "");
  return (
    <div onClick={onClick} style={{ cursor: "pointer", background: "#fff", border: "1px solid #dde4e4", borderLeft: "4px solid " + c.color, borderRadius: 6, padding: "7px 8px 8px", marginBottom: 6, opacity: cancelled ? 0.6 : 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 6 }}>
        <span style={{ fontFamily: COND, fontWeight: 700, fontSize: 14, color: "#0d3c3c" }}>{j.t}</span>
        <Pill st={st} />
      </div>
      <div style={{ fontFamily: SEMI, fontWeight: 700, fontSize: 13.5, color: cancelled ? "#96a0a0" : "#20302f", lineHeight: 1.15, textDecoration: cancelled ? "line-through" : "none" }}>{j.site}</div>
      <div style={{ fontFamily: COND, fontWeight: 600, fontSize: 11, letterSpacing: ".06em", textTransform: "uppercase", color: "#7a8686", marginTop: 1 }}>{j.type}</div>
      {sub && <div style={{ fontSize: 11.5, color: "#5f6c6c", marginTop: 3, lineHeight: 1.3 }}>{sub}</div>}
    </div>
  );
}

const LBL = { fontFamily: COND, fontWeight: 600, fontSize: 12, letterSpacing: ".05em", textTransform: "uppercase", color: "#7a8686" };
function Field({ label, children }) {
  return <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}><span style={LBL}>{label}</span>{children}</label>;
}

export default function WorkPlanner() {
  const [week, setWeek] = useState(0);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [exporting, setExporting] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try { const rows = await loadPlannerJobs(); if (alive) setJobs(rows); }
      catch (e) { console.error(e); if (alive) setJobs([]); }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, []);

  const reload = async () => {
    try { const rows = await loadPlannerJobs(); setJobs(rows); } catch (e) { console.error(e); }
  };

  const { today, monday0 } = weekDates();
  const weekStart = new Date(monday0); weekStart.setDate(monday0.getDate() + week * 7);
  const weekTitle = "W/C Mon " + weekStart.getDate() + " " + MON[weekStart.getMonth()] + " " + weekStart.getFullYear();

  const days = DAY_NAMES.map((nm, i) => {
    const dt = new Date(weekStart); dt.setDate(weekStart.getDate() + i);
    return { name: nm, date: fmt(dt), narrow: i === 5, isToday: dt.getTime() === today.getTime() };
  });

  const openNew = (cid, di) => setEditing({ id: uid(), w: week, c: cid, d: di, t: "08:00", site: "", type: "Rewire", addr: "", cust: "", st: "booked", notes: "", isNew: true });
  const openEdit = (id) => { const j = jobs.find((x) => x.id === id); if (j) setEditing({ ...j, isNew: false }); };
  const setField = (f, v) => setEditing((e) => ({ ...e, [f]: f === "d" ? Number(v) : v }));

  const commitEdit = async () => {
    const e = editing;
    const clean = { id: e.id, c: e.c, w: e.w, d: e.d, t: e.t, site: e.site, type: e.type, addr: e.addr, cust: e.cust, st: e.st, notes: e.notes };
    setJobs((prev) => { const i = prev.findIndex((j) => j.id === clean.id); if (i >= 0) { const n = prev.slice(); n[i] = clean; return n; } return [...prev, clean]; });
    setEditing(null);
    try { await savePlannerJob(clean); } catch (err) { alert("Could not save the job: " + (err && err.message ? err.message : err)); reload(); }
  };

  const deleteJob = async () => {
    const id = editing.id;
    setJobs((prev) => prev.filter((j) => j.id !== id));
    setEditing(null);
    try { await deletePlannerJob(id); } catch (err) { alert("Could not delete the job: " + (err && err.message ? err.message : err)); reload(); }
  };

  const exportImage = async () => {
    const card = cardRef.current;
    if (!card || exporting) return;
    setExporting(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(card, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
      canvas.toBlob((blob) => {
        setExporting(false);
        if (!blob) { alert("Could not create image."); return; }
        const fname = "watts-on-week.png";
        let file = null;
        try { file = new File([blob], fname, { type: "image/png" }); } catch (e) {}
        if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
          navigator.share({ files: [file], title: "Work Planner" }).catch(() => {});
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url; a.download = fname; document.body.appendChild(a); a.click(); a.remove();
          setTimeout(() => URL.revokeObjectURL(url), 3000);
        }
      }, "image/png");
    } catch (e) {
      setExporting(false);
      alert("Could not create image: " + (e && e.message ? e.message : e));
    }
  };

  const navBtn = (disabled) => ({ fontFamily: COND, fontWeight: 600, fontSize: 14, padding: "6px 12px", borderRadius: 6, cursor: "pointer", background: "rgba(255,255,255,.14)", color: "#fff", border: "1px solid rgba(255,255,255,.35)", opacity: disabled ? 0.35 : 1, pointerEvents: disabled ? "none" : "auto" });
  const dayFlex = (narrow) => ({ flex: narrow ? ".62 1 0" : "1 1 0" });

  if (loading) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#e7eceb", fontFamily: FONTS, color: "#7a8686", fontSize: 13 }}>Loading planner\u2026</div>;
  }

  return (
    <div style={{ minHeight: "100vh", padding: "32px 30px 44px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14, fontFamily: FONTS, background: "#e7eceb" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@500;600;700&family=Barlow+Semi+Condensed:wght@600;700&display=swap');
        .wp-cell .wp-add{opacity:0;transition:opacity .12s}
        .wp-cell:hover .wp-add{opacity:1}
        .wp-field{width:100%;font-family:${FONTS};font-size:14px;padding:8px 10px;border:1px solid #cfd8d8;border-radius:7px;background:#fff;box-sizing:border-box}
        .wp-field:focus{outline:none;border-color:#0d7a7a;box-shadow:0 0 0 3px rgba(13,122,122,.15)}
      `}</style>

      <div style={{ width: 1300, maxWidth: "100%", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 14 }}>
        <span style={{ fontSize: 12.5, color: "#7a8686" }}>Sends a clean image of this week \u2014 pick WhatsApp from the share sheet, or it downloads a PNG.</span>
        <button onClick={exportImage} style={{ fontFamily: COND, fontWeight: 700, fontSize: 14, letterSpacing: ".02em", padding: "9px 18px", borderRadius: 8, cursor: "pointer", background: "#0d7a7a", color: "#fff", border: "1px solid #0d7a7a" }}>
          {exporting ? "Preparing image\u2026" : "Share this week as image \u25b8"}
        </button>
      </div>

      <div ref={cardRef} style={{ width: 1300, maxWidth: "100%", background: "#fff", border: "1px solid #cfd8d8", borderRadius: 14, overflow: "hidden", boxShadow: "0 16px 44px -22px rgba(13,60,60,.4)" }}>
        <div style={{ background: "#0d7a7a", color: "#fff", padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 13 }}>
            <span style={{ fontFamily: COND, fontWeight: 700, fontSize: 26, letterSpacing: ".02em" }}>WATTS ON</span>
            <span style={{ fontSize: 13, opacity: 0.85, letterSpacing: ".12em", textTransform: "uppercase" }}>Work Planner</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button onClick={() => setWeek((w) => Math.max(0, w - 1))} style={navBtn(week === 0)}>\u2039 Prev</button>
            <div style={{ fontFamily: SEMI, fontWeight: 700, fontSize: 21, textAlign: "center", minWidth: 280 }}>{weekTitle}</div>
            <button onClick={() => setWeek((w) => Math.min(3, w + 1))} style={navBtn(week === 3)}>Next \u203a</button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, padding: "11px 24px", background: "#f2f6f6", borderBottom: "1px solid #dbe3e3", alignItems: "center", flexWrap: "wrap" }}>
          {[0, 1, 2, 3].map((w) => {
            const s = new Date(monday0); s.setDate(monday0.getDate() + w * 7);
            const active = w === week;
            return (
              <button key={w} onClick={() => setWeek(w)} style={{ fontFamily: COND, fontWeight: 600, fontSize: 13, letterSpacing: ".03em", padding: "6px 13px", borderRadius: 6, cursor: "pointer", background: active ? "#0d7a7a" : "#fff", color: active ? "#fff" : "#5a6767", border: "1px solid " + (active ? "#0d7a7a" : "#d3dcdc") }}>
                {"Wk " + (w + 1) + " \u00b7 " + fmt(s)}
              </button>
            );
          })}
          <span style={{ fontSize: 12.5, color: "#8a9797", fontStyle: "italic", marginLeft: 6 }}>Rolls automatically. Tap a cell to add a job \u00b7 tap a job to edit.</span>
        </div>

        <div style={{ display: "flex", alignItems: "stretch", background: "#0d7a7a" }}>
          <div style={{ width: 186, flex: "none", padding: "12px 16px", color: "#cdecec", fontFamily: COND, fontWeight: 600, fontSize: 13, letterSpacing: ".09em", textTransform: "uppercase", borderRight: "2px solid rgba(255,255,255,.28)" }}>Contractor</div>
          {days.map((d, i) => (
            <div key={i} style={{ ...dayFlex(d.narrow), padding: "9px 13px", color: "#fff", borderRight: "1px solid rgba(255,255,255,.22)", background: d.isToday ? "#0a6060" : d.narrow ? "rgba(255,255,255,.10)" : "transparent" }}>
              <div style={{ fontFamily: COND, fontWeight: 700, fontSize: 17, letterSpacing: ".03em" }}>{d.name}</div>
              <div style={{ fontSize: 12, opacity: 0.82 }}>{d.date}</div>
              {d.isToday && <div style={{ fontFamily: FONTS, fontWeight: 700, fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", background: "#fff", color: "#0d7a7a", borderRadius: 3, padding: "1px 6px", marginTop: 3, display: "inline-block" }}>Today</div>}
            </div>
          ))}
        </div>

        {ROSTER.map((c) => (
          <div key={c.id} style={{ display: "flex", alignItems: "stretch", borderTop: "1px solid #d3dcdc" }}>
            <div style={{ width: 186, flex: "none", padding: "11px 14px", background: c.tint, borderRight: "2px solid #c3cccd", display: "flex", alignItems: "center", gap: 9 }}>
              <span style={{ width: 11, height: 11, borderRadius: 3, background: c.color, flex: "none", opacity: c.avail ? 0.5 : 1 }} />
              <span style={{ fontFamily: SEMI, fontWeight: c.avail ? 600 : 700, fontSize: 15, lineHeight: 1.1, color: c.avail ? "#9aa5a5" : "inherit", fontStyle: c.avail ? "italic" : "normal" }}>{cLabel(c)}</span>
            </div>
            {days.map((d, di) => {
              const list = jobs.filter((j) => j.w === week && j.c === c.id && j.d === di);
              return (
                <div key={di} className="wp-cell" onClick={(ev) => { if (ev.target.closest("[data-job]")) return; openNew(c.id, di); }}
                  style={{ ...dayFlex(d.narrow), padding: "7px 7px 2px", borderRight: "2px solid #c9d1d1", minHeight: 82, cursor: "pointer", background: d.isToday ? "#eef7f6" : d.narrow ? "#f8fafa" : "#fff" }}>
                  {list.map((j) => (
                    <div data-job key={j.id}><JobCard j={j} onClick={(ev) => { ev.stopPropagation(); openEdit(j.id); }} /></div>
                  ))}
                  <div className="wp-add" style={{ textAlign: "center", color: "#9aa5a5", fontFamily: COND, fontWeight: 600, fontSize: 13, padding: "2px 0 4px" }}>+ add job</div>
                </div>
              );
            })}
          </div>
        ))}

        <div style={{ display: "flex", flexWrap: "wrap", gap: "16px 26px", padding: "15px 24px", background: "#f6f9f9", borderTop: "1px solid #dbe3e3", alignItems: "center" }}>
          <span style={{ fontFamily: COND, fontWeight: 600, fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", color: "#8a9797" }}>Key</span>
          {LEGEND.map((k) => { const c = CDEF[k]; return (
            <span key={k} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 500 }}>
              <span style={{ display: "inline-block", width: 12, height: 12, borderRadius: 3, background: c.color }} />{c.name}
            </span>
          ); })}
          <span style={{ width: 1, height: 16, background: "#cdd6d6" }} />
          {["booked", "done", "cancelled"].map((k) => <Pill key={k} st={STATUS[k]} />)}
        </div>
      </div>

      {editing && (
        <div onClick={(ev) => { if (ev.target === ev.currentTarget) setEditing(null); }}
          style={{ position: "fixed", inset: 0, background: "rgba(15,30,30,.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, zIndex: 50 }}>
          <div style={{ width: 440, maxWidth: "100%", maxHeight: "92vh", overflow: "auto", background: "#fff", borderRadius: 14, boxShadow: "0 24px 60px -20px rgba(0,0,0,.5)" }}>
            <div style={{ background: "#0d7a7a", color: "#fff", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontFamily: SEMI, fontWeight: 700, fontSize: 19 }}>{editing.isNew ? "New job" : "Edit job"}</span>
              <span style={{ fontFamily: COND, fontWeight: 600, fontSize: 13, opacity: 0.85 }}>{(CDEF[editing.c] ? cLabel(CDEF[editing.c]) : "") + " \u00b7 " + DAY_NAMES[editing.d]}</span>
            </div>
            <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 13 }}>
              <div style={{ display: "flex", gap: 12 }}>
                <Field label="Contractor"><select className="wp-field" value={editing.c} onChange={(e) => setField("c", e.target.value)}>{ROSTER.map((c) => <option key={c.id} value={c.id}>{cLabel(c)}</option>)}</select></Field>
                <Field label="Day"><select className="wp-field" value={editing.d} onChange={(e) => setField("d", e.target.value)}>{DAY_NAMES.map((n, i) => <option key={i} value={i}>{n}</option>)}</select></Field>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <label style={{ width: 120, display: "flex", flexDirection: "column", gap: 5 }}><span style={LBL}>Start time</span><input className="wp-field" value={editing.t} onChange={(e) => setField("t", e.target.value)} placeholder="08:00" /></label>
                <Field label="Status"><select className="wp-field" value={editing.st} onChange={(e) => setField("st", e.target.value)}><option value="booked">Booked</option><option value="done">Done</option><option value="cancelled">Cancelled</option></select></Field>
              </div>
              <label style={{ display: "flex", flexDirection: "column", gap: 5 }}><span style={LBL}>Job / site name</span><input className="wp-field" value={editing.site} onChange={(e) => setField("site", e.target.value)} placeholder="e.g. Elm Court rewire" /></label>
              <div style={{ display: "flex", gap: 12 }}>
                <Field label="Job type"><select className="wp-field" value={editing.type} onChange={(e) => setField("type", e.target.value)}>{TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
                <Field label="Customer"><input className="wp-field" value={editing.cust} onChange={(e) => setField("cust", e.target.value)} placeholder="e.g. Mrs Patel" /></Field>
              </div>
              <label style={{ display: "flex", flexDirection: "column", gap: 5 }}><span style={LBL}>Address / postcode</span><input className="wp-field" value={editing.addr} onChange={(e) => setField("addr", e.target.value)} placeholder="e.g. 14 Elm Rd, L23" /></label>
              <label style={{ display: "flex", flexDirection: "column", gap: 5 }}><span style={LBL}>Notes</span><input className="wp-field" value={editing.notes} onChange={(e) => setField("notes", e.target.value)} placeholder="e.g. Day 1 \u2014 1st fix" /></label>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
                {!editing.isNew && <button onClick={deleteJob} style={{ fontFamily: FONTS, fontWeight: 600, fontSize: 14, padding: "9px 14px", borderRadius: 8, cursor: "pointer", background: "#fff", color: "#c0392b", border: "1px solid #e6b8b8" }}>Delete</button>}
                <div style={{ flex: 1 }} />
                <button onClick={() => setEditing(null)} style={{ fontFamily: FONTS, fontWeight: 600, fontSize: 14, padding: "9px 16px", borderRadius: 8, cursor: "pointer", background: "#eef1f1", color: "#4a5560", border: "1px solid #d7dede" }}>Cancel</button>
                <button onClick={commitEdit} style={{ fontFamily: FONTS, fontWeight: 700, fontSize: 14, padding: "9px 18px", borderRadius: 8, cursor: "pointer", background: "#0d7a7a", color: "#fff", border: "1px solid #0d7a7a" }}>Save job</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
