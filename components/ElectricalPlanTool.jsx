"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Upload, Trash2, Save, FolderOpen, Download, Undo2, Redo2,
  MousePointer2, Cable, RotateCw, ZoomIn, ZoomOut, Maximize2,
  Palette, Ruler, Hand, Sparkles,
} from "lucide-react";
import { storage } from "@/lib/storage";

/* ============================================================================
 * SYMBOL LIBRARY — UK Architectural Plan Style, colour-coded by category.
 * (Library content preserved verbatim from prior version.)
 * ========================================================================= */

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

function findCategory(id) {
  for (const [key, cat] of Object.entries(SYMBOLS)) {
    if (cat.items.find(i => i.id === id)) return key;
  }
  return null;
}

function resolveColours(symbolId, mode) {
  const sym = findSymbol(symbolId);
  if (!sym) return { body: "#e7e5e4", feeder: "#a8a29e" };
  if (sym.forceColor) return { body: sym.forceColor, feeder: "#78716c" };
  if (mode === "mono") return { body: "#0a0a0a", feeder: "#737373" };
  const cat = findCategory(symbolId);
  const palette = CATEGORY_COLOURS[cat] || CATEGORY_COLOURS.fixtures;
  return { body: palette.primary, feeder: palette.soft };
}

const TOOL_ICONS = {
  select: { icon: MousePointer2, label: "Select", hint: "V" },
  pan:    { icon: Hand,          label: "Pan",    hint: "H" },
  wire:   { icon: Cable,         label: "Wire",   hint: "W" },
};

// Zoom limits and speeds
const ZOOM_MIN = 0.15;
const ZOOM_MAX = 8;
const ZOOM_WHEEL_SPEED = 0.0015;

// ============================================================================
export default function ElectricalPlanTool() {
  const [bgImage, setBgImage] = useState(null);
  const [pdfPages, setPdfPages] = useState([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [placed, setPlaced] = useState([]);
  const [wires, setWires] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [tool, setTool] = useState("select"); // select | pan | wire
  const [wireStart, setWireStart] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [draggingPlacedId, setDraggingPlacedId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [rotatingId, setRotatingId] = useState(null);
  const [activeCategory, setActiveCategory] = useState("sockets");
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [symbolScale, setSymbolScale] = useState(1.2);
  const [colourMode, setColourMode] = useState("colour");
  const [isPanning, setIsPanning] = useState(false);
  const [spacePressed, setSpacePressed] = useState(false);
  const [draggingFile, setDraggingFile] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

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

  // ---------- File handling ----------
  const handleFile = async (file) => {
    if (!file) return;
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (isPdf) {
      setPdfLoading(true);
      try {
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
        fitToScreen(pages[0]);
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
          const newBg = { src: e.target.result, w: img.width, h: img.height };
          setBgImage(newBg);
          setPdfPages([]);
          fitToScreen(newBg);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  // ---------- Zoom & pan ----------
  const fitToScreen = (img) => {
    if (!img || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const padding = 80;
    const availW = rect.width - padding;
    const availH = rect.height - padding;
    const scale = Math.min(availW / img.w, availH / img.h, 1);
    const newPan = {
      x: (rect.width - img.w * scale) / 2,
      y: (rect.height - img.h * scale) / 2,
    };
    setZoom(scale);
    setPan(newPan);
  };

  const zoomAt = useCallback((clientX, clientY, factor) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const cx = clientX - rect.left;
    const cy = clientY - rect.top;
    setZoom(prevZoom => {
      const newZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, prevZoom * factor));
      if (newZoom === prevZoom) return prevZoom;
      const realFactor = newZoom / prevZoom;
      setPan(prevPan => ({
        x: cx - (cx - prevPan.x) * realFactor,
        y: cy - (cy - prevPan.y) * realFactor,
      }));
      return newZoom;
    });
  }, []);

  // Mouse-wheel zoom — captures the wheel before the browser sees it
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      // Trackpad pinch comes through as ctrlKey + wheel; treat the same
      const factor = Math.exp(-e.deltaY * ZOOM_WHEEL_SPEED);
      zoomAt(e.clientX, e.clientY, factor);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  const canvasCoords = (clientX, clientY) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom,
    };
  };

  // ---------- Drag from palette ----------
  const onPaletteDragStart = (e, symbolId) => {
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("text/plain", symbolId);
    e.dataTransfer.setData("application/x-planworks-symbol", symbolId);
  };

  const onCanvasDrop = (e) => {
    e.preventDefault();
    setDraggingFile(false);

    // File dropped from OS?
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
      return;
    }

    // Internal symbol drop
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

  const onCanvasDragOver = (e) => {
    e.preventDefault();
    // Only show file-drop overlay if it's an external file
    if (e.dataTransfer.types.includes("Files") && !bgImage) {
      setDraggingFile(true);
    }
  };
  const onCanvasDragLeave = (e) => {
    if (e.currentTarget === e.target) setDraggingFile(false);
  };

  // ---------- Symbol interactions ----------
  const onItemMouseDown = (e, item) => {
    if (tool === "pan" || spacePressed) return;
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

  // ---------- Canvas mouse handling (pan + drag) ----------
  const onCanvasMouseDown = (e) => {
    // Middle-click, space-held, or pan tool → start panning
    const wantPan = e.button === 1 || spacePressed || tool === "pan";
    if (wantPan) {
      e.preventDefault();
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
      return;
    }
    // Click on empty canvas → deselect
    if (e.target === canvasRef.current || e.target.tagName === "svg" || e.target.tagName === "IMG") {
      setSelectedId(null);
      setWireStart(null);
    }
  };

  const onCanvasMouseMove = (e) => {
    if (isPanning) {
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      setPan({ x: panStart.current.panX + dx, y: panStart.current.panY + dy });
      return;
    }
    if (rotatingId) {
      const item = placed.find(p => p.id === rotatingId);
      if (!item) return;
      const { x, y } = canvasCoords(e.clientX, e.clientY);
      const dx = x - item.x;
      const dy = y - item.y;
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
      const rounded = e.shiftKey ? Math.round(angle / 15) * 15 : Math.round(angle);
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
    setIsPanning(false);
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

  // ---------- Keyboard ----------
  useEffect(() => {
    const onKey = (e) => {
      const isInput = e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA";
      if (e.code === "Space" && !isInput) {
        e.preventDefault();
        setSpacePressed(true);
      }
      if (isInput) return;
      if (e.key === "Delete" || e.key === "Backspace") deleteSelected();
      else if (e.key === "r" || e.key === "R") rotateSelected();
      else if (e.key === "Escape") { setSelectedId(null); setWireStart(null); setTool("select"); }
      else if ((e.metaKey || e.ctrlKey) && e.key === "z") { e.preventDefault(); undo(); }
      else if ((e.metaKey || e.ctrlKey) && (e.key === "y" || (e.shiftKey && e.key === "Z"))) { e.preventDefault(); redo(); }
      else if (e.key === "v" || e.key === "V") setTool("select");
      else if (e.key === "w" || e.key === "W") setTool("wire");
      else if (e.key === "h" || e.key === "H") setTool("pan");
      else if (e.key === "+" || e.key === "=") {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) zoomAt(rect.left + rect.width/2, rect.top + rect.height/2, 1.2);
      }
      else if (e.key === "-" || e.key === "_") {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) zoomAt(rect.left + rect.width/2, rect.top + rect.height/2, 1/1.2);
      }
      else if (e.key === "0") {
        if (bgImage) fitToScreen(bgImage);
        else { setZoom(1); setPan({ x: 0, y: 0 }); }
      }
    };
    const onKeyUp = (e) => {
      if (e.code === "Space") setSpacePressed(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
    };
  });

  // ---------- Save / Load ----------
  const saveProject = async () => {
    const project = { version: 5, bgImage, pdfPages, pageIndex, placed, wires };
    try {
      await storage.set("project:current", JSON.stringify(project));
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
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
      setPlaced((p.placed || []).map(it => ({ scale: 1, ...it })));
      setWires(p.wires || []);
      if (p.bgImage) setTimeout(() => fitToScreen(p.bgImage), 50);
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

  // Cursor
  const canvasCursor =
    isPanning ? "grabbing" :
    (tool === "pan" || spacePressed) ? "grab" :
    tool === "wire" ? "crosshair" :
    "default";

  return (
    <div className="w-full h-screen flex flex-col bg-[#0b0d10] text-stone-100 overflow-hidden select-none"
         style={{ fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Inter', sans-serif" }}>

      {/* Subtle ambient gradient backdrop */}
      <div className="absolute inset-0 pointer-events-none opacity-60"
           style={{
             background: "radial-gradient(1200px 600px at 20% 0%, rgba(217,119,6,0.06), transparent 60%), radial-gradient(900px 500px at 90% 100%, rgba(29,78,216,0.05), transparent 60%)",
           }}/>

      {/* ==================== TOP BAR ==================== */}
      <header className="relative z-30 flex items-center justify-between px-5 h-12 bg-[#0f1216]/90 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-2 h-2 rounded-full bg-amber-400"/>
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-amber-400 animate-ping opacity-40"/>
            </div>
            <div className="text-[11px] tracking-[0.35em] font-semibold">PLAN.WORKS</div>
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
          <ToolbarButton onClick={undo} icon={Undo2} label="Undo" hint="⌘Z" />
          <ToolbarButton onClick={redo} icon={Redo2} label="Redo" hint="⌘⇧Z" />
          <Divider />
          <ToolbarButton
            onClick={() => setColourMode(m => m === "colour" ? "mono" : "colour")}
            icon={Palette}
            label={colourMode === "colour" ? "Colour" : "Mono"}
            active={colourMode === "colour"}
          />
          <ToolbarButton onClick={normaliseSizes} icon={Ruler} label="Normalise" />
          <Divider />
          <ToolbarButton onClick={saveProject} icon={Save} label={savedFlash ? "Saved ✓" : "Save"} flash={savedFlash} />
          <ToolbarButton onClick={loadProject} icon={FolderOpen} label="Load" />
          <ToolbarButton onClick={exportJSON} icon={Download} label="Export" />
        </div>
      </header>

      <div className="relative z-10 flex-1 flex overflow-hidden">

        {/* ==================== LEFT PALETTE ==================== */}
        <aside className="w-72 bg-[#0f1216]/80 backdrop-blur-xl border-r border-white/[0.06] flex flex-col">
          <div className="px-4 h-11 flex items-center justify-between border-b border-white/[0.06]">
            <div className="text-[10px] tracking-[0.3em] text-stone-400 uppercase font-medium">Symbols</div>
            <div className="text-[9px] tracking-wider text-stone-600">UK ARCH</div>
          </div>

          <div className="flex flex-wrap gap-1.5 px-3 py-3 border-b border-white/[0.04]">
            {Object.entries(SYMBOLS).map(([key, cat]) => {
              const c = CATEGORY_COLOURS[key];
              const active = activeCategory === key;
              return (
                <button key={key}
                  onClick={() => setActiveCategory(key)}
                  className={`px-2.5 py-1 text-[10px] tracking-wider rounded-full transition-all duration-200 flex items-center gap-1.5 ${
                    active
                      ? "bg-white/[0.08] text-amber-400 ring-1 ring-amber-400/30"
                      : "bg-white/[0.02] text-stone-400 ring-1 ring-white/[0.04] hover:bg-white/[0.05] hover:text-stone-200"
                  }`}>
                  <span className="w-1.5 h-1.5 rounded-full transition-transform duration-200 group-hover:scale-110" style={{ background: c.primary, boxShadow: `0 0 8px ${c.primary}66` }}/>
                  {cat.label.toLowerCase()}
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-2.5
                          [&::-webkit-scrollbar]:w-1.5
                          [&::-webkit-scrollbar-track]:bg-transparent
                          [&::-webkit-scrollbar-thumb]:bg-white/10
                          [&::-webkit-scrollbar-thumb]:rounded-full">
            {SYMBOLS[activeCategory].items.map(sym => {
              const cols = resolveColours(sym.id, "colour");
              return (
                <div key={sym.id}
                  draggable
                  onDragStart={(e) => onPaletteDragStart(e, sym.id)}
                  className="group relative bg-white/[0.03] hover:bg-white/[0.06] rounded-xl ring-1 ring-white/[0.06] hover:ring-amber-400/30
                             cursor-grab active:cursor-grabbing p-3 flex flex-col items-center gap-2
                             transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.6)]">
                  <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                       style={{ background: `radial-gradient(80% 80% at 50% 50%, ${cols.body}18, transparent)` }}/>
                  <svg viewBox={VIEWBOX} width="50" height="50"
                       style={{ color: cols.body, "--feeder": cols.feeder, filter: `drop-shadow(0 0 6px ${cols.body}40)` }}
                       className="relative z-10 transition-transform duration-200 group-hover:scale-110">
                    {sym.svg}
                  </svg>
                  <div className="relative z-10 text-[9.5px] text-center text-stone-300 leading-tight font-medium">{sym.name}</div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-white/[0.06] px-4 py-3 bg-black/20">
            <div className="flex items-center justify-between mb-2">
              <span className="uppercase tracking-wider text-[9px] text-stone-500">Symbol Size</span>
              <span className="tabular-nums text-stone-300 text-[10px]">{Math.round(symbolScale*100)}%</span>
            </div>
            <input type="range" min="0.6" max="2.5" step="0.1" value={symbolScale}
                   onChange={(e) => setSymbolScale(parseFloat(e.target.value))}
                   className="w-full accent-amber-500 mb-3"/>
            <div className="text-[9.5px] text-stone-500 leading-relaxed">
              <Kbd>V</Kbd> select · <Kbd>H</Kbd> pan · <Kbd>W</Kbd> wire · <Kbd>R</Kbd> rotate · <Kbd>Del</Kbd> remove
            </div>
            <div className="text-[9.5px] text-stone-500 leading-relaxed mt-1.5">
              <Kbd>⎵</Kbd> hold to pan · <Kbd>⌘Z</Kbd> undo · <Kbd>0</Kbd> fit · scroll to zoom
            </div>
          </div>
        </aside>

        {/* ==================== CANVAS ==================== */}
        <main className="flex-1 relative overflow-hidden bg-[#1a1d22]">

          {/* Dot grid backdrop */}
          <div className="absolute inset-0 opacity-50"
               style={{
                 backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
                 backgroundSize: "24px 24px",
                 backgroundPosition: `${pan.x % 24}px ${pan.y % 24}px`,
               }}/>

          {/* Vignette */}
          <div className="absolute inset-0 pointer-events-none"
               style={{ background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)" }}/>

          {/* Tool toolbar (left side, floating) */}
          <div className="absolute top-4 left-4 z-20 flex flex-col bg-[#0f1216]/90 backdrop-blur-xl rounded-xl ring-1 ring-white/[0.06] shadow-2xl shadow-black/50 overflow-hidden">
            {Object.entries(TOOL_ICONS).map(([key, info]) => {
              const Icon = info.icon;
              const active = tool === key;
              return (
                <button key={key}
                  onClick={() => { setTool(key); setWireStart(null); }}
                  title={`${info.label} (${info.hint})`}
                  className={`relative p-2.5 transition-colors duration-150 ${
                    active ? "text-amber-400" : "text-stone-400 hover:text-stone-100 hover:bg-white/[0.04]"
                  }`}>
                  {active && <div className="absolute inset-0 bg-amber-400/[0.08]"/>}
                  {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-amber-400 rounded-r-full"/>}
                  <Icon size={16} className="relative"/>
                </button>
              );
            })}
          </div>

          {/* Zoom toolbar (right side, floating) */}
          <div className="absolute top-4 right-4 z-20 flex bg-[#0f1216]/90 backdrop-blur-xl rounded-xl ring-1 ring-white/[0.06] shadow-2xl shadow-black/50 overflow-hidden">
            <button onClick={() => {
              const r = canvasRef.current.getBoundingClientRect();
              zoomAt(r.left + r.width/2, r.top + r.height/2, 1/1.2);
            }} className="p-2.5 text-stone-400 hover:text-stone-100 hover:bg-white/[0.04] transition-colors">
              <ZoomOut size={14}/>
            </button>
            <div className="px-3 self-center text-[10px] text-stone-300 tabular-nums border-x border-white/[0.06] min-w-[56px] text-center">
              {Math.round(zoom*100)}%
            </div>
            <button onClick={() => {
              const r = canvasRef.current.getBoundingClientRect();
              zoomAt(r.left + r.width/2, r.top + r.height/2, 1.2);
            }} className="p-2.5 text-stone-400 hover:text-stone-100 hover:bg-white/[0.04] transition-colors">
              <ZoomIn size={14}/>
            </button>
            <button onClick={() => bgImage ? fitToScreen(bgImage) : (setZoom(1), setPan({x:0,y:0}))}
                    title="Fit (0)"
                    className="p-2.5 text-stone-400 hover:text-stone-100 hover:bg-white/[0.04] transition-colors border-l border-white/[0.06]">
              <Maximize2 size={14}/>
            </button>
          </div>

          {/* Page tabs */}
          {pdfPages.length > 1 && (
            <div className="absolute bottom-12 left-4 z-20 flex bg-[#0f1216]/90 backdrop-blur-xl rounded-xl ring-1 ring-white/[0.06] shadow-2xl shadow-black/50 overflow-hidden">
              {pdfPages.map((_, i) => (
                <button key={i}
                  onClick={() => switchPage(i)}
                  className={`px-3 py-1.5 text-[10px] tracking-wider transition-colors ${
                    pageIndex === i ? "bg-amber-400/[0.1] text-amber-400" : "text-stone-400 hover:text-stone-100 hover:bg-white/[0.04]"
                  }`}>
                  P{i+1}
                </button>
              ))}
            </div>
          )}

          {/* Legend */}
          <div className="absolute bottom-12 right-4 z-20 bg-[#0f1216]/90 backdrop-blur-xl rounded-xl ring-1 ring-white/[0.06] shadow-2xl shadow-black/50 px-3 py-2.5">
            <div className="text-[8.5px] tracking-[0.2em] uppercase text-stone-500 mb-1.5">Legend</div>
            <div className="space-y-1">
              {Object.entries(CATEGORY_COLOURS).map(([key, c]) => (
                <div key={key} className="flex items-center gap-2 text-[9.5px] text-stone-300">
                  <span className="w-2 h-2 rounded-full" style={{ background: c.primary, boxShadow: `0 0 6px ${c.primary}80` }}/>
                  <span className="capitalize">{SYMBOLS[key].label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* PDF loading overlay */}
          {pdfLoading && (
            <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm flex items-center justify-center">
              <div className="bg-[#0f1216] px-8 py-5 rounded-xl ring-1 ring-white/[0.08] flex items-center gap-3">
                <Sparkles size={16} className="text-amber-400 animate-pulse"/>
                <span className="text-xs tracking-[0.2em] uppercase text-stone-200">Rendering PDF</span>
              </div>
            </div>
          )}

          {/* External-file drop overlay */}
          {draggingFile && (
            <div className="absolute inset-4 z-30 rounded-2xl border-2 border-dashed border-amber-400/60 bg-amber-400/[0.04] flex items-center justify-center pointer-events-none">
              <div className="text-amber-400 text-sm tracking-[0.2em] uppercase">Drop to import</div>
            </div>
          )}

          {/* Empty state */}
          {!bgImage && !pdfLoading && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center max-w-sm px-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.06] mb-4">
                  <Upload size={20} className="text-stone-400"/>
                </div>
                <div className="text-[10px] tracking-[0.3em] text-stone-500 mb-2 uppercase">Empty Canvas</div>
                <div className="text-base text-stone-100 mb-1.5 font-medium">No drawing loaded</div>
                <div className="text-xs text-stone-400 leading-relaxed">
                  Click <span className="text-amber-400 font-medium">Import</span> or drop a PDF/image directly onto the canvas
                </div>
              </div>
            </div>
          )}

          {/* THE CANVAS */}
          <div
            ref={canvasRef}
            className="absolute inset-0"
            style={{ cursor: canvasCursor, touchAction: "none" }}
            onDrop={onCanvasDrop}
            onDragOver={onCanvasDragOver}
            onDragLeave={onCanvasDragLeave}
            onMouseDown={onCanvasMouseDown}
            onMouseMove={onCanvasMouseMove}
            onMouseUp={onCanvasMouseUp}
          >
            <div style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "0 0",
              position: "absolute", top: 0, left: 0,
              willChange: "transform",
            }}>
              {bgImage && (
                <div className="relative" style={{ width: bgImage.w, height: bgImage.h }}>
                  {/* Soft drop shadow for the plan itself, gives depth */}
                  <div className="absolute inset-0 pointer-events-none"
                       style={{ boxShadow: "0 30px 80px -10px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)" }}/>
                  <img src={bgImage.src} alt="plan"
                       style={{ width: bgImage.w, height: bgImage.h, display: "block", background: "white" }}
                       draggable={false}/>
                </div>
              )}
              <svg
                width={bgImage?.w || 2400}
                height={bgImage?.h || 1600}
                style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none", overflow: "visible" }}
              >
                {wires.map(w => {
                  const a = placed.find(p => p.id === w.fromId);
                  const b = placed.find(p => p.id === w.toId);
                  if (!a || !b) return null;
                  return (
                    <line key={w.id}
                      x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                      stroke="#fbbf24" strokeWidth={2/zoom}
                      strokeDasharray={`${6/zoom} ${4/zoom}`}
                      strokeLinecap="round"
                      style={{ filter: "drop-shadow(0 0 4px rgba(251,191,36,0.5))" }}
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
                  const handleOffset = half + 18 / zoom;
                  return (
                    <g key={item.id}
                       transform={`translate(${item.x - half} ${item.y - half}) rotate(${item.rotation} ${half} ${half})`}>
                      {(isSel || isWireStart) && (
                        <>
                          {/* Soft glow */}
                          <rect x={-6} y={-6} width={itemSize+12} height={itemSize+12} rx={10}
                                fill={isWireStart ? "rgba(251,191,36,0.18)" : "rgba(251,191,36,0.10)"}/>
                          {/* Selection ring */}
                          <rect x={-3} y={-3} width={itemSize+6} height={itemSize+6} rx={8}
                                fill="none"
                                stroke={isWireStart ? "#fbbf24" : "#fbbf24"}
                                strokeWidth={1.5/zoom}
                                strokeDasharray={isWireStart ? `${4/zoom} ${3/zoom}` : "none"}/>
                        </>
                      )}
                      <svg x={0} y={0} width={itemSize} height={itemSize} viewBox={VIEWBOX}
                           style={{
                             color: cols.body,
                             "--feeder": cols.feeder,
                             overflow: "visible",
                             pointerEvents: "all",
                             cursor: tool === "wire" ? "crosshair" : (tool === "pan" || spacePressed) ? "grab" : "move",
                             filter: colourMode === "colour" ? `drop-shadow(0 1px 2px rgba(0,0,0,0.3))` : "none",
                             transition: "filter 200ms",
                           }}
                           onMouseDown={(e) => onItemMouseDown(e, item)}>
                        {sym.svg}
                      </svg>
                      {item.label && (
                        <text x={half} y={itemSize + 10/zoom} fontSize={11/zoom} textAnchor="middle"
                              fill={colourMode === "mono" ? "#1c1917" : "#fbbf24"}
                              fontFamily="ui-sans-serif, system-ui, sans-serif" fontWeight="600"
                              transform={`rotate(${-item.rotation} ${half} ${itemSize + 10/zoom})`}>
                          {item.label}
                        </text>
                      )}
                      {isSel && tool === "select" && !spacePressed && (
                        <g style={{ pointerEvents: "all", cursor: "grab" }}
                           onMouseDown={(e) => { e.stopPropagation(); setRotatingId(item.id); }}>
                          <line x1={half} y1={-3} x2={half} y2={-handleOffset+6}
                                stroke="#fbbf24" strokeWidth={1.2/zoom} strokeDasharray={`${3/zoom} ${2/zoom}`}/>
                          <circle cx={half} cy={-handleOffset} r={5/zoom}
                                  fill="#fbbf24" stroke="#fff7ed" strokeWidth={1.5/zoom}
                                  style={{ filter: `drop-shadow(0 0 6px rgba(251,191,36,0.6))` }}/>
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Status bar */}
          <div className="absolute bottom-0 left-0 right-0 px-4 h-8 bg-[#0f1216]/90 backdrop-blur-xl text-stone-400 text-[10px] tracking-wider flex justify-between items-center border-t border-white/[0.06]">
            <div className="flex gap-5">
              <span>SYMBOLS <span className="text-amber-400 tabular-nums ml-1">{placed.length}</span></span>
              <span>WIRES <span className="text-amber-400 tabular-nums ml-1">{wires.length}</span></span>
              <span>TOOL <span className="text-amber-400 ml-1">{tool.toUpperCase()}</span></span>
              <span>MODE <span className="text-amber-400 ml-1">{colourMode.toUpperCase()}</span></span>
              {tool === "wire" && wireStart && <span className="text-amber-400 animate-pulse">→ click target</span>}
              {spacePressed && <span className="text-amber-400">PAN</span>}
            </div>
            <div className="text-stone-600">
              {bgImage ? `${bgImage.w}×${bgImage.h}px` : "no plan loaded"}
            </div>
          </div>
        </main>

        {/* ==================== RIGHT INSPECTOR ==================== */}
        <aside className="w-72 bg-[#0f1216]/80 backdrop-blur-xl border-l border-white/[0.06] flex flex-col">
          <div className="px-4 h-11 flex items-center border-b border-white/[0.06]">
            <div className="text-[10px] tracking-[0.3em] text-stone-400 uppercase font-medium">Inspector</div>
          </div>

          {selectedItem ? (
            <div className="flex-1 overflow-y-auto p-4 space-y-4
                            [&::-webkit-scrollbar]:w-1.5
                            [&::-webkit-scrollbar-track]:bg-transparent
                            [&::-webkit-scrollbar-thumb]:bg-white/10
                            [&::-webkit-scrollbar-thumb]:rounded-full">
              <div>
                <div className="text-[9px] tracking-[0.2em] uppercase text-stone-500 mb-2">Type</div>
                <div className="flex items-center gap-3">
                  {(() => {
                    const cols = resolveColours(selectedItem.symbolId, "colour");
                    return (
                      <svg viewBox={VIEWBOX} width="44" height="44"
                           style={{ color: cols.body, "--feeder": cols.feeder, filter: `drop-shadow(0 0 8px ${cols.body}50)` }}
                           className="bg-white/[0.03] rounded-lg ring-1 ring-white/[0.06] p-1.5">
                        {findSymbol(selectedItem.symbolId)?.svg}
                      </svg>
                    );
                  })()}
                  <div className="text-sm font-medium text-stone-100">{findSymbol(selectedItem.symbolId)?.name}</div>
                </div>
              </div>

              <div>
                <div className="text-[9px] tracking-[0.2em] uppercase text-stone-500 mb-2">Reference</div>
                <input
                  type="text"
                  value={selectedItem.label}
                  onChange={(e) => updateLabel(e.target.value)}
                  placeholder="e.g. S1 / K-01"
                  className="w-full px-3 py-2 text-xs bg-white/[0.03] rounded-lg ring-1 ring-white/[0.06] focus:ring-amber-400/40 focus:bg-white/[0.05] focus:outline-none transition-all text-stone-100 placeholder:text-stone-600"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Stat label="X" value={Math.round(selectedItem.x)}/>
                <Stat label="Y" value={Math.round(selectedItem.y)}/>
                <Stat label="ROT" value={Math.round(selectedItem.rotation) + "°"}/>
              </div>

              <div className="pt-3 border-t border-white/[0.06]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] tracking-[0.2em] uppercase text-stone-500">Rotation</span>
                  <span className="tabular-nums text-stone-200 text-[10px]">{Math.round(selectedItem.rotation)}°</span>
                </div>
                <input type="range" min="0" max="359" step="1" value={selectedItem.rotation}
                       onChange={(e) => setRotation(parseInt(e.target.value))}
                       className="w-full accent-amber-500 mb-2"/>
                <div className="grid grid-cols-4 gap-1">
                  {[0, 90, 180, 270].map(deg => (
                    <button key={deg} onClick={() => setRotation(deg)}
                      className={`px-1 py-1 text-[9px] tracking-wider rounded-md transition-all duration-150 ${
                        Math.round(selectedItem.rotation) === deg
                          ? "bg-amber-400/[0.15] text-amber-400 ring-1 ring-amber-400/30"
                          : "bg-white/[0.03] text-stone-400 ring-1 ring-white/[0.06] hover:bg-white/[0.06] hover:text-stone-200"
                      }`}>
                      {deg}°
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-white/[0.06]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] tracking-[0.2em] uppercase text-stone-500">Scale</span>
                  <span className="tabular-nums text-stone-200 text-[10px]">{Math.round((selectedItem.scale ?? 1)*100)}%</span>
                </div>
                <input type="range" min="0.4" max="3" step="0.05" value={selectedItem.scale ?? 1}
                       onChange={(e) => setItemScale(parseFloat(e.target.value))}
                       className="w-full accent-amber-500 mb-2"/>
                <button onClick={() => setItemScale(1)}
                  className="w-full px-2 py-1.5 text-[9px] uppercase tracking-wider bg-white/[0.03] text-stone-400 ring-1 ring-white/[0.06] hover:bg-white/[0.06] hover:text-stone-200 rounded-md transition-all">
                  Reset to 100%
                </button>
              </div>

              <div className="flex gap-2 pt-3 border-t border-white/[0.06]">
                <button onClick={rotateSelected}
                        className="flex-1 px-3 py-2 bg-white/[0.03] ring-1 ring-white/[0.06] hover:bg-white/[0.06] hover:ring-amber-400/30 text-stone-200 rounded-md text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all">
                  <RotateCw size={12}/> +15°
                </button>
                <button onClick={deleteSelected}
                        className="flex-1 px-3 py-2 bg-white/[0.03] ring-1 ring-white/[0.06] hover:bg-red-500/[0.1] hover:ring-red-400/30 hover:text-red-300 text-stone-200 rounded-md text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all">
                  <Trash2 size={12}/> Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 text-[11px] text-stone-500 leading-relaxed
                            [&::-webkit-scrollbar]:w-1.5
                            [&::-webkit-scrollbar-track]:bg-transparent
                            [&::-webkit-scrollbar-thumb]:bg-white/10
                            [&::-webkit-scrollbar-thumb]:rounded-full">
              <div className="mb-4 text-stone-400">Select a symbol to inspect.</div>
              <div className="text-stone-500 uppercase tracking-[0.2em] text-[9px] mb-2">Schedule</div>
              <ScheduleList placed={placed} />
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

// ==================== Subcomponents ====================

function ToolbarButton({ onClick, icon: Icon, label, primary, active, hint, flash }) {
  return (
    <button onClick={onClick}
      title={hint ? `${label} (${hint})` : label}
      className={`group relative px-3 py-1.5 text-[10px] uppercase tracking-wider flex items-center gap-1.5 rounded-md transition-all duration-150 ${
        primary
          ? "bg-amber-400 text-stone-900 hover:bg-amber-300 font-semibold shadow-[0_0_20px_-4px_rgba(251,191,36,0.5)]"
          : flash
          ? "bg-emerald-400/[0.15] text-emerald-400 ring-1 ring-emerald-400/30"
          : active
          ? "bg-white/[0.06] text-amber-400 ring-1 ring-amber-400/20"
          : "text-stone-300 hover:text-stone-100 hover:bg-white/[0.04]"
      }`}>
      <Icon size={13} /> <span>{label}</span>
    </button>
  );
}

function Divider() { return <div className="w-px h-5 bg-white/[0.06] mx-1" />; }

function Kbd({ children }) {
  return (
    <span className="inline-flex items-center justify-center min-w-[16px] px-1 py-px rounded bg-white/[0.06] ring-1 ring-white/[0.04] text-[8.5px] text-stone-300 font-medium tracking-normal mx-0.5">
      {children}
    </span>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-white/[0.03] rounded-lg ring-1 ring-white/[0.06] px-2.5 py-2">
      <div className="text-stone-500 uppercase tracking-wider text-[8.5px] mb-0.5">{label}</div>
      <div className="tabular-nums text-stone-100 font-medium text-[11px]">{value}</div>
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
  if (!entries.length) return <div className="text-stone-600 mt-2 text-[10px] italic">No items placed yet.</div>;
  return (
    <table className="w-full text-[10px] tabular-nums">
      <tbody>
        {entries.map(([name, n]) => (
          <tr key={name} className="border-b border-white/[0.04]">
            <td className="py-1.5 text-stone-300">{name}</td>
            <td className="py-1.5 text-right text-amber-400 font-semibold">{n}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
