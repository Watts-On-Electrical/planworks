"use client";

import React, { useState, useCallback, useEffect } from "react";
import HomeScreen from "@/components/HomeScreen";
import ElectricalPlanTool from "@/components/ElectricalPlanTool";

export default function PlanWorksApp() {
  const [view, setView] = useState("home");      // "home" | "editor"
  const [target, setTarget] = useState(null);     // { mode, projectId?, category?, key }
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "light";
    try { return localStorage.getItem("planworks:theme") || "light"; } catch { return "light"; }
  });

  // Keep <html class="dark"> and the saved preference in sync with the theme.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    try { localStorage.setItem("planworks:theme", theme); } catch {}
  }, [theme]);

  const toggleTheme = useCallback(() => setTheme(t => (t === "dark" ? "light" : "dark")), []);

  const openProject = useCallback((projectId) => {
    setTarget({ mode: "open", projectId, key: Date.now() });
    setView("editor");
  }, []);
  const newProject = useCallback((category) => {
    setTarget({ mode: "new", category, key: Date.now() });
    setView("editor");
  }, []);
  const importPlan = useCallback(() => {
    setTarget({ mode: "import", key: Date.now() });
    setView("editor");
  }, []);
  const goHome = useCallback(() => {
    setView("home");
    setTarget(null);
  }, []);

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
    />
  );
}
