"use client";

import React, { useState } from "react";
import { supabase, isConfigured } from "@/lib/supabase";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const signIn = async (e) => {
    e?.preventDefault();
    if (!isConfigured) { setError("This app isn't linked to the cloud yet."); return; }
    setBusy(true); setError("");
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) setError(error.message || "Couldn't sign in. Check your email and password.");
  };

  return (
    <div className="login-root">
      <style>{CSS}</style>
      <div className="login-rail">
        <div className="brandmark">
          <svg viewBox="0 0 24 24" fill="none"><path d="M13 2 4 13h6l-1 9 9-11h-6l1-9z" fill="#08313a"/></svg>
        </div>
        <div className="wordmark">Plot<b>wire</b></div>
        <p className="tag">Electrical layouts, quotes &amp; bills of quantities — for Watts On Electrical.</p>
        <div className="rail-foot">Watts On Electrical · Leeds</div>
      </div>

      <div className="login-main">
        <form className="login-card" onSubmit={signIn}>
          <h1>Sign in</h1>
          <p className="sub">Welcome back. Your drawings are saved to your account.</p>

          <label className="field">
            <span>Email</span>
            <input type="email" autoComplete="username" value={email}
                   onChange={(e) => setEmail(e.target.value)} placeholder="you@wattsonelectrical.co.uk" required/>
          </label>

          <label className="field">
            <span>Password</span>
            <input type="password" autoComplete="current-password" value={password}
                   onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required/>
          </label>

          {error && <div className="err">{error}</div>}

          <button type="submit" className="submit" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>

          {!isConfigured && (
            <div className="note">The cloud connection isn't set up yet — check the environment variables.</div>
          )}
        </form>
      </div>
    </div>
  );
}

const CSS = `
.login-root{position:fixed; inset:0; display:flex; font-family:'Inter',system-ui,sans-serif; color:#0E141B; background:#F4F6F9}
.login-root *{box-sizing:border-box; margin:0; padding:0}
.login-rail{width:42%; max-width:520px; background:linear-gradient(150deg,#1A2530 0%,#233241 60%,#2C4150 100%); color:#fff; padding:48px 44px; display:flex; flex-direction:column; position:relative; overflow:hidden}
.login-rail::before{content:""; position:absolute; inset:0; background-image:linear-gradient(rgba(63,183,201,.10) 1px,transparent 1px),linear-gradient(90deg,rgba(63,183,201,.10) 1px,transparent 1px); background-size:26px 26px; -webkit-mask-image:linear-gradient(150deg,#000,transparent 75%); mask-image:linear-gradient(150deg,#000,transparent 75%)}
.login-rail .brandmark{width:48px; height:48px; border-radius:13px; background:linear-gradient(150deg,#3FB7C9,#22808F); display:grid; place-items:center; box-shadow:0 8px 20px -6px rgba(63,183,201,.55); position:relative}
.login-rail .brandmark svg{width:24px; height:24px}
.login-rail .wordmark{font-family:'Space Grotesk',sans-serif; font-weight:600; font-size:24px; letter-spacing:-.01em; margin-top:22px; position:relative}
.login-rail .wordmark b{color:#3FB7C9}
.login-rail .tag{color:#aab8c6; font-size:15px; line-height:1.6; margin-top:14px; max-width:320px; position:relative}
.login-rail .rail-foot{margin-top:auto; font-family:'JetBrains Mono',monospace; font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:#7e8ea0; position:relative}
.login-main{flex:1; display:flex; align-items:center; justify-content:center; padding:32px}
.login-card{width:100%; max-width:380px}
.login-card h1{font-family:'Space Grotesk',sans-serif; font-size:26px; font-weight:600; letter-spacing:-.02em}
.login-card .sub{color:#697785; font-size:14px; margin-top:6px; margin-bottom:26px}
.field{display:block; margin-bottom:16px}
.field span{display:block; font-size:12.5px; font-weight:500; color:#3A4654; margin-bottom:6px}
.field input{width:100%; height:46px; border-radius:11px; border:1px solid #E6EBF1; background:#fff; padding:0 14px; font-size:14.5px; color:#0E141B; outline:none; transition:border-color .15s, box-shadow .15s}
.field input:focus{border-color:#3FB7C9; box-shadow:0 0 0 3px rgba(63,183,201,.18)}
.err{background:#FEF2F2; border:1px solid #FECACA; color:#B91C1C; font-size:13px; border-radius:10px; padding:10px 12px; margin-bottom:14px}
.submit{width:100%; height:48px; border:none; border-radius:12px; background:#3FB7C9; color:#08313a; font-weight:600; font-size:15px; cursor:pointer; transition:background .15s, transform .1s}
.submit:hover:not(:disabled){background:#52C4D5}
.submit:active:not(:disabled){transform:translateY(1px)}
.submit:disabled{opacity:.6; cursor:default}
.note{margin-top:16px; font-size:12.5px; color:#9AA6B2; text-align:center}
@media (max-width:760px){.login-rail{display:none}}
`;
