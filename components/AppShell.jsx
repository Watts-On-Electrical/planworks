"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import LoginScreen from "@/components/LoginScreen";
import { supabase, isConfigured } from "@/lib/supabase";
import { getSettings, saveSettings } from "@/lib/db";
import { DEFAULT_TITLEBLOCK, normaliseTitleBlock } from "@/lib/titleBlock";

const AppCtx = createContext(null);
export const useApp = () => useContext(AppCtx) || {};

function Splash() {
  return (
    <div className="w-full h-screen flex items-center justify-center bg-[#F4F6F9] dark:bg-[#0B1117]">
      <div className="text-[10px] tracking-[0.3em] text-slate-400 uppercase">Loading Plotwire…</div>
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
  const [boqTemplate, setBoqTemplate] = useState(null); // null = use built-in default
  const settingsRef = useRef({}); // latest full settings blob, so saves merge

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

  // Load the account's saved settings (title block + BOQ preset) once signed in.
  useEffect(() => {
    if (!session) { setTitleBlock(null); setBoqTemplate(null); return; }
    let active = true;
    getSettings().then(s => {
      if (!active) return;
      settingsRef.current = s || {};
      setTitleBlock(s?.titleBlock ? normaliseTitleBlock(s.titleBlock) : DEFAULT_TITLEBLOCK);
      setBoqTemplate(s?.boqTemplate || null);
    });
    return () => { active = false; };
  }, [session]);

  const saveTitleBlock = useCallback(async (tb) => {
    const next = normaliseTitleBlock(tb);
    settingsRef.current = { ...settingsRef.current, titleBlock: next };
    await saveSettings(settingsRef.current);
    setTitleBlock(next);
  }, []);

  const saveBoqTemplate = useCallback(async (tpl) => {
    settingsRef.current = { ...settingsRef.current, boqTemplate: tpl };
    await saveSettings(settingsRef.current);
    setBoqTemplate(tpl);
  }, []);

  if (checking) return <Splash />;
  if (!session) return <LoginScreen />;

  return (
    <AppCtx.Provider value={{
      theme, toggleTheme, user: session?.user || null, signOut,
      titleBlock: titleBlock || DEFAULT_TITLEBLOCK, saveTitleBlock,
      boqTemplate, saveBoqTemplate,
    }}>
      {children}
    </AppCtx.Provider>
  );
}
