"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Upload, Trash2, Save, FolderOpen, Download, Undo2, Redo2,
  MousePointer2, Cable, RotateCw, ZoomIn, ZoomOut, Maximize2,
  Palette, Ruler,
} from "lucide-react";
import { storage } from "@/lib/storage";

/* ============================================================================
 * SYMBOL LIBRARY — UK Architectural Plan Style, colour-coded by category.
 * ----------------------------------------------------------------------------
 * Each category has a primary colour applied to symbol bodies. Heating bars
 * keep their conventional red/blue (BS convention) regardless of mode.
 * Toggle "mono" mode in the top bar to render everything black for printing.
 * ========================================================================= */

const STROKE = 2.0;
const FEEDER = 1.4;

// Category palette — desaturated, plan-appropriate hues that read well on
// both white and warm-cream backgrounds. Each has a primary + a paler
// "wall line" tint so feeder lines don't compete with bodies.
const CATEGORY_COLOURS = {
  sockets:   { primary: "#1d4ed8", soft: "#93c5fd", label: "Blue"   }, // blue
  switches:  { primary: "#15803d", soft: "#86efac", label: "Green"  }, // green
  lighting:  { primary: "#b45309", soft: "#fcd34d", label: "Amber"  }, // amber
  detectors: { primary: "#b91c1c", soft: "#fca5a5", label: "Red"    }, // red
  fixtures:  { primary: "#6d28d9", soft: "#c4b5fd", label: "Violet" }, // violet
  heating:   { primary: "#0f172a", soft: "#94a3b8", label: "Slate"  }, // slate (bars use their own colours)
};

// Helper: a wall-mount line drawn in the category's softer tone
const Wall = ({ y = 28, x1 = 4, x2 = 44 }) => (
  <line x1={x1} y1={y} x2={x2} y2={y} stroke="var(--feeder)" strokeWidth={FEEDER} strokeLinecap="round"/>
);

// Symbols. Bodies use stroke="currentColor" / fill="currentColor".
// The category colour is set by CSS var --body on the parent <svg>.
// Wall lines and feeders use --feeder.
const SYMBOLS = {
  sockets: {
    label: "Sockets",
    items: [
      { id: "sock_sso_2a", name: "2A Socket", svg: (
        <g>
          <path d="M 14 28 A 10 10 0 0 1 34 28 Z" fill="currentColor" transform="scale(0.85) translate(4 5)"/>
        </g>
      )},
      { id: "sock_sso", name: "SSO (Single)", svg: (
        <g>
          <path d="M 14 28 A 10 10 0 0 1 34 28 Z" fill="currentColor"/>
          <line x1="24" y1="20" x2="24" y2="12" stroke="var(--feeder)" strokeWidth={FEEDER} strokeLinecap="round"/>
        </g>
      )},
      { id: "sock_dso", name: "DSO (Double)", svg: (
        <g>
          {/* Two hemispheres side-by-side, both opening upward */}
          <path d="M 4 28 A 10 10 0 0 1 24 28 Z" fill="currentColor"/>
          <path d="M 24 28 A 10 10 0 0 1 44 28 Z" fill="currentColor"/>
          <line x1="14" y1="20" x2="14" y2="12" stroke="var(--feeder)" strokeWidth={FEEDER} strokeLinecap="round"/>
          <line x1="34" y1="20" x2="34" y2="12" stroke="var(--feeder)" strokeWidth={FEEDER} strokeLinecap="round"/>
        </g>
      )},
      { id: "sock_usbc", name: "USB-C Socket", svg: (
        <g>
          {/* Hemisphere body matching SSO style */}
          <path d="M 6 28 A 10 10 0 0 1 26 28 Z" fill="currentColor"/>
          <line x1="16" y1="20" x2="16" y2="12" stroke="var(--feeder)" strokeWidth={FEEDER} strokeLinecap="round"/>
          {/* USB-C label sits to the right */}
          <text x="36" y="26" fontSize="7.5" textAnchor="middle" fill="currentColor"
                fontFamily="ui-sans-serif, system-ui, sans-serif" fontWeight="700">USB</text>
          <text x="36" y="34" fontSize="6.5" textAnchor="middle" fill="currentColor"
                fontFamily="ui-sans-serif, system-ui, sans-serif" fontWeight="600">-C</text>
        </g>
      )},
      { id: "sock_cat5", name: "Cat5 Outlet", svg: (
        <g>
          <path d="M 14 28 A 10 10 0 0 1 34 28 Z" fill="none" stroke="currentColor" strokeWidth={STROKE}/>
        </g>
      )},
      { id: "sock_cooker", name: "Cooker", svg: (
        <g>
          <path d="M 6 30 A 14 14 0 0 1 42 30 Z" fill="currentColor"/>
          <line x1="24" y1="20" x2="24" y2="10" stroke="var(--feeder)" strokeWidth={FEEDER} strokeLinecap="round"/>
        </g>
      )},
      { id: "sock_shaver", name: "Shaver Point", svg: (
        <g>
          <rect x="10" y="10" width="28" height="12" fill="none" stroke="currentColor" strokeWidth={STROKE} strokeLinejoin="round"/>
          <circle cx="18" cy="16" r="1.6" fill="currentColor"/>
          <circle cx="30" cy="16" r="1.6" fill="currentColor"/>
          <line x1="14" y1="22" x2="14" y2="28" stroke="currentColor" strokeWidth={FEEDER}/>
          <line x1="34" y1="22" x2="34" y2="28" stroke="currentColor" strokeWidth={FEEDER}/>
        </g>
      )},
      { id: "sock_tv", name: "TV Outlet", svg: (
        <g>
          <rect x="14" y="10" width="20" height="14" fill="none" stroke="currentColor" strokeWidth={STROKE} strokeLinejoin="round"/>
          <text x="24" y="20" fontSize="9" textAnchor="middle" fill="currentColor"
                fontFamily="ui-sans-serif, system-ui, sans-serif" fontWeight="600">TV</text>
          <line x1="34" y1="17" x2="44" y2="17" stroke="currentColor" strokeWidth={FEEDER} strokeLinecap="round"/>
        </g>
      )},
      { id: "sock_fcu", name: "Fused Spur", svg: (
        <g>
          <rect x="14" y="10" width="20" height="14" fill="none" stroke="currentColor" strokeWidth={STROKE} strokeLinejoin="round"/>
          <text x="24" y="20" fontSize="8" textAnchor="middle" fill="currentColor"
                fontFamily="ui-sans-serif, system-ui, sans-serif" fontWeight="600">FCU</text>
        </g>
      )},
    ],
  },

  switches: {
    label: "Switches",
    items: [
      { id: "sw_light", name: "Light Switch", svg: (
        <g>
          <circle cx="14" cy="28" r="2.6" fill="currentColor"/>
          <line x1="14" y1="28" x2="32" y2="14" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round"/>
        </g>
      )},
      { id: "sw_2way", name: "2-Way Switch", svg: (
        <g>
          <circle cx="14" cy="28" r="2.6" fill="currentColor"/>
          <line x1="14" y1="28" x2="32" y2="14" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round"/>
          <text x="38" y="18" fontSize="8" textAnchor="middle" fill="currentColor"
                fontFamily="ui-sans-serif, system-ui, sans-serif" fontWeight="600">2</text>
        </g>
      )},
      { id: "sw_intermediate", name: "Intermediate", svg: (
        <g>
          <circle cx="14" cy="28" r="2.6" fill="currentColor"/>
          <line x1="14" y1="28" x2="32" y2="14" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round"/>
          <text x="40" y="18" fontSize="6.5" textAnchor="middle" fill="currentColor"
                fontFamily="ui-sans-serif, system-ui, sans-serif" fontWeight="600">int</text>
        </g>
      )},
      // Dimmer keeps its red identity even in colour mode (matches reference)
      { id: "sw_dimmer", name: "Dimmer Switch", forceColor: "#dc2626", svg: (
        <g>
          <circle cx="14" cy="28" r="3" fill="currentColor"/>
          <line x1="14" y1="28" x2="32" y2="14" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round"/>
        </g>
      )},
      { id: "sw_pull", name: "Pull Switch", svg: (
        <g>
          <circle cx="24" cy="10" r="2.6" fill="currentColor"/>
          <line x1="24" y1="10" x2="24" y2="38" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round"/>
          <polyline points="20,34 24,40 28,34" fill="none" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round"/>
        </g>
      )},
      { id: "sw_pir", name: "PIR Sensor", svg: (
        <g>
          <path d="M 12 14 L 32 22 L 12 30 Z" fill="none" stroke="currentColor" strokeWidth={STROKE} strokeLinejoin="round"/>
        </g>
      )},
      { id: "sw_keycard", name: "Keycard", svg: (
        <g>
          <rect x="12" y="10" width="24" height="14" fill="none" stroke="currentColor" strokeWidth={STROKE} strokeLinejoin="round"/>
          <line x1="18" y1="17" x2="30" y2="17" stroke="currentColor" strokeWidth={FEEDER} strokeLinecap="round"/>
        </g>
      )},
    ],
  },

  lighting: {
    label: "Lighting",
    items: [
      { id: "lt_pendant", name: "Pendant", svg: (
        <g>
          <circle cx="24" cy="24" r="8" fill="none" stroke="currentColor" strokeWidth={STROKE}/>
          <line x1="24" y1="6" x2="24" y2="42" stroke="currentColor" strokeWidth={FEEDER} strokeLinecap="round"/>
          <line x1="6" y1="24" x2="42" y2="24" stroke="currentColor" strokeWidth={FEEDER} strokeLinecap="round"/>
        </g>
      )},
      { id: "lt_downlight", name: "Downlighter", svg: (
        <g>
          <circle cx="24" cy="24" r="8" fill="none" stroke="currentColor" strokeWidth={STROKE}/>
          <circle cx="24" cy="24" r="2.5" fill="currentColor"/>
          <line x1="24" y1="6" x2="24" y2="42" stroke="currentColor" strokeWidth={FEEDER} strokeLinecap="round"/>
          <line x1="6" y1="24" x2="42" y2="24" stroke="currentColor" strokeWidth={FEEDER} strokeLinecap="round"/>
        </g>
      )},
      { id: "lt_ceiling", name: "Ceiling Fitting", svg: (
        <g>
          <rect x="14" y="14" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={STROKE}/>
          <circle cx="24" cy="24" r="2.5" fill="currentColor"/>
          <line x1="24" y1="6" x2="24" y2="42" stroke="currentColor" strokeWidth={FEEDER} strokeLinecap="round"/>
          <line x1="6" y1="24" x2="42" y2="24" stroke="currentColor" strokeWidth={FEEDER} strokeLinecap="round"/>
        </g>
      )},
      { id: "lt_wall", name: "Wall Light", svg: (
        <g>
          <line x1="4" y1="42" x2="44" y2="42" stroke="var(--feeder)" strokeWidth={FEEDER} strokeLinecap="round"/>
          <circle cx="24" cy="24" r="8" fill="none" stroke="currentColor" strokeWidth={STROKE}/>
          <line x1="24" y1="6" x2="24" y2="42" stroke="currentColor" strokeWidth={FEEDER} strokeLinecap="round"/>
          <line x1="10" y1="24" x2="38" y2="24" stroke="currentColor" strokeWidth={FEEDER} strokeLinecap="round"/>
        </g>
      )},
      { id: "lt_strip", name: "LED Strip", svg: (
        <g>
          <rect x="6" y="20" width="36" height="8" rx="2" fill="none" stroke="currentColor" strokeWidth={STROKE}/>
          {[12, 18, 24, 30, 36].map(cx => <circle key={cx} cx={cx} cy="24" r="1.2" fill="currentColor"/>)}
        </g>
      )},
      { id: "lt_emergency", name: "Emergency", svg: (
        <g>
          <circle cx="24" cy="24" r="11" fill="none" stroke="currentColor" strokeWidth={STROKE}/>
          <text x="24" y="28" fontSize="11" textAnchor="middle" fill="currentColor"
                fontFamily="ui-sans-serif, system-ui, sans-serif" fontWeight="700">E</text>
        </g>
      )},
      { id: "lt_external", name: "External Light", svg: (
        <g>
          <circle cx="24" cy="24" r="8" fill="none" stroke="currentColor" strokeWidth={STROKE}/>
          <circle cx="24" cy="24" r="2.5" fill="currentColor"/>
          <line x1="24" y1="6" x2="24" y2="42" stroke="currentColor" strokeWidth={FEEDER} strokeLinecap="round"/>
          <line x1="6" y1="24" x2="42" y2="24" stroke="currentColor" strokeWidth={FEEDER} strokeLinecap="round"/>
          <text x="40" y="44" fontSize="6" textAnchor="middle" fill="currentColor"
                fontFamily="ui-sans-serif, system-ui, sans-serif" fontWeight="600">EXT</text>
        </g>
      )},
    ],
  },

  detectors: {
    label: "Detectors",
    items: [
      { id: "det_smoke", name: "Smoke Detector", svg: (
        <g>
          <line x1="24" y1="6" x2="24" y2="42" stroke="currentColor" strokeWidth={FEEDER} strokeLinecap="round"/>
          <circle cx="24" cy="24" r="9" fill="none" stroke="currentColor" strokeWidth={STROKE}/>
          <text x="36" y="20" fontSize="7" textAnchor="start" fill="currentColor"
                fontFamily="ui-sans-serif, system-ui, sans-serif" fontWeight="600">S</text>
        </g>
      )},
      { id: "det_heat", name: "Heat Detector", svg: (
        <g>
          <line x1="24" y1="6" x2="24" y2="42" stroke="currentColor" strokeWidth={FEEDER} strokeLinecap="round"/>
          <circle cx="24" cy="24" r="9" fill="none" stroke="currentColor" strokeWidth={STROKE}/>
          <text x="36" y="20" fontSize="7" textAnchor="start" fill="currentColor"
                fontFamily="ui-sans-serif, system-ui, sans-serif" fontWeight="600">H</text>
        </g>
      )},
      { id: "det_co", name: "CO Detector", svg: (
        <g>
          <line x1="24" y1="6" x2="24" y2="42" stroke="currentColor" strokeWidth={FEEDER} strokeLinecap="round"/>
          <circle cx="24" cy="24" r="9" fill="none" stroke="currentColor" strokeWidth={STROKE}/>
          <text x="36" y="20" fontSize="6.5" textAnchor="start" fill="currentColor"
                fontFamily="ui-sans-serif, system-ui, sans-serif" fontWeight="600">CO</text>
        </g>
      )},
      { id: "det_combined", name: "S/H/C Combined", svg: (
        <g>
          <line x1="24" y1="6" x2="24" y2="42" stroke="currentColor" strokeWidth={FEEDER} strokeLinecap="round"/>
          <circle cx="24" cy="24" r="9" fill="none" stroke="currentColor" strokeWidth={STROKE}/>
          <text x="36" y="22" fontSize="6.5" textAnchor="start" fill="currentColor"
                fontFamily="ui-sans-serif, system-ui, sans-serif" fontWeight="600">S/H/C</text>
        </g>
      )},
      { id: "det_thermostat", name: "Thermostat", svg: (
        <g>
          <Wall/>
          <rect x="14" y="10" width="20" height="14" fill="none" stroke="currentColor" strokeWidth={STROKE} strokeLinejoin="round"/>
          <text x="24" y="21" fontSize="9.5" textAnchor="middle" fill="currentColor"
                fontFamily="ui-sans-serif, system-ui, sans-serif" fontWeight="700">T</text>
        </g>
      )},
      { id: "det_alarm", name: "Alarm Sounder", svg: (
        <g>
          {/* Bell body — filled */}
          <path d="M 14 10 Q 14 6 24 6 Q 34 6 34 10 L 34 26 L 14 26 Z"
                fill="currentColor" stroke="currentColor" strokeWidth={STROKE} strokeLinejoin="round"/>
          {/* Clapper */}
          <circle cx="24" cy="32" r="2.6" fill="currentColor"/>
          {/* Sound waves */}
          <path d="M 38 12 Q 42 16 38 20" fill="none" stroke="currentColor" strokeWidth={FEEDER} strokeLinecap="round"/>
          <path d="M 10 12 Q 6 16 10 20" fill="none" stroke="currentColor" strokeWidth={FEEDER} strokeLinecap="round"/>
        </g>
      )},
      { id: "det_alarm_panel", name: "Alarm Panel", svg: (
        <g>
          <Wall/>
          <rect x="10" y="6" width="28" height="18" fill="none" stroke="currentColor" strokeWidth={STROKE} strokeLinejoin="round"/>
          <circle cx="16" cy="11" r="1.4" fill="currentColor"/>
          <circle cx="22" cy="11" r="1.4" fill="currentColor"/>
          <line x1="14" y1="17" x2="34" y2="17" stroke="currentColor" strokeWidth={FEEDER} strokeLinecap="round"/>
          <line x1="14" y1="20" x2="28" y2="20" stroke="currentColor" strokeWidth={FEEDER} strokeLinecap="round"/>
        </g>
      )},
      { id: "det_pir_intruder", name: "Intruder PIR", svg: (
        <g>
          {/* Wedge of detection */}
          <path d="M 12 14 L 36 24 L 12 34 Z" fill="currentColor"/>
          <text x="22" y="26" fontSize="7" textAnchor="middle" fill="white"
                fontFamily="ui-sans-serif, system-ui, sans-serif" fontWeight="700">IR</text>
        </g>
      )},
    ],
  },

  fixtures: {
    label: "Fixtures",
    items: [
      { id: "fx_extractor", name: "Extractor", svg: (
        <g>
          <circle cx="24" cy="24" r="10" fill="currentColor"/>
          <line x1="17" y1="17" x2="31" y2="31" stroke="white" strokeWidth={STROKE}/>
          <line x1="31" y1="17" x2="17" y2="31" stroke="white" strokeWidth={STROKE}/>
        </g>
      )},
      { id: "fx_ext_tap", name: "Ext. Tap", svg: (
        <g>
          <path d="M 6 14 L 24 24 L 6 34 Z" fill="currentColor"/>
          <path d="M 42 14 L 24 24 L 42 34 Z" fill="currentColor"/>
        </g>
      )},
      { id: "fx_doorbell", name: "Door Bell", svg: (
        <g>
          <path d="M 14 14 Q 14 8 24 8 Q 34 8 34 14 L 34 28 L 14 28 Z"
                fill="none" stroke="currentColor" strokeWidth={STROKE} strokeLinejoin="round"/>
          <circle cx="24" cy="34" r="2.5" fill="currentColor"/>
        </g>
      )},
      { id: "fx_camera", name: "CCTV", svg: (
        <g>
          {/* Mounting plate */}
          <line x1="8" y1="14" x2="40" y2="14" stroke="currentColor" strokeWidth={FEEDER} strokeLinecap="round"/>
          {/* Dome (half circle pointing down) */}
          <path d="M 10 14 A 14 14 0 0 0 38 14 Z" fill="currentColor"/>
          {/* Lens — inset, white ring */}
          <circle cx="24" cy="22" r="5" fill="white"/>
          <circle cx="24" cy="22" r="2.6" fill="currentColor"/>
          {/* Tiny highlight on lens for "glass" feel */}
          <circle cx="22.5" cy="20.5" r="0.9" fill="white"/>
        </g>
      )},
      { id: "fx_motor", name: "Motor", svg: (
        <g>
          <circle cx="24" cy="24" r="11" fill="none" stroke="currentColor" strokeWidth={STROKE}/>
          <text x="24" y="28" fontSize="11" textAnchor="middle" fill="currentColor"
                fontFamily="ui-sans-serif, system-ui, sans-serif" fontWeight="700">M</text>
        </g>
      )},
      { id: "fx_consumer", name: "Consumer Unit", svg: (
        <g>
          {/* Outer enclosure */}
          <rect x="3" y="14" width="42" height="22" rx="1.5" fill="none" stroke="currentColor" strokeWidth={STROKE} strokeLinejoin="round"/>
          {/* DIN rail line */}
          <line x1="3" y1="22" x2="45" y2="22" stroke="currentColor" strokeWidth={FEEDER * 0.7}/>
          {/* Main switch (red toggle, larger) */}
          <rect x="5" y="24" width="6" height="10" fill="currentColor"/>
          {/* Individual MCBs */}
          {[14, 19, 24, 29, 34, 39].map((cx, i) => (
            <rect key={i} x={cx} y="25" width="3" height="8" fill="none" stroke="currentColor" strokeWidth={FEEDER * 0.8}/>
          ))}
          {/* Label */}
          <text x="24" y="11" fontSize="7" textAnchor="middle" fill="currentColor"
                fontFamily="ui-sans-serif, system-ui, sans-serif" fontWeight="700" letterSpacing="0.5">CU</text>
        </g>
      )},
      { id: "fx_isolator", name: "Isolator", svg: (
        <g>
          <Wall/>
          <rect x="14" y="10" width="20" height="14" fill="none" stroke="currentColor" strokeWidth={STROKE} strokeLinejoin="round"/>
          <line x1="18" y1="20" x2="28" y2="14" stroke="currentColor" strokeWidth={FEEDER} strokeLinecap="round"/>
          <circle cx="18" cy="20" r="1.4" fill="currentColor"/>
        </g>
      )},
    ],
  },

  heating: {
    label: "Heating",
    items: [
      // Heating bars use their conventional colours regardless of mode
      { id: "ht_towel", name: "Towel Rail", forceColor: "#dc2626", svg: (
        <g>
          <rect x="2" y="20" width="44" height="8" fill="currentColor"/>
          <rect x="20" y="20" width="8" height="8" fill="white"/>
        </g>
      )},
      { id: "ht_radiator", name: "Radiator", forceColor: "#2563eb", svg: (
        <g>
          <rect x="2" y="20" width="44" height="8" fill="currentColor"/>
          <rect x="20" y="20" width="8" height="8" fill="white"/>
        </g>
      )},
      { id: "ht_uf", name: "Underfloor Heating", svg: (
        <g>
          <rect x="4" y="10" width="40" height="28" fill="none" stroke="currentColor" strokeWidth={FEEDER} strokeDasharray="3 2"/>
          <text x="24" y="28" fontSize="8" textAnchor="middle" fill="currentColor"
                fontFamily="ui-sans-serif, system-ui, sans-serif" fontWeight="600">UFH</text>
        </g>
      )},
    ],
  },
};

const VIEWBOX = "0 0 48 48";

function findSymbol(id) {
  for (const cat of Object.values(SYMBOLS)) {
    const s = cat.items.find(i => i.id === id);
    if (s) return s;
  }
  return null;
}

// Find which category a symbol belongs to (used for colouring placed items)
function findCategory(id) {
  for (const [key, cat] of Object.entries(SYMBOLS)) {
    if (cat.items.find(i => i.id === id)) return key;
  }
  return null;
}

// Resolve the colour to use for a symbol given the current mode
function resolveColours(symbolId, mode) {
  const sym = findSymbol(symbolId);
  if (!sym) return { body: "#0a0a0a", feeder: "#737373" };

  // Symbols with forceColor (dimmer, towel rail, radiator) keep their colour
  // even in mono mode — these *are* their colour by convention.
  if (sym.forceColor) return { body: sym.forceColor, feeder: "#737373" };

  if (mode === "mono") return { body: "#0a0a0a", feeder: "#737373" };

  const cat = findCategory(symbolId);
  const palette = CATEGORY_COLOURS[cat] || CATEGORY_COLOURS.fixtures;
  return { body: palette.primary, feeder: palette.soft };
}

const TOOL_ICONS = { select: MousePointer2, wire: Cable };

// ============================================================================
export default function ElectricalPlanTool() {
  const [bgImage, setBgImage] = useState(null);
  const [pdfPages, setPdfPages] = useState([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [placed, setPlaced] = useState([]);
  const [wires, setWires] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [tool, setTool] = useState("select");
  const [wireStart, setWireStart] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [draggingPlacedId, setDraggingPlacedId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [rotatingId, setRotatingId] = useState(null); // id of item being rotated by handle drag
  const [activeCategory, setActiveCategory] = useState("sockets");
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [symbolScale, setSymbolScale] = useState(1.2);
  const [colourMode, setColourMode] = useState("colour"); // "colour" | "mono"

  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const snapshot = useCallback(() => {
    setHistory(h => [...h.slice(-49), { placed, wires }]);
    setFuture([]);
  }, [placed, wires]);

  const undo = () => {
    setHistory(h => {
      if (!h.length) return h;
      const prev = h[h.length - 1];
      setFuture(f => [{ placed, wires }, ...f].slice(0, 50));
      setPlaced(prev.placed);
      setWires(prev.wires);
      return h.slice(0, -1);
    });
  };
  const redo = () => {
    setFuture(f => {
      if (!f.length) return f;
      const next = f[0];
      setHistory(h => [...h, { placed, wires }].slice(-50));
      setPlaced(next.placed);
      setWires(next.wires);
      return f.slice(1);
    });
  };

  const handleFile = async (file) => {
    if (!file) return;
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (isPdf) {
      setPdfLoading(true);
      try {
        // Load pdf.js from CDN on first use. Avoiding the npm bundle here
        // sidesteps Next.js worker-bundling issues and keeps the build simple.
        if (!window.pdfjsLib) {
          await new Promise((res, rej) => {
            const s = document.createElement("script");
            s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
            s.onload = res;
            s.onerror = () => rej(new Error("Failed to load PDF library"));
            document.head.appendChild(s);
          });
          window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        }
        const buf = await file.arrayBuffer();
        const pdf = await window.pdfjsLib.getDocument({ data: buf }).promise;
        const pages = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 2 });
          const c = document.createElement("canvas");
          c.width = viewport.width; c.height = viewport.height;
          const ctx = c.getContext("2d");
          await page.render({ canvasContext: ctx, viewport }).promise;
          pages.push({ src: c.toDataURL("image/png"), w: viewport.width, h: viewport.height });
        }
        setPdfPages(pages);
        setPageIndex(0);
        setBgImage(pages[0]);
      } catch (err) {
        alert("Could not read PDF: " + err.message);
      } finally {
        setPdfLoading(false);
      }
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          setBgImage({ src: e.target.result, w: img.width, h: img.height });
          setPdfPages([]);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
    setZoom(1); setPan({ x: 0, y: 0 });
  };

  const onPaletteDragStart = (e, symbolId) => {
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("text/plain", symbolId);
  };

  const canvasCoords = (clientX, clientY) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom,
    };
  };

  const onCanvasDrop = (e) => {
    e.preventDefault();
    const symbolId = e.dataTransfer.getData("text/plain");
    if (!symbolId || !findSymbol(symbolId)) return;
    const { x, y } = canvasCoords(e.clientX, e.clientY);
    snapshot();
    const newItem = {
      id: "p_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
      symbolId, x, y, rotation: 0, scale: 1, label: "",
    };
    setPlaced(p => [...p, newItem]);
    setSelectedId(newItem.id);
  };

  const onItemMouseDown = (e, item) => {
    e.stopPropagation();
    if (tool === "wire") {
      if (!wireStart) {
        setWireStart(item.id);
      } else if (wireStart !== item.id) {
        snapshot();
        setWires(w => [...w, { id: "w_" + Date.now(), fromId: wireStart, toId: item.id }]);
        setWireStart(null);
      } else {
        setWireStart(null);
      }
      return;
    }
    setSelectedId(item.id);
    const { x, y } = canvasCoords(e.clientX, e.clientY);
    setDragOffset({ x: x - item.x, y: y - item.y });
    setDraggingPlacedId(item.id);
  };

  const onCanvasMouseMove = (e) => {
    if (rotatingId) {
      const item = placed.find(p => p.id === rotatingId);
      if (!item) return;
      const { x, y } = canvasCoords(e.clientX, e.clientY);
      const dx = x - item.x;
      const dy = y - item.y;
      // SVG rotation: 0° points right; we want 0° pointing up (handle above symbol)
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
      const rounded = e.shiftKey ? Math.round(angle / 15) * 15 : Math.round(angle); // shift to snap 15°
      setPlaced(items => items.map(it =>
        it.id === rotatingId ? { ...it, rotation: ((rounded % 360) + 360) % 360 } : it
      ));
      return;
    }
    if (!draggingPlacedId) return;
    const { x, y } = canvasCoords(e.clientX, e.clientY);
    setPlaced(items => items.map(it =>
      it.id === draggingPlacedId
        ? { ...it, x: x - dragOffset.x, y: y - dragOffset.y }
        : it
    ));
  };

  const onCanvasMouseUp = () => {
    setDraggingPlacedId(null);
    setRotatingId(null);
  };

  const onCanvasClick = (e) => {
    if (e.target === canvasRef.current || e.target.tagName === "svg") {
      setSelectedId(null);
      setWireStart(null);
    }
  };

  const rotateSelected = () => {
    if (!selectedId) return;
    snapshot();
    setPlaced(items => items.map(it =>
      it.id === selectedId ? { ...it, rotation: (it.rotation + 15) % 360 } : it
    ));
  };

  const setRotation = (deg) => {
    if (!selectedId) return;
    setPlaced(items => items.map(it =>
      it.id === selectedId ? { ...it, rotation: ((deg % 360) + 360) % 360 } : it
    ));
  };

  const setItemScale = (s) => {
    if (!selectedId) return;
    const clamped = Math.max(0.4, Math.min(3, s));
    setPlaced(items => items.map(it =>
      it.id === selectedId ? { ...it, scale: clamped } : it
    ));
  };

  // Reset every placed symbol back to scale 1.0
  const normaliseSizes = () => {
    if (!placed.length) return;
    snapshot();
    setPlaced(items => items.map(it => ({ ...it, scale: 1 })));
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    snapshot();
    setPlaced(items => items.filter(it => it.id !== selectedId));
    setWires(ws => ws.filter(w => w.fromId !== selectedId && w.toId !== selectedId));
    setSelectedId(null);
  };

  const updateLabel = (val) => {
    setPlaced(items => items.map(it =>
      it.id === selectedId ? { ...it, label: val } : it
    ));
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === "Delete" || e.key === "Backspace") deleteSelected();
      else if (e.key === "r" || e.key === "R") rotateSelected();
      else if (e.key === "Escape") { setSelectedId(null); setWireStart(null); setTool("select"); }
      else if ((e.metaKey || e.ctrlKey) && e.key === "z") { e.preventDefault(); undo(); }
      else if ((e.metaKey || e.ctrlKey) && (e.key === "y" || (e.shiftKey && e.key === "Z"))) { e.preventDefault(); redo(); }
      else if (e.key === "v" || e.key === "V") setTool("select");
      else if (e.key === "w" || e.key === "W") setTool("wire");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const saveProject = async () => {
    const project = { version: 4, bgImage, pdfPages, pageIndex, placed, wires };
    try {
      await storage.set("project:current", JSON.stringify(project));
      alert("Project saved.");
    } catch (err) {
      alert("Save failed: " + err.message);
    }
  };

  const loadProject = async () => {
    try {
      const r = await storage.get("project:current");
      if (!r) { alert("No saved project."); return; }
      const p = JSON.parse(r.value);
      setBgImage(p.bgImage); setPdfPages(p.pdfPages || []);
      setPageIndex(p.pageIndex || 0);
      setPlaced((p.placed || []).map(it => ({ scale: 1, ...it }))); setWires(p.wires || []);
    } catch (err) {
      alert("Load failed.");
    }
  };

  const exportJSON = () => {
    const data = JSON.stringify({ placed, wires }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "electrical-plan.json";
    a.click();
  };

  const selectedItem = placed.find(p => p.id === selectedId);

  const switchPage = (i) => {
    if (!pdfPages[i]) return;
    setPageIndex(i);
    setBgImage(pdfPages[i]);
  };

  const symbolSize = 48 * symbolScale;

  // For palette previews — always show in colour so user can identify
  const paletteColours = CATEGORY_COLOURS[activeCategory] || CATEGORY_COLOURS.fixtures;

  return (
    <div className="w-full h-screen flex flex-col bg-[#f4f1ec] text-stone-900"
         style={{ fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif" }}>
      {/* TOP BAR */}
      <header className="flex items-center justify-between px-5 py-2.5 bg-[#1a1814] text-stone-100 border-b border-stone-700">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-400"/>
            <div className="text-[11px] tracking-[0.35em] font-semibold text-stone-100">PLAN.WORKS</div>
          </div>
          <div className="text-[10px] text-stone-500 hidden md:block tracking-wider uppercase">
            Electrical Layout · UK Architectural
          </div>
        </div>
        <div className="flex items-center gap-1">
          <ToolbarButton onClick={() => fileInputRef.current.click()} icon={Upload} label="Import" primary/>
          <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden"
                 onChange={(e) => handleFile(e.target.files[0])} />
          <Divider />
          <ToolbarButton onClick={undo} icon={Undo2} label="Undo" />
          <ToolbarButton onClick={redo} icon={Redo2} label="Redo" />
          <Divider />
          <ToolbarButton
            onClick={() => setColourMode(m => m === "colour" ? "mono" : "colour")}
            icon={Palette}
            label={colourMode === "colour" ? "Colour" : "Mono"}
            active={colourMode === "colour"}
          />
          <ToolbarButton onClick={normaliseSizes} icon={Ruler} label="Normalise" />
          <Divider />
          <ToolbarButton onClick={saveProject} icon={Save} label="Save" />
          <ToolbarButton onClick={loadProject} icon={FolderOpen} label="Load" />
          <ToolbarButton onClick={exportJSON} icon={Download} label="Export" />
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* PALETTE */}
        <aside className="w-72 bg-[#fbfaf7] border-r border-stone-300/70 flex flex-col">
          <div className="px-4 py-3 border-b border-stone-200 flex items-baseline justify-between">
            <div className="text-[10px] tracking-[0.3em] text-stone-500 uppercase font-medium">Symbols</div>
            <div className="text-[9px] tracking-wider text-stone-400">UK ARCH</div>
          </div>

          {/* Category pills with colour dots */}
          <div className="flex flex-wrap gap-1.5 px-3 py-3 border-b border-stone-200">
            {Object.entries(SYMBOLS).map(([key, cat]) => {
              const c = CATEGORY_COLOURS[key];
              const active = activeCategory === key;
              return (
                <button key={key}
                  onClick={() => setActiveCategory(key)}
                  className={`px-2.5 py-1 text-[10px] tracking-wider rounded-full transition flex items-center gap-1.5 ${
                    active
                      ? "bg-stone-900 text-amber-400"
                      : "bg-white text-stone-600 border border-stone-200 hover:border-stone-400"
                  }`}>
                  <span className="w-2 h-2 rounded-full" style={{ background: c.primary }}/>
                  {cat.label.toLowerCase()}
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-2.5">
            {SYMBOLS[activeCategory].items.map(sym => {
              const cols = resolveColours(sym.id, "colour"); // palette always shows colour
              return (
                <div key={sym.id}
                  draggable
                  onDragStart={(e) => onPaletteDragStart(e, sym.id)}
                  className="group bg-white rounded-lg border border-stone-200 hover:border-amber-500 hover:shadow-md cursor-grab active:cursor-grabbing p-3 flex flex-col items-center gap-2 transition-all">
                  <svg viewBox={VIEWBOX} width="50" height="50"
                       style={{ color: cols.body, "--feeder": cols.feeder }}>
                    {sym.svg}
                  </svg>
                  <div className="text-[9.5px] text-center text-stone-600 leading-tight font-medium">{sym.name}</div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-stone-200 px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="uppercase tracking-wider text-[9px] text-stone-400">Symbol Size</span>
              <span className="tabular-nums text-stone-700 text-[10px]">{Math.round(symbolScale*100)}%</span>
            </div>
            <input type="range" min="0.6" max="2.5" step="0.1" value={symbolScale}
                   onChange={(e) => setSymbolScale(parseFloat(e.target.value))}
                   className="w-full accent-amber-600 mb-3"/>
            <div className="text-[9.5px] text-stone-500 leading-relaxed">
              Drag to plan · <span className="text-stone-700 font-medium">V</span> select · <span className="text-stone-700 font-medium">W</span> wire · <span className="text-stone-700 font-medium">R</span> rotate · <span className="text-stone-700 font-medium">Del</span> remove
            </div>
          </div>
        </aside>

        {/* CANVAS */}
        <main className="flex-1 relative overflow-hidden bg-[#e9e4dc]"
              style={{
                backgroundImage:
                  "radial-gradient(circle, rgba(0,0,0,0.07) 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}>
          <div className="absolute top-4 left-4 z-20 bg-white rounded-lg border border-stone-200 shadow-sm flex flex-col overflow-hidden">
            {Object.entries(TOOL_ICONS).map(([key, Icon]) => (
              <button key={key}
                onClick={() => { setTool(key); setWireStart(null); }}
                title={key}
                className={`p-2.5 transition ${
                  tool === key ? "bg-stone-900 text-amber-400" : "text-stone-600 hover:bg-stone-100"
                }`}>
                <Icon size={16}/>
              </button>
            ))}
          </div>

          <div className="absolute top-4 right-4 z-20 bg-white rounded-lg border border-stone-200 shadow-sm flex overflow-hidden">
            <button onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} className="p-2.5 text-stone-600 hover:bg-stone-100"><ZoomOut size={14}/></button>
            <div className="px-2.5 self-center text-[10px] text-stone-700 tabular-nums border-x border-stone-200 min-w-[50px] text-center">{Math.round(zoom*100)}%</div>
            <button onClick={() => setZoom(z => Math.min(4, z + 0.1))} className="p-2.5 text-stone-600 hover:bg-stone-100"><ZoomIn size={14}/></button>
            <button onClick={() => { setZoom(1); setPan({x:0,y:0}); }} className="p-2.5 text-stone-600 hover:bg-stone-100 border-l border-stone-200"><Maximize2 size={14}/></button>
          </div>

          {/* Legend */}
          <div className="absolute bottom-10 right-4 z-20 bg-white/95 rounded-lg border border-stone-200 shadow-sm px-3 py-2.5 backdrop-blur">
            <div className="text-[8.5px] tracking-[0.2em] uppercase text-stone-400 mb-1.5">Legend</div>
            <div className="space-y-1">
              {Object.entries(CATEGORY_COLOURS).map(([key, c]) => (
                <div key={key} className="flex items-center gap-2 text-[9.5px] text-stone-700">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: c.primary }}/>
                  <span className="capitalize">{SYMBOLS[key].label}</span>
                </div>
              ))}
            </div>
          </div>

          {pdfPages.length > 1 && (
            <div className="absolute bottom-10 left-4 z-20 bg-white rounded-lg border border-stone-200 shadow-sm flex overflow-hidden">
              {pdfPages.map((_, i) => (
                <button key={i}
                  onClick={() => switchPage(i)}
                  className={`px-3 py-1.5 text-[10px] tracking-wider transition ${
                    pageIndex === i ? "bg-stone-900 text-amber-400" : "text-stone-600 hover:bg-stone-100"
                  }`}>
                  P{i+1}
                </button>
              ))}
            </div>
          )}

          {pdfLoading && (
            <div className="absolute inset-0 z-30 bg-stone-900/40 flex items-center justify-center">
              <div className="bg-white px-6 py-3 rounded text-xs tracking-wider">RENDERING PDF...</div>
            </div>
          )}

          {!bgImage && !pdfLoading && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center max-w-sm">
                <div className="text-[10px] tracking-[0.3em] text-stone-500 mb-3 uppercase">Empty Canvas</div>
                <div className="text-sm text-stone-700 mb-1">No drawing loaded</div>
                <div className="text-xs text-stone-500">Click <span className="text-amber-700 font-medium">Import</span> to load a PDF or image of your floor plan</div>
              </div>
            </div>
          )}

          <div
            ref={canvasRef}
            className="absolute inset-0"
            onDragOver={(e) => e.preventDefault()}
            onDrop={onCanvasDrop}
            onMouseMove={onCanvasMouseMove}
            onMouseUp={onCanvasMouseUp}
            onClick={onCanvasClick}
          >
            <div style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "0 0",
              position: "absolute", top: 0, left: 0,
            }}>
              {bgImage && (
                <img src={bgImage.src} alt="plan" style={{ width: bgImage.w, height: bgImage.h, display:"block" }} draggable={false}/>
              )}
              <svg
                width={bgImage?.w || 2400}
                height={bgImage?.h || 1600}
                style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
              >
                {wires.map(w => {
                  const a = placed.find(p => p.id === w.fromId);
                  const b = placed.find(p => p.id === w.toId);
                  if (!a || !b) return null;
                  return (
                    <line key={w.id}
                      x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                      stroke="#b45309" strokeWidth={2/zoom}
                      strokeDasharray={`${6/zoom} ${4/zoom}`}
                      strokeLinecap="round"
                    />
                  );
                })}
                {placed.map(item => {
                  const sym = findSymbol(item.symbolId);
                  if (!sym) return null;
                  const isSel = item.id === selectedId;
                  const isWireStart = item.id === wireStart;
                  const itemScale = item.scale ?? 1;
                  const itemSize = symbolSize * itemScale;
                  const half = itemSize / 2;
                  const cols = resolveColours(item.symbolId, colourMode);
                  // Rotation handle sits above the symbol
                  const handleOffset = half + 18 / zoom;
                  return (
                    <g key={item.id}
                       transform={`translate(${item.x - half} ${item.y - half}) rotate(${item.rotation} ${half} ${half})`}
                    >
                      {(isSel || isWireStart) && (
                        <rect x="-3" y="-3" width={itemSize+6} height={itemSize+6} rx="6"
                              fill={isWireStart ? "rgba(251,191,36,0.25)" : "rgba(254,243,199,0.6)"}
                              stroke={isWireStart ? "#d97706" : "#b45309"} strokeWidth={1.5/zoom} />
                      )}
                      <svg x="0" y="0" width={itemSize} height={itemSize} viewBox={VIEWBOX}
                           style={{
                             color: cols.body,
                             "--feeder": cols.feeder,
                             overflow: "visible",
                             pointerEvents: "all",
                             cursor: tool === "wire" ? "crosshair" : "move",
                           }}
                           onMouseDown={(e) => onItemMouseDown(e, item)}>
                        {sym.svg}
                      </svg>
                      {item.label && (
                        <text x={half} y={itemSize + 10/zoom} fontSize={11/zoom} textAnchor="middle"
                              fill="#1c1917" fontFamily="ui-sans-serif, system-ui, sans-serif" fontWeight="600"
                              transform={`rotate(${-item.rotation} ${half} ${itemSize + 10/zoom})`}>
                          {item.label}
                        </text>
                      )}
                      {/* Rotation handle: line + grip dot above the symbol */}
                      {isSel && tool === "select" && (
                        <g style={{ pointerEvents: "all", cursor: "grab" }}
                           onMouseDown={(e) => {
                             e.stopPropagation();
                             setRotatingId(item.id);
                           }}>
                          <line x1={half} y1={-3} x2={half} y2={-handleOffset+6}
                                stroke="#b45309" strokeWidth={1.2/zoom} strokeDasharray={`${3/zoom} ${2/zoom}`}/>
                          <circle cx={half} cy={-handleOffset} r={5/zoom}
                                  fill="#fbbf24" stroke="#b45309" strokeWidth={1.5/zoom}/>
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 px-4 py-1.5 bg-[#1a1814] text-stone-300 text-[10px] tracking-wider flex justify-between border-t border-stone-700">
            <div className="flex gap-4">
              <span>SYMBOLS <span className="text-amber-400 tabular-nums ml-1">{placed.length}</span></span>
              <span>WIRES <span className="text-amber-400 tabular-nums ml-1">{wires.length}</span></span>
              <span>TOOL <span className="text-amber-400 ml-1">{tool.toUpperCase()}</span></span>
              <span>MODE <span className="text-amber-400 ml-1">{colourMode.toUpperCase()}</span></span>
              {tool === "wire" && wireStart && <span className="text-amber-400">→ click target</span>}
            </div>
            <div className="text-stone-500">
              {bgImage ? `${bgImage.w}×${bgImage.h}px` : "no plan loaded"}
            </div>
          </div>
        </main>

        {/* INSPECTOR */}
        <aside className="w-72 bg-[#fbfaf7] border-l border-stone-300/70 flex flex-col">
          <div className="px-4 py-3 border-b border-stone-200">
            <div className="text-[10px] tracking-[0.3em] text-stone-500 uppercase font-medium">Inspector</div>
          </div>
          {selectedItem ? (
            <div className="p-4 space-y-4">
              <div>
                <div className="text-[9px] tracking-[0.2em] uppercase text-stone-400 mb-1.5">Type</div>
                <div className="flex items-center gap-3">
                  {(() => {
                    const cols = resolveColours(selectedItem.symbolId, "colour");
                    return (
                      <svg viewBox={VIEWBOX} width="40" height="40"
                           style={{ color: cols.body, "--feeder": cols.feeder }}
                           className="bg-white rounded border border-stone-200 p-1">
                        {findSymbol(selectedItem.symbolId)?.svg}
                      </svg>
                    );
                  })()}
                  <div className="text-sm font-medium">{findSymbol(selectedItem.symbolId)?.name}</div>
                </div>
              </div>
              <div>
                <div className="text-[9px] tracking-[0.2em] uppercase text-stone-400 mb-1.5">Reference</div>
                <input
                  type="text"
                  value={selectedItem.label}
                  onChange={(e) => updateLabel(e.target.value)}
                  placeholder="e.g. S1 / K-01"
                  className="w-full px-3 py-1.5 text-xs bg-white rounded border border-stone-200 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-200"
                />
              </div>
              <div className="grid grid-cols-3 gap-2 text-[10px]">
                <Stat label="X" value={Math.round(selectedItem.x)}/>
                <Stat label="Y" value={Math.round(selectedItem.y)}/>
                <Stat label="ROT" value={Math.round(selectedItem.rotation) + "°"}/>
              </div>

              {/* Rotation control */}
              <div className="pt-3 border-t border-stone-200">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] tracking-[0.2em] uppercase text-stone-400">Rotation</span>
                  <span className="tabular-nums text-stone-700 text-[10px]">{Math.round(selectedItem.rotation)}°</span>
                </div>
                <input type="range" min="0" max="359" step="1" value={selectedItem.rotation}
                       onChange={(e) => setRotation(parseInt(e.target.value))}
                       className="w-full accent-amber-600 mb-2"/>
                <div className="grid grid-cols-4 gap-1">
                  {[0, 90, 180, 270].map(deg => (
                    <button key={deg} onClick={() => setRotation(deg)}
                      className={`px-1 py-1 text-[9px] tracking-wider rounded border transition ${
                        Math.round(selectedItem.rotation) === deg
                          ? "bg-stone-900 text-amber-400 border-stone-900"
                          : "bg-white text-stone-600 border-stone-200 hover:border-stone-400"
                      }`}>
                      {deg}°
                    </button>
                  ))}
                </div>
              </div>

              {/* Scale control */}
              <div className="pt-3 border-t border-stone-200">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] tracking-[0.2em] uppercase text-stone-400">Scale</span>
                  <span className="tabular-nums text-stone-700 text-[10px]">{Math.round((selectedItem.scale ?? 1)*100)}%</span>
                </div>
                <input type="range" min="0.4" max="3" step="0.05" value={selectedItem.scale ?? 1}
                       onChange={(e) => setItemScale(parseFloat(e.target.value))}
                       className="w-full accent-amber-600 mb-2"/>
                <button onClick={() => setItemScale(1)}
                  className="w-full px-2 py-1 text-[9px] uppercase tracking-wider bg-white border border-stone-200 hover:border-stone-400 rounded transition">
                  Reset to 100%
                </button>
              </div>

              <div className="flex gap-2 pt-3 border-t border-stone-200">
                <button onClick={rotateSelected}
                        className="flex-1 px-3 py-2 bg-white border border-stone-200 hover:border-stone-400 rounded text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition">
                  <RotateCw size={12}/> +15°
                </button>
                <button onClick={deleteSelected}
                        className="flex-1 px-3 py-2 bg-white border border-stone-200 hover:border-red-400 hover:text-red-700 rounded text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition">
                  <Trash2 size={12}/> Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 text-[11px] text-stone-500 leading-relaxed">
              <div className="mb-3">Select a symbol to inspect.</div>
              <div className="text-stone-400 uppercase tracking-[0.2em] text-[9px] mb-2">Schedule</div>
              <ScheduleList placed={placed} />
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function ToolbarButton({ onClick, icon: Icon, label, primary, active }) {
  return (
    <button onClick={onClick}
      className={`px-3 py-1.5 text-[10px] uppercase tracking-wider flex items-center gap-1.5 rounded transition ${
        primary
          ? "bg-amber-500 text-stone-900 hover:bg-amber-400 font-semibold"
          : active
          ? "bg-stone-800 text-amber-400"
          : "text-stone-300 hover:text-amber-400 hover:bg-stone-800"
      }`}>
      <Icon size={13} /> {label}
    </button>
  );
}

function Divider() { return <div className="w-px h-5 bg-stone-700/60 mx-1" />; }

function Stat({ label, value }) {
  return (
    <div className="bg-white rounded border border-stone-200 px-2 py-1.5">
      <div className="text-stone-400 uppercase tracking-wider text-[8.5px] mb-0.5">{label}</div>
      <div className="tabular-nums text-stone-900 font-medium text-[11px]">{value}</div>
    </div>
  );
}

function ScheduleList({ placed }) {
  const counts = {};
  placed.forEach(p => {
    const sym = findSymbol(p.symbolId);
    if (!sym) return;
    counts[sym.name] = (counts[sym.name] || 0) + 1;
  });
  const entries = Object.entries(counts).sort();
  if (!entries.length) return <div className="text-stone-400 mt-2 text-[10px] italic">No items placed yet.</div>;
  return (
    <table className="w-full text-[10px] tabular-nums">
      <tbody>
        {entries.map(([name, n]) => (
          <tr key={name} className="border-b border-stone-200">
            <td className="py-1.5 text-stone-700">{name}</td>
            <td className="py-1.5 text-right text-stone-900 font-semibold">{n}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
