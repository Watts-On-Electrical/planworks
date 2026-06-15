// ============================================================================
// FURNITURE LIBRARY — the "Floor Plan" layer.
//
// This is deliberately SEPARATE from the electrical symbol library
// (lib/symbols.jsx). Furniture is NOT an electrical item: it never appears in
// the BOQ, the legend, or the schedule, and is never billed. It lives in its
// own per-sheet `furniture` array and is rendered beneath the electrical
// symbols as a base the user can draw when no plan has been imported.
//
// Same navy line-art style as the symbols (viewBox 0 0 32 32, stroke=
// currentColor). The colour is fixed navy — furniture ignores the electrical
// colour modes.
// ============================================================================

export const FURNITURE_VIEWBOX = "0 0 32 32";
export const FURNITURE_COLOUR = "#2C3E50";

// Each furniture piece is drawn as a <g> of line-art, exactly like a symbol.
const g = (children) => (
  <g fill="none" stroke="currentColor" strokeWidth={1.55} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </g>
);

export const FURNITURE = [
  { id: "single_bed", name: "Single bed", scale: 4, svg: g(<>
    <rect x="10" y="4" width="12" height="24" rx="1.5" />
    <path d="M10 11h12" />
    <rect x="12" y="5.5" width="8" height="4" rx="1" />
  </>) },
  { id: "double_bed", name: "Double bed", scale: 5, svg: g(<>
    <rect x="6" y="4" width="20" height="24" rx="1.5" />
    <path d="M6 11h20" />
    <rect x="8" y="5.5" width="7.5" height="4" rx="1" />
    <rect x="16.5" y="5.5" width="7.5" height="4" rx="1" />
  </>) },
  { id: "wardrobe", name: "Wardrobe", scale: 4, svg: g(<>
    <rect x="7" y="7" width="18" height="18" rx="1.5" />
    <path d="M16 7v18" />
    <circle cx="14" cy="16" r="0.8" fill="currentColor" stroke="none" />
    <circle cx="18" cy="16" r="0.8" fill="currentColor" stroke="none" />
  </>) },
  { id: "bath", name: "Bath", scale: 4.5, svg: g(<>
    <rect x="3" y="10" width="26" height="12" rx="3" />
    <rect x="6" y="12.5" width="17" height="7" rx="3" />
    <circle cx="25.5" cy="16" r="1" fill="currentColor" stroke="none" />
  </>) },
  { id: "shower", name: "Shower", scale: 4, svg: g(<>
    <rect x="6" y="6" width="20" height="20" rx="2" />
    <path d="M6 6l20 20" />
    <circle cx="9.5" cy="9.5" r="1.3" fill="currentColor" stroke="none" />
  </>) },
  { id: "wc", name: "WC / toilet", scale: 3, svg: g(<>
    <rect x="11" y="4" width="10" height="5" rx="1" />
    <path d="M12 9h8" />
    <ellipse cx="16" cy="18.5" rx="5.5" ry="7" />
  </>) },
  { id: "basin", name: "Wash basin", scale: 3, svg: g(<>
    <path d="M7 11h18M7 11a9 7 0 0 0 18 0z" />
    <circle cx="16" cy="8.2" r="1.2" fill="currentColor" stroke="none" />
    <path d="M16 9.4V11" />
  </>) },
  { id: "kitchen_sink", name: "Kitchen sink", scale: 4, svg: g(<>
    <rect x="4" y="11" width="24" height="10" rx="1.5" />
    <rect x="7" y="13" width="7" height="6" rx="1" />
    <rect x="15" y="13" width="6" height="6" rx="1" />
    <circle cx="24.5" cy="16" r="1" fill="currentColor" stroke="none" />
  </>) },
  { id: "base_unit", name: "Base unit / worktop", scale: 4, svg: g(<>
    <rect x="4" y="11" width="24" height="10" rx="1" />
    <path d="M4 14.5h24" />
  </>) },
  { id: "hob", name: "Hob", scale: 3.5, svg: g(<>
    <rect x="7" y="7" width="18" height="18" rx="2" />
    <circle cx="12" cy="12" r="2.6" />
    <circle cx="20" cy="12" r="2.6" />
    <circle cx="12" cy="20" r="2.6" />
    <circle cx="20" cy="20" r="2.6" />
  </>) },
  { id: "fridge", name: "Fridge / freezer", scale: 3.5, svg: g(<>
    <rect x="9" y="5" width="14" height="22" rx="2" />
    <path d="M9 13h14" />
    <path d="M20 9v2M20 16v3" />
  </>) },
  { id: "washer", name: "Washing machine", scale: 3.5, svg: g(<>
    <rect x="7" y="6" width="18" height="20" rx="2" />
    <circle cx="16" cy="17.5" r="5.5" />
    <circle cx="16" cy="17.5" r="2.5" />
    <path d="M10 9.5h.01M13 9.5h.01" />
  </>) },
  { id: "sofa", name: "Sofa", scale: 4.5, svg: g(<>
    <rect x="5" y="12" width="22" height="12" rx="2" />
    <path d="M5 16h22" />
    <path d="M12 16v8M20 16v8" />
  </>) },
  { id: "dining", name: "Dining table", scale: 5, svg: g(<>
    <rect x="10" y="10" width="12" height="12" rx="1" />
    <rect x="12" y="4" width="3.4" height="3" rx="0.6" />
    <rect x="16.6" y="4" width="3.4" height="3" rx="0.6" />
    <rect x="12" y="25" width="3.4" height="3" rx="0.6" />
    <rect x="16.6" y="25" width="3.4" height="3" rx="0.6" />
    <rect x="4" y="12" width="3" height="3.4" rx="0.6" />
    <rect x="4" y="16.6" width="3" height="3.4" rx="0.6" />
    <rect x="25" y="12" width="3" height="3.4" rx="0.6" />
    <rect x="25" y="16.6" width="3" height="3.4" rx="0.6" />
  </>) },
  { id: "stairs", name: "Stairs", scale: 4.5, svg: g(<>
    <rect x="9" y="4" width="14" height="24" />
    <path d="M9 8h14M9 12h14M9 16h14M9 20h14M9 24h14" />
    <path d="M16 25V7" />
    <path d="M13.5 10l2.5-3 2.5 3" />
  </>) },
  // ---- Openings (doors & windows) ----
  { id: "door", name: "Door", group: "Openings", scale: 3.5, svg: g(<>
    <path d="M8 26V8" />
    <path d="M8 8a18 18 0 0 1 18 18" />
    <circle cx="8" cy="26" r="1.3" fill="currentColor" stroke="none" />
  </>) },
  { id: "door_double", name: "Double door", group: "Openings", scale: 4.5, svg: g(<>
    <path d="M16 26 4 26V14" />
    <path d="M4 14a12 12 0 0 1 12 12" />
    <path d="M16 26 28 26V14" />
    <path d="M28 14a12 12 0 0 0-12 12" />
  </>) },
  { id: "window", name: "Window", group: "Openings", scale: 3.5, svg: g(<>
    <path d="M4 13h24M4 19h24" />
    <path d="M4 13v6M28 13v6" />
    <path d="M4 16h24" />
  </>) },
];

const FURNITURE_BY_ID = Object.fromEntries(FURNITURE.map(f => [f.id, f]));

export function findFurniture(id) {
  return FURNITURE_BY_ID[id] || null;
}

// Default placement scale for a furniture id (furniture is larger than a
// fitting). Falls back to 4× the base symbol size.
export function furnitureScale(id) {
  return FURNITURE_BY_ID[id]?.scale ?? 4;
}
