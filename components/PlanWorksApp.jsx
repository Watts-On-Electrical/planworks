"use client";

import React, { useState, useCallback, useEffect } from "react";
import HomeScreen from "@/components/HomeScreen";
import ElectricalPlanTool from "@/components/ElectricalPlanTool";
import LoginScreen from "@/components/LoginScreen";
import { supabase, isConfigured } from "@/lib/supabase";

export default function PlanWorksApp() {
  const [view, setView] = useState("home");      // "home" | "editor"
  const [target, setTarget] = useState(null);
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "light";
    try { return localStorage.getItem("planworks:theme") || "light"; } catch { return "light"; }
  });

  // Auth: null = still checking, false = signed out, object = signed in
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
  const signOut = useCallback(async () => {
    try { await supabase?.auth.signOut(); } catch {}
    setView("home"); setTarget(null);
  }, []);

  const openProject = useCallback((projectId) => { setTarget({ mode: "open", projectId, key: Date.now() }); setView("editor"); }, []);
  const newProject = useCallback((category) => { setTarget({ mode: "new", category, key: Date.now() }); setView("editor"); }, []);
  const importPlan = useCallback(() => { setTarget({ mode: "import", key: Date.now() }); setView("editor"); }, []);
  const goHome = useCallback(() => { setView("home"); setTarget(null); }, []);

  if (checking) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-[#F4F6F9] dark:bg-[#0B1117]">
        <div className="text-[10px] tracking-[0.3em] text-slate-400 uppercase">Loading Plotwire…</div>
      </div>
    );
  }

  if (!session) {
    return <LoginScreen />;
  }

  if (view === "editor") {
    return (
      <ElectricalPlanTool
        key={target?.key || "editor"}
        initialTarget={target}
        onHome={goHome}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }
  return (
    <HomeScreen
      onOpenProject={openProject}
      onNewProject={newProject}
      onImport={importPlan}
      theme={theme}
      onToggleTheme={toggleTheme}
      user={session?.user}
      onSignOut={signOut}
    />
  );
}
