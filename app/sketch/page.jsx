"use client";

import React from "react";
import dynamic from "next/dynamic";

const CadSketch = dynamic(() => import("@/components/cad/CadSketch"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center bg-[#18222D]">
      <div className="text-[10px] tracking-[0.3em] text-slate-400 uppercase">Loading sketch...</div>
    </div>
  ),
});

export default function SketchPage() {
  return <CadSketch />;
}
