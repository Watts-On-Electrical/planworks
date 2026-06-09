"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import LoginScreen from "@/components/LoginScreen";
import { supabase, isConfigured } from "@/lib/supabase";

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

  if (checking) return <Splash />;
  if (!session) return <LoginScreen />;

  return (
    <AppCtx.Provider value={{ theme, toggleTheme, user: session?.user || null, signOut }}>
      {children}
    </AppCtx.Provider>
  );
}
