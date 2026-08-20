"use client";

/* ============================================================================
 * BUSINESS INFORMATION — the account's own company details.
 *
 * Stage 1: capture and store only. Nothing here feeds into drawings yet.
 * Every read and write goes through lib/companyProfile, which is locked to the
 * signed-in account by RLS at the database level.
 * ========================================================================= */

import React, { useState, useEffect, useRef } from "react";
import { Save, X, Upload, Building2 } from "lucide-react";
import {
  getCompanyProfile, saveCompanyProfile, uploadCompanyLogo, signCompanyLogo, EMPTY_PROFILE,
} from "@/lib/companyProfile";
import { resizeImageToDataUrl } from "@/lib/titleBlock";
import { dataUrlToBlob } from "@/lib/planImages";

const FIELDS = [
  { key: "company_name", label: "Company name", placeholder: "Watts On Electrical Ltd", type: "text" },
  { key: "address", label: "Address", placeholder: "Unit 4, Example Way\nLeeds LS1 1AA", type: "textarea" },
  { key: "phone", label: "Phone", placeholder: "01234 567890", type: "tel" },
  { key: "email", label: "Email", placeholder: "office@example.co.uk", type: "email" },
  { key: "website", label: "Website", placeholder: "www.example.co.uk", type: "text" },
];

export default function BusinessInfo({ onClose }) {
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [logoUrl, setLogoUrl] = useState(null);   // signed URL, or a local preview
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  // Load whatever was saved before, and mint a URL for the stored logo.
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const p = await getCompanyProfile();
        if (!live) return;
        setProfile(p);
        if (p.logo_path) {
          const url = await signCompanyLogo(p.logo_path);
          if (live) setLogoUrl(url);
        }
      } catch (err) {
        if (live) setError(err?.message || "Couldn't load your business information.");
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => { live = false; };
  }, []);

  const set = (key, value) => {
    setProfile(p => ({ ...p, [key]: value }));
    setSaved(false);
    if (error) setError("");
  };

  // Downscale before upload so the stored logo stays small, then keep a local
  // preview so the user sees it immediately.
  const onPickLogo = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // let the same file be chosen again later
    if (!file) return;
    setBusy(true); setError(""); setSaved(false);
    try {
      const dataUrl = await resizeImageToDataUrl(file, 260);
      const path = await uploadCompanyLogo(dataUrlToBlob(dataUrl));
      setProfile(p => ({ ...p, logo_path: path }));
      setLogoUrl(dataUrl);
    } catch (err) {
      setError(err?.message || "Couldn't upload that logo.");
    } finally {
      setBusy(false);
    }
  };

  const save = async (e) => {
    e?.preventDefault();
    if (busy) return;
    setBusy(true); setError("");
    try {
      await saveCompanyProfile(profile);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err?.message || "Couldn't save. Nothing was changed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pw-biz">
      <style>{CSS}</style>
      <div className="biz-sheet">
        <header className="biz-head">
          <div className="biz-head-l">
            <span className="biz-ic"><Building2 size={19} strokeWidth={1.8}/></span>
            <div>
              <h1>Business information</h1>
              <p>Your company details, saved to your account.</p>
            </div>
          </div>
          <button type="button" className="biz-close" onClick={onClose} title="Close without saving" aria-label="Close without saving">
            <X size={19} strokeWidth={2}/>
          </button>
        </header>

        {loading ? (
          <div className="biz-loading">Loading&hellip;</div>
        ) : (
          <form className="biz-body" onSubmit={save}>
            {FIELDS.map(f => (
              <label key={f.key} className="biz-field">
                <span className="biz-label">{f.label}</span>
                {f.type === "textarea" ? (
                  <textarea
                    rows={3}
                    value={profile[f.key] || ""}
                    placeholder={f.placeholder}
                    disabled={busy}
                    onChange={(e) => set(f.key, e.target.value)}
                  />
                ) : (
                  <input
                    type={f.type}
                    value={profile[f.key] || ""}
                    placeholder={f.placeholder}
                    disabled={busy}
                    onChange={(e) => set(f.key, e.target.value)}
                  />
                )}
              </label>
            ))}

            <div className="biz-field">
              <span className="biz-label">Logo</span>
              <div className="biz-logo-row">
                <div className="biz-logo-prev">
                  {logoUrl
                    ? <img src={logoUrl} alt="Company logo" />
                    : <span className="biz-logo-empty">No logo yet</span>}
                </div>
                <button type="button" className="pw-btn-teal" disabled={busy} onClick={() => fileRef.current?.click()}>
                  <Upload size={17} strokeWidth={1.9}/>
                  <span>{logoUrl ? "Replace logo" : "Upload logo"}</span>
                </button>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickLogo}/>
              </div>
              <p className="biz-hint">Stored privately on your account. Not added to drawings yet.</p>
            </div>

            {error && <div className="biz-error" role="alert">{error}</div>}

            <div className="biz-actions">
              <button type="button" className="pw-btn-plain" onClick={onClose} disabled={busy}>Close</button>
              <button type="submit" className="pw-btn-teal" disabled={busy}>
                <Save size={17} strokeWidth={1.9}/>
                <span>{saved ? "Saved ✓" : busy ? "Saving…" : "Save"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

const CSS = `
.pw-biz{position:fixed; inset:0; z-index:1; overflow:auto; padding:28px 20px 48px;
  --teal:#3FB7C9; --teal-600:#2C97A8; --teal-700:#22808F; --navy:#1A2530;
  --paper:#F4F6F9; --surface:#FFFFFF; --line:#E6EBF1; --ink:#0E141B; --ink-2:#3A4654; --muted:#697785;
  background:var(--paper); color:var(--ink);
  font-family:'Inter',system-ui,sans-serif; -webkit-font-smoothing:antialiased}
.pw-biz *{box-sizing:border-box; margin:0; padding:0}
html.dark .pw-biz{--paper:#0E141B; --surface:#16202B; --line:#263441; --ink:#E7EDF3; --ink-2:#C3CEDA; --muted:#8B99A8}

.pw-biz .biz-sheet{max-width:620px; margin:0 auto; background:var(--surface); border:1px solid var(--line); border-radius:18px; overflow:hidden}
.pw-biz .biz-head{display:flex; align-items:flex-start; justify-content:space-between; gap:16px; padding:20px 22px; border-bottom:1px solid var(--line)}
.pw-biz .biz-head-l{display:flex; align-items:center; gap:13px}
.pw-biz .biz-ic{width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex:none; background:var(--teal-600); color:var(--navy)}
.pw-biz .biz-ic svg{display:block}
.pw-biz h1{font-family:'Space Grotesk',system-ui,sans-serif; font-size:18px; font-weight:600; letter-spacing:-.01em}
.pw-biz .biz-head p{font-size:12.5px; color:var(--muted); margin-top:2px}
.pw-biz .biz-close{width:40px; height:40px; flex:none; padding:0; border:0; line-height:0; border-radius:10px; display:flex; align-items:center; justify-content:center; background:var(--teal-600); color:var(--navy); cursor:pointer; transition:background .15s ease}
.pw-biz .biz-close:hover{background:var(--teal-700)}
.pw-biz .biz-close svg{display:block; margin:auto}

.pw-biz .biz-loading{padding:40px 22px; text-align:center; font-size:12px; letter-spacing:.2em; text-transform:uppercase; color:var(--muted)}
.pw-biz .biz-body{padding:22px; display:flex; flex-direction:column; gap:16px}
.pw-biz .biz-field{display:block}
.pw-biz .biz-label{display:block; font-size:12px; font-weight:600; color:var(--ink-2); margin-bottom:6px}
.pw-biz input, .pw-biz textarea{width:100%; font-family:inherit; font-size:14px; color:var(--ink); background:var(--paper); border:1px solid var(--line); border-radius:10px; padding:10px 12px; outline:none; transition:border-color .15s ease, box-shadow .15s ease}
.pw-biz textarea{resize:vertical; min-height:76px; line-height:1.45}
.pw-biz input:focus, .pw-biz textarea:focus{border-color:var(--teal); box-shadow:0 0 0 3px rgba(63,183,201,.18)}
.pw-biz input:disabled, .pw-biz textarea:disabled{opacity:.6}
.pw-biz .biz-hint{font-size:11.5px; color:var(--muted); margin-top:6px}

.pw-biz .biz-logo-row{display:flex; align-items:center; gap:14px; flex-wrap:wrap}
.pw-biz .biz-logo-prev{width:120px; height:64px; flex:none; border:1px dashed var(--line); border-radius:10px; background:var(--paper); display:flex; align-items:center; justify-content:center; overflow:hidden}
.pw-biz .biz-logo-prev img{max-width:100%; max-height:100%; object-fit:contain; display:block}
.pw-biz .biz-logo-empty{font-size:11px; color:var(--muted)}

.pw-biz .biz-error{font-size:12.5px; color:#c0392b}
.pw-biz .biz-actions{display:flex; justify-content:flex-end; gap:10px; margin-top:4px; padding-top:16px; border-top:1px solid var(--line)}

/* App standard: solid teal with a dark navy icon. */
.pw-biz .pw-btn-teal{display:inline-flex; align-items:center; justify-content:center; gap:8px; height:40px; padding:0 16px; font-family:inherit; font-size:13px; font-weight:600; border:0; border-radius:10px; background:var(--teal-600); color:var(--navy); cursor:pointer; transition:background .15s ease}
.pw-biz .pw-btn-teal:hover:not(:disabled){background:var(--teal-700)}
.pw-biz .pw-btn-teal svg{display:block; flex:none}
.pw-biz .pw-btn-plain{height:40px; padding:0 16px; font-family:inherit; font-size:13px; font-weight:600; border:1px solid var(--line); border-radius:10px; background:transparent; color:var(--ink-2); cursor:pointer}
.pw-biz .pw-btn-plain:hover:not(:disabled){background:var(--paper)}
.pw-biz button:disabled{opacity:.55; cursor:not-allowed}
`;
