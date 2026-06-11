"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import LoginScreen from "@/components/LoginScreen";
import { supabase, isConfigured } from "@/lib/supabase";
import { getSettings, saveSettings } from "@/lib/db";
import { DEFAULT_TITLEBLOCK, normaliseTitleBlock } from "@/lib/titleBlock";

const AppCtx = createContext(null);
export const useApp = () => useContext(AppCtx) || {};

function Splash() {
  return (
    <div className="w-full h-screen flex items-center justify-center bg-[#F4F6F9] dark:bg-[#0B1117]">
      <div className="text-[10px] tracking-[0.3em] text-slate-400 uppercase">Loading Plan.Works…</div>
    </div>
  );
}

export default function AppShell({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "light";
    try { return localStorage.getItem("planworks:theme") || "light"; } catch { return "light"; }
  });
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);
  const [titleBlock, setTitleBlock] = useState(null); // null until loaded → default in the meantime

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    try { localStorage.setItem("planworks:theme", theme); } catch {}
  }, [theme]);

  useEffect(() => {
    if (!isConfigured || !supabase) { setChecking(false); setSession(false); return; }
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session || false);
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s || false);
      setChecking(false);
    });
    return () => { active = false; sub?.subscription?.unsubscribe(); };
  }, []);

  const toggleTheme = useCallback(() => setTheme(t => (t === "dark" ? "light" : "dark")), []);
  const signOut = useCallback(async () => { try { await supabase?.auth.signOut(); } catch {} }, []);

  // Load the account's title block template once signed in.
  useEffect(() => {
    if (!session) { setTitleBlock(null); return; }
    let active = true;
    getSettings().then(s => {
      if (!active) return;
      setTitleBlock(s?.titleBlock ? normaliseTitleBlock(s.titleBlock) : DEFAULT_TITLEBLOCK);
    });
    return () => { active = false; };
  }, [session]);

  const saveTitleBlock = useCallback(async (tb) => {
    const next = normaliseTitleBlock(tb);
    await saveSettings({ titleBlock: next });
    setTitleBlock(next);
  }, []);

  if (checking) return <Splash />;
  if (!session) return <LoginScreen />;

  return (
    <AppCtx.Provider value={{
      theme, toggleTheme, user: session?.user || null, signOut,
      titleBlock: titleBlock || DEFAULT_TITLEBLOCK, saveTitleBlock,
    }}>
      {children}
    </AppCtx.Provider>
  );
}
