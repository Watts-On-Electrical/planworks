"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/components/AppShell";

const Editor = dynamic(() => import("@/components/ElectricalPlanTool"), { ssr: false });
import EditorErrorBoundary from "@/components/EditorErrorBoundary";

function Loading() {
  return (
    <div className="w-full h-screen flex items-center justify-center bg-[#F4F6F9] dark:bg-[#0B1117]">
      <div className="text-[10px] tracking-[0.3em] text-slate-400 uppercase">New drawing…</div>
    </div>
  );
}

function NewInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const { theme, toggleTheme } = useApp();
  const mode = sp.get("import") ? "import" : "new";

  return (
    <EditorErrorBoundary>
    <Editor
      initialTarget={{ mode, key: "new" }}
      onHome={() => router.push("/")}
      onProjectId={(newId) => {
        // When the new drawing is first saved it gets a real id — reflect it in
        // the address bar so it becomes linkable, without a disruptive reload.
        if (newId && typeof window !== "undefined") {
          window.history.replaceState(null, "", `/drawing?id=${newId}`);
        }
      }}
      theme={theme}
      onToggleTheme={toggleTheme}
    />
    </EditorErrorBoundary>
  );
}

export default function NewPage() {
  return (
    <Suspense fallback={<Loading />}>
      <NewInner />
    </Suspense>
  );
}
