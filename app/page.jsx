"use client";

import dynamic from "next/dynamic";

// The tool uses window APIs (FileReader, drag/drop, pdf.js) so we disable SSR.
const ElectricalPlanTool = dynamic(() => import("@/components/ElectricalPlanTool"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center bg-[#f4f1ec]">
      <div className="text-[10px] tracking-[0.3em] text-stone-500 uppercase">Loading...</div>
    </div>
  ),
});

export default function Home() {
  return <ElectricalPlanTool />;
}
