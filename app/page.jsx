"use client";

import dynamic from "next/dynamic";

// The app uses window APIs (FileReader, drag/drop, pdf.js, localStorage) so we disable SSR.
const PlanWorksApp = dynamic(() => import("@/components/PlanWorksApp"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center bg-[#F4F6F9]">
      <div className="text-[10px] tracking-[0.3em] text-slate-400 uppercase">Loading Plan.Works…</div>
    </div>
  ),
});

export default function Home() {
  return <PlanWorksApp />;
}
