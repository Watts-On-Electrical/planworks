/* ============================================================================
 * SYMBOL LIBRARY — UK Architectural Plan Style
 * ----------------------------------------------------------------------------
 * Two layers:
 *   1. SYMBOLS — visual definitions (categories, SVG drawings)
 *   2. SYMBOL_META — specification metadata for each symbol used in the
 *      printable legend (description, mounting height, AFL flag)
 *
 * Mounting heights follow industry conventions (e.g. Approved Document M,
 * BS 7671 guidance, typical UK domestic specs). They can be overridden
 * per-project in the app.
 * ========================================================================= */

"use client";

import React from "react";

const STROKE = 2.0;
const FEEDER = 1.4;

// Category palette — desaturated, plan-appropriate hues.
export const CATEGORY_COLOURS = {
  sockets:   { primary: "#1d4ed8", soft: "#93c5fd", label: "Blue"   },
  switches:  { primary: "#15803d", soft: "#86efac", label: "Green"  },
  lighting:  { primary: "#b45309", soft: "#fcd34d", label: "Amber"  },
  detectors: { primary: "#b91c1c", soft: "#fca5a5", label: "Red"    },
  fixtures:  { primary: "#6d28d9", soft: "#c4b5fd", label: "Violet" },
  heating:   { primary: "#0f172a", soft: "#94a3b8", label: "Slate"  },
  annotation:{ primary: "#dc2626", soft: "#fca5a5", label: "Red"    },
};

const Wall = ({ y = 28, x1 = 4, x2 = 44 }) => (
  <line x1={x1} y1={y} x2={x2} y2={y} stroke="var(--feeder)" strokeWidth={FEEDER} strokeLinecap="round"/>
);

export const SYMBOLS = {
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
          <path d="M 4 28 A 10 10 0 0 1 24 28 Z" fill="currentColor"/>
          <path d="M 24 28 A 10 10 0 0 1 44 28 Z" fill="currentColor"/>
          <line x1="14" y1="20" x2="14" y2="12" stroke="var(--feeder)" strokeWidth={FEEDER} strokeLinecap="round"/>
          <line x1="34" y1="20" x2="34" y2="12" stroke="var(--feeder)" strokeWidth={FEEDER} strokeLinecap="round"/>
        </g>
      )},
      { id: "sock_usbc", name: "USB-C Socket", svg: (
        <g>
          <path d="M 6 28 A 10 10 0 0 1 26 28 Z" fill="currentColor"/>
          <line x1="16" y1="20" x2="16" y2="12" stroke="var(--feeder)" strokeWidth={FEEDER} strokeLinecap="round"/>
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
          <path d="M 14 10 Q 14 6 24 6 Q 34 6 34 10 L 34 26 L 14 26 Z"
                fill="currentColor" stroke="currentColor" strokeWidth={STROKE} strokeLinejoin="round"/>
          <circle cx="24" cy="32" r="2.6" fill="currentColor"/>
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
          <line x1="8" y1="14" x2="40" y2="14" stroke="currentColor" strokeWidth={FEEDER} strokeLinecap="round"/>
          <path d="M 10 14 A 14 14 0 0 0 38 14 Z" fill="currentColor"/>
          <circle cx="24" cy="22" r="5" fill="white"/>
          <circle cx="24" cy="22" r="2.6" fill="currentColor"/>
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
          <rect x="3" y="14" width="42" height="22" rx="1.5" fill="none" stroke="currentColor" strokeWidth={STROKE} strokeLinejoin="round"/>
          <line x1="3" y1="22" x2="45" y2="22" stroke="currentColor" strokeWidth={FEEDER * 0.7}/>
          <rect x="5" y="24" width="6" height="10" fill="currentColor"/>
          {[14, 19, 24, 29, 34, 39].map((cx, i) => (
            <rect key={i} x={cx} y="25" width="3" height="8" fill="none" stroke="currentColor" strokeWidth={FEEDER * 0.8}/>
          ))}
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

export const VIEWBOX = "0 0 48 48";

/* ----------------------------------------------------------------------------
 * SYMBOL_META — legend-ready descriptions and mounting heights
 *
 * Each entry: { description, height (string e.g. "450mm AFL" or null) }
 * - description = exactly the line that appears in the legend
 * - height      = mounting reference; null if not applicable (e.g. ceiling)
 * AFL = "Above Finished Floor Level"
 * ------------------------------------------------------------------------- */
export const SYMBOL_META = {
  // Sockets
  sock_sso_2a:   { description: "2A Socket Outlet",                       height: "450mm AFL" },
  sock_sso:      { description: "Single Socket Low Level",                height: "450mm AFL" },
  sock_dso:      { description: "Double Socket Low Level",                height: "450mm AFL" },
  sock_usbc:     { description: "Double Socket with USB-C",               height: "450mm AFL" },
  sock_cat5:     { description: "Data Outlet (Cat5e/Cat6)",               height: "450mm AFL" },
  sock_cooker:   { description: "Cooker Outlet",                          height: "1100mm AFL" },
  sock_shaver:   { description: "Shaver Socket",                          height: "1200mm AFL" },
  sock_tv:       { description: "TV Outlet",                              height: "450mm AFL" },
  sock_fcu:      { description: "Fused Spur (switched)",                  height: "Above worktop / per location" },

  // Switches
  sw_light:        { description: "Single Light Switch",                   height: "1200mm AFL" },
  sw_2way:         { description: "2-Way Light Switch",                    height: "1200mm AFL" },
  sw_intermediate: { description: "Intermediate Light Switch",             height: "1200mm AFL" },
  sw_dimmer:       { description: "Dimmer Switch",                         height: "1200mm AFL" },
  sw_pull:         { description: "Pull Cord Switch",                      height: "Ceiling (cord to 1000mm AFL)" },
  sw_pir:          { description: "PIR Lighting Sensor",                   height: "Ceiling" },
  sw_keycard:      { description: "Keycard Switch",                        height: "1200mm AFL" },

  // Lighting
  lt_pendant:    { description: "Pendant Light",                           height: "Ceiling" },
  lt_downlight:  { description: "Downlighter (LED)",                       height: "Ceiling" },
  lt_ceiling:    { description: "Ceiling Light Fitting",                   height: "Ceiling" },
  lt_wall:       { description: "Wall Light",                              height: "1800mm AFL" },
  lt_strip:      { description: "LED Strip Lighting",                      height: "Per location" },
  lt_emergency:  { description: "Emergency Lighting",                      height: "Ceiling" },
  lt_external:   { description: "External Light",                          height: "1800mm AFL" },

  // Detectors
  det_smoke:        { description: "Smoke Detector (Grade D2, Cat LD3)",    height: "Ceiling" },
  det_heat:         { description: "Heat Detector",                         height: "Ceiling" },
  det_co:           { description: "Carbon Monoxide Detector",              height: "Per manufacturer" },
  det_combined:     { description: "Smoke / Heat / CO Combined",            height: "Ceiling" },
  det_thermostat:   { description: "Room Thermostat",                       height: "1500mm AFL" },
  det_alarm:        { description: "Alarm Sounder",                         height: "Ceiling / above doorway" },
  det_alarm_panel:  { description: "Intruder Alarm Control Panel",          height: "1500mm AFL" },
  det_pir_intruder: { description: "Intruder Alarm PIR",                    height: "2100mm AFL" },

  // Fixtures
  fx_extractor:  { description: "Extract Fan",                              height: "Ceiling / high wall" },
  fx_ext_tap:    { description: "External Tap (electrically isolated)",     height: "Per location" },
  fx_doorbell:   { description: "Door Bell Push",                           height: "1200mm AFL" },
  fx_camera:     { description: "CCTV Camera (dome)",                       height: "2400mm AFL" },
  fx_motor:      { description: "Motor / Plant Connection",                 height: "Per location" },
  fx_consumer:   { description: "Consumer Unit",                            height: "1350–1450mm AFL" },
  fx_isolator:   { description: "Isolator Switch",                          height: "1500mm AFL" },

  // Heating
  ht_towel:      { description: "Heated Towel Rail (electric)",             height: "Per location" },
  ht_radiator:   { description: "Radiator",                                 height: "Per location" },
  ht_uf:         { description: "Underfloor Heating Zone",                  height: "Floor" },
};

/* ============================================================================
 * Helpers
 * ========================================================================= */

export function findSymbol(id) {
  for (const cat of Object.values(SYMBOLS)) {
    const s = cat.items.find(i => i.id === id);
    if (s) return s;
  }
  return null;
}

export function findCategory(id) {
  for (const [key, cat] of Object.entries(SYMBOLS)) {
    if (cat.items.find(i => i.id === id)) return key;
  }
  return null;
}

export function resolveColours(symbolId, mode) {
  const sym = findSymbol(symbolId);
  if (!sym) return { body: "#e7e5e4", feeder: "#a8a29e" };
  if (sym.forceColor) return { body: sym.forceColor, feeder: "#78716c" };
  if (mode === "mono") return { body: "#0a0a0a", feeder: "#737373" };
  const cat = findCategory(symbolId);
  const palette = CATEGORY_COLOURS[cat] || CATEGORY_COLOURS.fixtures;
  return { body: palette.primary, feeder: palette.soft };
}
