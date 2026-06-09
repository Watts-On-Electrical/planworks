"use client";

import React, { useState, useCallback } from "react";
import HomeScreen from "@/components/HomeScreen";
import ElectricalPlanTool from "@/components/ElectricalPlanTool";

export default function PlanWorksApp() {
  const [view, setView] = useState("home");      // "home" | "editor"
  const [target, setTarget] = useState(null);     // { mode, projectId?, category?, key }

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
      />
    );
  }
  return (
    <HomeScreen
      onOpenProject={openProject}
      onNewProject={newProject}
      onImport={importPlan}
    />
  );
}
