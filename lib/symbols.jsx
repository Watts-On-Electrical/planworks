/* ============================================================================
 * SYMBOL LIBRARY — UK Architectural Plan Style
 * Aligned with industry-standard residential MEP legends
 * (Preston Baker / Yorkshire Homes style reference).
 *
 * Two layers:
 *   1. SYMBOLS — visual definitions, grouped by category
 *   2. SYMBOL_META — legend descriptions + mounting heights (AFL)
 * ========================================================================= */

"use client";

import React from "react";

const STROKE = 1.5;
const FEEDER = 1.0;

export const CATEGORY_COLOURS = {
  sockets:   { primary: "#1d4ed8", soft: "#93c5fd", label: "Blue"   },
  switches:  { primary: "#15803d", soft: "#86efac", label: "Green"  },
  lighting:  { primary: "#b45309", soft: "#fcd34d", label: "Amber"  },
  detectors: { primary: "#b91c1c", soft: "#fca5a5", label: "Red"    },
  security:  { primary: "#7c2d12", soft: "#fdba74", label: "Burnt"  },
  fixtures:  { primary: "#6d28d9", soft: "#c4b5fd", label: "Violet" },
  data:      { primary: "#0e7490", soft: "#67e8f9", label: "Cyan"   },
  heating:   { primary: "#0f172a", soft: "#94a3b8", label: "Slate"  },
};

// Small "H" mark used to differentiate high-level variants visually
const HighLevelMark = ({ x = 38, y = 10 }) => (
  <g>
    <circle cx={x} cy={y} r={4} fill="#ffffff" stroke="currentColor" strokeWidth={1}/>
    <text x={x} y={y + 2.7} fontSize="6" textAnchor="middle"
          fontFamily="ui-sans-serif, system-ui, sans-serif" fontWeight="700"
          fill="currentColor">H</text>
  </g>
);

export const SYMBOLS = {
  sockets: {
    label: "Sockets",
    items: [
      { id: "sock_sso_ll", name: "Single Socket (LL)", svg: (
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 23a6 6 0 0 1 12 0Z" fill="currentColor" fillOpacity="0.32" stroke="none"/>
          <path d="M6 23H26"/><path d="M10 23a6 6 0 0 1 12 0"/><path d="M16 23V12"/>
        </g>
      )},
      { id: "sock_dso_ll", name: "Double Socket (LL)", svg: (
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 23a7 7 0 0 1 14 0Z" fill="currentColor" fillOpacity="0.32" stroke="none"/>
          <path d="M5 23H27"/><path d="M9 23a7 7 0 0 1 14 0"/><path d="M13 23V13M19 23V13"/>
        </g>
      )},
      { id: "sock_dso_usb_ll", name: "Double Socket USB-C (LL)", svg: (
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 23a7 7 0 0 1 14 0Z" fill="currentColor" fillOpacity="0.32" stroke="none"/>
          <path d="M5 23H27"/><path d="M9 23a7 7 0 0 1 14 0"/><path d="M13 23V13"/><path d="M19 23v-9"/><path d="M19 14l-1.8 1.8M19 14l1.8 1.8"/>
        </g>
      )},
      { id: "sock_sso_hl", name: "Single Socket (HL)", svg: (
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 23a6 6 0 0 1 12 0Z" fill="currentColor" fillOpacity="0.32" stroke="none"/>
          <path d="M6 23H26"/><path d="M10 23a6 6 0 0 1 12 0"/><path d="M16 23V12"/>
        </g>
      )},
      { id: "sock_dso_hl", name: "Double Socket (HL)", svg: (
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 23a7 7 0 0 1 14 0Z" fill="currentColor" fillOpacity="0.32" stroke="none"/>
          <path d="M5 23H27"/><path d="M9 23a7 7 0 0 1 14 0"/><path d="M13 23V13M19 23V13"/>
        </g>
      )},
      { id: "sock_dso_usb_hl", name: "Double Socket USB-C (HL)", svg: (
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 23a7 7 0 0 1 14 0Z" fill="currentColor" fillOpacity="0.32" stroke="none"/>
          <path d="M5 23H27"/><path d="M9 23a7 7 0 0 1 14 0"/><path d="M13 23V13"/><path d="M19 23v-9"/><path d="M19 14l-1.8 1.8M19 14l1.8 1.8"/>
        </g>
      )},
      { id: "sock_2a", name: "2A Socket", svg: (
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 21a4 4 0 0 1 8 0Z" fill="currentColor" fillOpacity="0.32" stroke="none"/>
          <path d="M9 21H23"/><path d="M12 21a4 4 0 0 1 8 0"/><path d="M16 21V14"/>
        </g>
      )},
      { id: "sock_cooker", name: "Cooker Outlet", svg: (
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 24a7 7 0 0 1 14 0Z" fill="currentColor" fillOpacity="0.32" stroke="none"/>
          <path d="M5 24H27"/><path d="M9 24a7 7 0 0 1 14 0"/><path d="M16 24V12"/><path d="M11 9h10"/>
        </g>
      )},
      { id: "sock_shaver", name: "Shaver Socket", svg: (
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="16" cy="16" r="8" fill="currentColor" fillOpacity="0.32" stroke="none"/>
          <circle cx="16" cy="16" r="8"/><path d="M12.5 12.5v7M19.5 12.5v7"/>
        </g>
      )},
      { id: "sock_tv", name: "TV Point", svg: (
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="11" width="14" height="9.5" rx="1.6" fill="currentColor" fillOpacity="0.32"/><text x="16" y="18.4" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="6.4" fontWeight="600" fill="currentColor" stroke="none">TV</text><path d="M16 20.5v3"/>
        </g>
      )},
      { id: "sock_fcu", name: "Switched Fused Spur", svg: (
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <rect x="10" y="13" width="12" height="6" rx="1.6" fill="currentColor" fillOpacity="0.32" stroke="none"/>
          <rect x="10" y="13" width="12" height="6" rx="1.6"/><path d="M16 13V7M16 19v6"/><path d="M19 11l3-3"/>
        </g>
      )},
      { id: "spur_unsw", name: "Unswitched Fused Spur", svg: (
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <rect x="10" y="13" width="12" height="6" rx="1.6" fill="currentColor" fillOpacity="0.32" stroke="none"/>
          <rect x="10" y="13" width="12" height="6" rx="1.6"/><path d="M16 13V7M16 19v6"/>
        </g>
      )},
    ],
  },

  switches: {
    label: "Switches",
    items: [
      { id: "sw_light", name: "Light Switch", svg: (
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="21" r="2.2" fill="currentColor" stroke="none"/><path d="M11 21L21.5 10.5"/>
        </g>
      )},
      { id: "sw_2g", name: "2 Gang Switch", svg: (
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="10" cy="22" r="2" fill="currentColor" stroke="none"/><path d="M10 22L19 13"/>
          <text x="22" y="13" fontFamily="'JetBrains Mono', monospace" fontSize="8" fontWeight="600" fill="currentColor" stroke="none">2</text>
        </g>
      )},
      { id: "sw_3g", name: "3 Gang Switch", svg: (
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="10" cy="22" r="2" fill="currentColor" stroke="none"/><path d="M10 22L19 13"/>
          <text x="22" y="13" fontFamily="'JetBrains Mono', monospace" fontSize="8" fontWeight="600" fill="currentColor" stroke="none">3</text>
        </g>
      )},
      { id: "sw_4g", name: "4 Gang Switch", svg: (
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="10" cy="22" r="2" fill="currentColor" stroke="none"/><path d="M10 22L19 13"/>
          <text x="22" y="13" fontFamily="'JetBrains Mono', monospace" fontSize="8" fontWeight="600" fill="currentColor" stroke="none">4</text>
        </g>
      )},
      { id: "sw_grid", name: "Grid Switch", svg: (
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="14" height="14" rx="2" fill="currentColor" fillOpacity="0.32" stroke="none"/>
          <rect x="9" y="9" width="14" height="14" rx="2"/><path d="M16 9v14M9 16h14"/>
        </g>
      )},
      { id: "sw_2way", name: "2-Way Switch", svg: (
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="10" cy="22" r="2.2" fill="currentColor" stroke="none"/><path d="M10 22L20 12"/><path d="M10 22L20 16"/>
        </g>
      )},
      { id: "sw_intermediate", name: "Intermediate", svg: (
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="10" cy="22" r="2.2" fill="currentColor" stroke="none"/><path d="M10 22L20 12"/><path d="M14 22l6-6"/>
        </g>
      )},
      { id: "sw_dimmer", name: "Dimmer Switch", svg: (
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="21" r="2.2" fill="currentColor" stroke="none"/><path d="M11 21L21.5 10.5"/><path d="M22 19a4 4 0 0 0-4-4l4 4z" fill="currentColor" stroke="none"/>
        </g>
      )},
      { id: "sw_pull", name: "Pull Switch", svg: (
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="16" cy="11" r="5" fill="currentColor" fillOpacity="0.32" stroke="none"/>
          <circle cx="16" cy="11" r="5"/><path d="M16 16v9"/><circle cx="16" cy="25.5" r="1.5" fill="currentColor" stroke="none"/>
        </g>
      )},
      { id: "sw_pir_light", name: "PIR Light Sensor", svg: (
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <rect x="10" y="9" width="12" height="9" rx="2.4" fill="currentColor" fillOpacity="0.32" stroke="none"/>
          <rect x="10" y="9" width="12" height="9" rx="2.4"/><circle cx="16" cy="13.5" r="2.2"/><path d="M13 18l-1.3 4.5M19 18l1.3 4.5"/>
        </g>
      )},
      { id: "sw_keycard", name: "Keycard Switch", svg: (
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="8" width="14" height="16" rx="2" fill="currentColor" fillOpacity="0.32" stroke="none"/>
          <rect x="9" y="8" width="14" height="16" rx="2"/><path d="M12 12h8"/><rect x="12" y="16" width="5.5" height="4" rx="1"/>
        </g>
      )},
    ],
  },

  lighting: {
    label: "Lighting",
    items: [
      { id: "lt_pendant", name: "Pendant Light", svg: (
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="16" cy="16" r="6" fill="currentColor" fillOpacity="0.32" stroke="none"/>
          <path d="M16 4v6"/><circle cx="16" cy="16" r="6"/><path d="M11.8 11.8l8.4 8.4M20.2 11.8l-8.4 8.4"/>
        </g>
      )},
      { id: "lt_downlight", name: "Downlighter", svg: (
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="16" cy="16" r="7.5" fill="currentColor" fillOpacity="0.32" stroke="none"/>
          <circle cx="16" cy="16" r="7.5"/><circle cx="16" cy="16" r="2" fill="currentColor" stroke="none"/>
        </g>
      )},
      { id: "lt_downlight_ip", name: "Downlighter IP-rated", svg: (
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="16" cy="16" r="7.5" fill="currentColor" fillOpacity="0.32" stroke="none"/>
          <circle cx="16" cy="16" r="7.5"/><circle cx="16" cy="16" r="2" fill="currentColor" stroke="none"/><path d="M25.5 5.5c1.9 2.1 1.9 4 0 5.2-1.9-1.2-1.9-3.1 0-5.2z" fill="currentColor" stroke="none"/>
        </g>
      )},
      { id: "lt_2d", name: "2D Fitting", svg: (
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <rect x="8" y="8" width="16" height="16" rx="2" fill="currentColor" fillOpacity="0.32" stroke="none"/>
          <rect x="8" y="8" width="16" height="16" rx="2"/><circle cx="16" cy="16" r="4"/>
        </g>
      )},
      { id: "lt_batten", name: "Batten Holder", svg: (
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="16" cy="16" r="7.5" fill="currentColor" fillOpacity="0.32" stroke="none"/>
          <circle cx="16" cy="16" r="7.5"/><path d="M8.5 16h15M16 8.5v15"/>
        </g>
      )},
      { id: "lt_wall", name: "Wall Light", svg: (
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 9a7 7 0 0 1 0 14z" fill="currentColor" fillOpacity="0.32" stroke="none"/>
          <path d="M9 6v20"/><path d="M9 9a7 7 0 0 1 0 14z"/>
        </g>
      )},
      { id: "lt_strip", name: "LED Strip", svg: (
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="13" width="22" height="6" rx="3" fill="currentColor" fillOpacity="0.32" stroke="none"/>
          <rect x="5" y="13" width="22" height="6" rx="3"/><path d="M9 16h.01M13 16h.01M17 16h.01M21 16h.01M23 16h.01"/>
        </g>
      )},
      { id: "lt_emergency", name: "Emergency Light", svg: (
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <rect x="8" y="11" width="16" height="10" rx="2" fill="currentColor" fillOpacity="0.32" stroke="none"/>
          <rect x="8" y="11" width="16" height="10" rx="2"/><path d="M11.5 19v-6l2.5 3 2.5-3v6"/><path d="M19 13v6"/>
        </g>
      )},
      { id: "lt_external", name: "External Light", svg: (
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <rect x="8" y="11" width="16" height="10" rx="5" fill="currentColor" fillOpacity="0.32" stroke="none"/>
          <rect x="8" y="11" width="16" height="10" rx="5"/><path d="M12 16h8"/>
        </g>
      )},
      { id: "lt_external_updown", name: "External Up/Down (D/D)", svg: (
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="16" cy="16" r="5" fill="currentColor" fillOpacity="0.32" stroke="none"/>
          <circle cx="16" cy="16" r="5"/><path d="M16 9V4M13.5 6.2l2.5-2.5 2.5 2.5"/><path d="M16 23v5M13.5 25.8l2.5 2.5 2.5-2.5"/>
        </g>
      )},
    ],
  },

  detectors: {
    label: "Detectors",
    items: [
      { id: "det_smoke", name: "Smoke Detector", svg: (
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="16" cy="16" r="8" fill="currentColor" fillOpacity="0.32" stroke="none"/>
          <circle cx="16" cy="16" r="8"/><path d="M16 5.5v2.5M16 24v2.5M5.5 16h2.5M24 16h2.5M9 9l1.8 1.8M21.2 21.2L23 23M23 9l-1.8 1.8M10.8 21.2L9 23"/><text x="16" y="19" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7" fontWeight="600" fill="currentColor" stroke="none">SD</text>
        </g>
      )},
      { id: "det_heat", name: "Heat Detector", svg: (
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="16" cy="16" r="8" fill="currentColor" fillOpacity="0.32" stroke="none"/>
          <circle cx="16" cy="16" r="8"/><path d="M13 12v8M19 12v8M13 16h6"/>
        </g>
      )},
      { id: "det_co", name: "CO Detector", svg: (
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="16" cy="16" r="8" fill="currentColor" fillOpacity="0.32" stroke="none"/>
          <circle cx="16" cy="16" r="8"/><text x="16" y="19.2" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="8" fontWeight="600" fill="currentColor" stroke="none">CO</text>
        </g>
      )},
      { id: "det_combined", name: "Smoke/Heat/CO", svg: (
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="16" cy="16" r="8" fill="currentColor" fillOpacity="0.32" stroke="none"/>
          <circle cx="16" cy="16" r="8"/><circle cx="16" cy="16" r="2" fill="currentColor" stroke="none"/><path d="M12.5 12.5h7M12.5 19.5h7"/>
        </g>
      )},
      { id: "det_thermostat", name: "Thermostat", svg: (
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="16" cy="16" r="8" fill="currentColor" fillOpacity="0.32" stroke="none"/>
          <circle cx="16" cy="16" r="8"/><path d="M16 16V9.5"/><path d="M16 16l5 3"/>
        </g>
      )},
    ],
  },

  security: {
    label: "Security",
    items: [
      { id: "sec_pir", name: "Intruder PIR", svg: (
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <rect x="10" y="9" width="12" height="9" rx="2.4" fill="currentColor" fillOpacity="0.32" stroke="none"/>
          <rect x="10" y="9" width="12" height="9" rx="2.4"/><circle cx="16" cy="13.5" r="2.2"/><path d="M13 18l-1.3 4.5M19 18l1.3 4.5"/>
        </g>
      )},
      { id: "sec_keypad", name: "Alarm Keypad", svg: (
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="5" width="14" height="22" rx="2.6" fill="currentColor" fillOpacity="0.32" stroke="none"/>
          <rect x="9" y="5" width="14" height="22" rx="2.6"/><path d="M12 9.5h8"/><circle cx="13" cy="14" r="1" fill="currentColor" stroke="none"/><circle cx="16" cy="14" r="1" fill="currentColor" stroke="none"/><circle cx="19" cy="14" r="1" fill="currentColor" stroke="none"/><circle cx="13" cy="18" r="1" fill="currentColor" stroke="none"/><circle cx="16" cy="18" r="1" fill="currentColor" stroke="none"/><circle cx="19" cy="18" r="1" fill="currentColor" stroke="none"/><circle cx="13" cy="22" r="1" fill="currentColor" stroke="none"/><circle cx="16" cy="22" r="1" fill="currentColor" stroke="none"/><circle cx="19" cy="22" r="1" fill="currentColor" stroke="none"/>
        </g>
      )},
      { id: "sec_hub", name: "Alarm Hub", svg: (
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <rect x="6" y="10" width="20" height="14" rx="2.6" fill="currentColor" fillOpacity="0.32" stroke="none"/>
          <rect x="6" y="10" width="20" height="14" rx="2.6"/><path d="M16 10V6"/><circle cx="16" cy="5.5" r="1.3" fill="currentColor" stroke="none"/><circle cx="11" cy="14.5" r="1.4" fill="currentColor" stroke="none"/><path d="M10 20h12"/>
        </g>
      )},
      { id: "sec_bell", name: "Alarm Sounder (Bell)", svg: (
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 6a6 6 0 0 0-6 6c0 4.5-2 6.5-2 6.5h16s-2-2-2-6.5a6 6 0 0 0-6-6z" fill="currentColor" fillOpacity="0.32" stroke="none"/>
          <path d="M16 6a6 6 0 0 0-6 6c0 4.5-2 6.5-2 6.5h16s-2-2-2-6.5a6 6 0 0 0-6-6z"/><path d="M13.5 22a2.5 2.5 0 0 0 5 0"/><path d="M16 6V4"/>
        </g>
      )},
      { id: "sec_door", name: "Door Sensor", svg: (
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <rect x="7" y="11" width="7" height="10" rx="1.6" fill="currentColor" fillOpacity="0.32" stroke="none"/><rect x="18" y="11" width="7" height="10" rx="1.6" fill="currentColor" fillOpacity="0.32" stroke="none"/>
          <rect x="7" y="11" width="7" height="10" rx="1.6"/><rect x="18" y="11" width="7" height="10" rx="1.6"/><path d="M14 16h4" strokeDasharray="2 2.4"/>
        </g>
      )},
      { id: "sec_cctv", name: "CCTV Camera", svg: (
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 13l15-3.5 1.4 5L6.4 18z" fill="currentColor" fillOpacity="0.32" stroke="none"/>
          <path d="M5 13l15-3.5 1.4 5L6.4 18z"/><path d="M21.4 14.5L26 13v6l-4.6-1.5z"/><path d="M9 18v3M7 21h5"/>
        </g>
      )},
    ],
  },

  fixtures: {
    label: "Fixtures",
    items: [
      { id: "fx_extractor", name: "Ceiling Extract", svg: (
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="16" cy="16" r="8" fill="currentColor" fillOpacity="0.32" stroke="none"/>
          <circle cx="16" cy="16" r="8"/><circle cx="16" cy="16" r="1.6" fill="currentColor" stroke="none"/><path d="M16 14.4c0-3 1.2-4.8 4-5.2M17.4 16.8c2.6 1.5 3.2 3.6 1.6 6.2M14.6 16c-2.6 1.5-4.8.9-6.2-2.2"/>
        </g>
      )},
      { id: "fx_extractor_wall", name: "Wall Extract (SA)", svg: (
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="17" cy="16" r="6.5" fill="currentColor" fillOpacity="0.32" stroke="none"/>
          <path d="M6 5v22"/><circle cx="17" cy="16" r="6.5"/><circle cx="17" cy="16" r="1.4" fill="currentColor" stroke="none"/><path d="M17 14.6c0-2.4 1-3.8 3.2-4.2M18.2 16.6c2 1.2 2.5 3 1.3 5.1"/><path d="M26 11.5c1.6 2.4 1.6 6.6 0 9"/>
        </g>
      )},
      { id: "fx_ext_tap", name: "External Tap", svg: (
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 11h6v4h5"/><path d="M14 15v4"/><path d="M10 19h8"/><path d="M11 8h6"/>
        </g>
      )},
      { id: "fx_doorbell", name: "Door Bell", svg: (
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="14" height="14" rx="3" fill="currentColor" fillOpacity="0.32" stroke="none"/>
          <rect x="9" y="9" width="14" height="14" rx="3"/><circle cx="16" cy="16" r="3.2" fill="currentColor" stroke="none"/>
        </g>
      )},
      { id: "fx_motor", name: "Motor", svg: (
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="16" cy="16" r="8" fill="currentColor" fillOpacity="0.32" stroke="none"/>
          <circle cx="16" cy="16" r="8"/><path d="M12 20v-8l4 5 4-5v8"/>
        </g>
      )},
      { id: "fx_consumer", name: "Consumer Unit", svg: (
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="10" width="24" height="12" rx="2.2" fill="currentColor" fillOpacity="0.32" stroke="none"/>
          <rect x="4" y="10" width="24" height="12" rx="2.2"/><path d="M10 10v12M16 10v12M22 10v12"/>
        </g>
      )},
      { id: "fx_meter", name: "Electrical Meter Box", svg: (
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <rect x="6" y="8" width="20" height="16" rx="2.6" fill="currentColor" fillOpacity="0.32" stroke="none"/>
          <rect x="6" y="8" width="20" height="16" rx="2.6"/><rect x="10" y="12" width="12" height="5" rx="1.2"/><path d="M11 20.5h7"/>
        </g>
      )},
      { id: "fx_isolator", name: "Isolator", svg: (
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <rect x="8" y="9" width="16" height="14" rx="2" fill="currentColor" fillOpacity="0.32" stroke="none"/>
          <rect x="8" y="9" width="16" height="14" rx="2"/><circle cx="13" cy="19" r="1.4" fill="currentColor" stroke="none"/><path d="M13 19l6-6"/>
        </g>
      )},
      { id: "iso_dp", name: "1G DP Isolator", svg: (
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <rect x="8" y="9" width="16" height="14" rx="2" fill="currentColor" fillOpacity="0.32" stroke="none"/>
          <rect x="8" y="9" width="16" height="14" rx="2"/><circle cx="12" cy="19" r="1.3" fill="currentColor" stroke="none"/><circle cx="16" cy="19" r="1.3" fill="currentColor" stroke="none"/><path d="M12 19l5-5M16 19l4-4"/>
        </g>
      )},
      { id: "iso_rotary", name: "Rotary Isolator", svg: (
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="16" cy="16" r="8" fill="currentColor" fillOpacity="0.32" stroke="none"/>
          <circle cx="16" cy="16" r="8"/><path d="M16 16l5-3.5"/><path d="M22 9.5a8 8 0 0 0-6-2.3"/>
        </g>
      )},
      { id: "iso_cooker", name: "Cooker Control Unit (45A)", svg: (
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <rect x="6" y="9" width="20" height="14" rx="2" fill="currentColor" fillOpacity="0.32" stroke="none"/>
          <rect x="6" y="9" width="20" height="14" rx="2"/><path d="M16 9V6"/><circle cx="12" cy="16" r="1.4" fill="currentColor" stroke="none"/><path d="M12 16l5-4"/><circle cx="21" cy="19" r="1.3" fill="currentColor" stroke="none"/>
        </g>
      )},
      { id: "ev_charger", name: "EV Charge Point", svg: (
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="6" width="14" height="20" rx="3" fill="currentColor" fillOpacity="0.32" stroke="none"/>
          <rect x="9" y="6" width="14" height="20" rx="3"/><path d="M17 11l-4 5.5h3.2L15 22l4.5-6h-3z" fill="currentColor" stroke="none"/>
        </g>
      )},
      { id: "fx_domed", name: "Domed Compact Fitting", svg: (
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 5l11 11-11 11L5 16z" fill="currentColor" fillOpacity="0.32" stroke="none"/>
          <path d="M16 5l11 11-11 11L5 16z"/><circle cx="16" cy="16" r="4.5"/>
        </g>
      )},
      { id: "mk_csp", name: "CSP Location", svg: (
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 7h12l-3 3.5 3 3.5H11Z" fill="currentColor" fillOpacity="0.32" stroke="none"/>
          <path d="M11 27V6"/><path d="M11 7h12l-3 3.5 3 3.5H11"/>
        </g>
      )},
    ],
  },

  data: {
    label: "Data",
    items: [
      { id: "data_point", name: "Data Point (Cat5/6)", svg: (
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <rect x="6" y="8" width="20" height="11" rx="2" fill="currentColor" fillOpacity="0.32"/><path d="M11 8V5.5h10V8"/><path d="M10 12.5h12"/><path d="M12.5 12.5v3.3M16 12.5v3.3M19.5 12.5v3.3"/><text x="16" y="26" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="6" fontWeight="600" fill="currentColor" stroke="none">DATA</text>
        </g>
      )},
      { id: "data_internet", name: "Internet Connection Point", svg: (
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="16" cy="16" r="8" fill="currentColor" fillOpacity="0.32" stroke="none"/>
          <circle cx="16" cy="16" r="8"/><path d="M8 16h16"/><path d="M16 8c3.2 2.2 3.2 13.8 0 16M16 8c-3.2 2.2-3.2 13.8 0 16"/>
        </g>
      )},
      { id: "data_ont", name: "Fibre Optic (ONT)", svg: (
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <rect x="6" y="11" width="20" height="10" rx="2.2" fill="currentColor" fillOpacity="0.32" stroke="none"/>
          <rect x="6" y="11" width="20" height="10" rx="2.2"/><circle cx="10.5" cy="16" r="1.3" fill="currentColor" stroke="none"/><path d="M14.5 16H23"/>
        </g>
      )},
    ],
  },

  heating: {
    label: "Heating",
    items: [
      { id: "ht_towel", name: "Towel Rail", svg: (
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <rect x="10" y="5" width="12" height="22" rx="3.2" fill="currentColor" fillOpacity="0.32" stroke="none"/>
          <rect x="10" y="5" width="12" height="22" rx="3.2"/><path d="M10 10h12M10 14h12M10 18h12M10 22h12"/>
        </g>
      )},
      { id: "ht_radiator", name: "Radiator", svg: (
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <rect x="7" y="9" width="18" height="14" rx="2" fill="currentColor" fillOpacity="0.32" stroke="none"/>
          <rect x="7" y="9" width="18" height="14" rx="2"/><path d="M11.5 9v14M16 9v14M20.5 9v14"/>
        </g>
      )},
      { id: "ht_uf", name: "Underfloor Heating", svg: (
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 11c3-3 3 3 6 0s3 3 6 0 3 3 6 0"/><path d="M7 16c3-3 3 3 6 0s3 3 6 0 3 3 6 0"/><path d="M7 21c3-3 3 3 6 0s3 3 6 0 3 3 6 0"/>
        </g>
      )},
      { id: "ht_wiring_centre", name: "Heating Wiring Centre", svg: (
        <g fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <rect x="6" y="10" width="20" height="12" rx="2" fill="currentColor" fillOpacity="0.32" stroke="none"/>
          <rect x="6" y="10" width="20" height="12" rx="2"/><path d="M10 22v3M14 22v3M18 22v3M22 22v3"/><path d="M10 10V7M14 10V7M18 10V7M22 10V7"/>
        </g>
      )},
    ],
  },
};

export const VIEWBOX = "0 0 32 32";

/* ----------------------------------------------------------------------------
 * SYMBOL_META — descriptions + mounting heights, phrased to match industry-
 * standard UK residential MEP legends.
 * ------------------------------------------------------------------------- */
export const SYMBOL_META = {
  // Sockets — low level
  sock_sso_ll:     { description: "Single Socket Low Level",                height: "450mm AFL" },
  sock_dso_ll:     { description: "Double Socket Low Level",                height: "450mm AFL" },
  sock_dso_usb_ll: { description: "Double Socket Low Level (USB-C)",        height: "450mm AFL" },

  // Sockets — high level
  sock_sso_hl:     { description: "Single Socket High Level",               height: "1100mm AFL" },
  sock_dso_hl:     { description: "Double Socket High Level",               height: "1100mm AFL" },
  sock_dso_usb_hl: { description: "Double Socket High Level (USB-C)",       height: "1100mm AFL" },

  // Sockets — specialist
  sock_2a:         { description: "2A Socket Outlet",                       height: "450mm AFL" },
  sock_cooker:     { description: "Cooker Outlet",                          height: "1100mm AFL" },
  sock_shaver:     { description: "Shaver Socket",                          height: "1200mm AFL" },
  sock_tv:         { description: "TV Point",                               height: "450mm AFL" },
  sock_fcu:        { description: "Switched Fused Spur",                      height: "Above worktop / per location" },

  // Switches
  sw_light:        { description: "Light Switch",                            height: "1200mm AFL" },
  sw_2g:           { description: "2 Gang Light Switch",                      height: "1200mm AFL" },
  sw_3g:           { description: "3 Gang Light Switch",                      height: "1200mm AFL" },
  sw_4g:           { description: "4 Gang Light Switch",                      height: "1200mm AFL" },
  sw_grid:         { description: "Grid Switch",                             height: "1200mm AFL" },
  sw_2way:         { description: "2-Way Light Switch",                      height: "1200mm AFL" },
  sw_intermediate: { description: "Intermediate Light Switch",               height: "1200mm AFL" },
  sw_dimmer:       { description: "Dimmer Switch",                           height: "1200mm AFL" },
  sw_pull:         { description: "Pull Cord Switch",                        height: "Ceiling (cord to 1000mm)" },
  sw_pir_light:    { description: "Passive Infrared Lighting Sensor",        height: "Ceiling" },
  sw_keycard:      { description: "Keycard Switch",                          height: "1200mm AFL" },

  // Lighting
  lt_pendant:        { description: "Pendant Light",                                 height: "Ceiling" },
  lt_downlight:      { description: "Ceiling mounted downlight",                     height: "Ceiling" },
  lt_downlight_ip:   { description: "Ceiling or under cabinet mounted downlight IP Rated", height: "Ceiling / under cabinet" },
  lt_batten:         { description: "Light fitting — Batten Holder (Ceiling / Wall)", height: "Ceiling / wall" },
  lt_wall:           { description: "Wall Light",                                    height: "1800mm AFL" },
  lt_strip:          { description: "LED Strip Lighting",                            height: "Per location" },
  lt_emergency:      { description: "Emergency Lighting",                            height: "Ceiling" },
  lt_external:       { description: "External Light",                                height: "1800mm AFL" },
  lt_external_updown:{ description: "External Up and Down Light (dusk till dawn)",   height: "1800mm AFL" },

  // Detectors
  det_smoke:       { description: "Smoke Detector (Grade D2, Cat LD3)",     height: "Ceiling" },
  det_heat:        { description: "Heat Detector",                          height: "Ceiling" },
  det_co:          { description: "Carbon Monoxide Detector",               height: "Per manufacturer" },
  det_combined:    { description: "Smoke / Heat / CO Combined",             height: "Ceiling" },
  det_thermostat:  { description: "Thermostat",                             height: "1500mm AFL" },

  // Security
  sec_pir:         { description: "Passive Infrared Detector",              height: "2100mm AFL" },
  sec_keypad:      { description: "Security Alarm Keypad",                  height: "1500mm AFL" },
  sec_hub:         { description: "Security Alarm Hub Unit",                height: "Per location" },
  sec_door:        { description: "Door Sensor",                            height: "Door frame" },
  sec_cctv:        { description: "CCTV Camera",                            height: "2400mm AFL" },

  // Fixtures
  fx_extractor:      { description: "Ceiling Mounted Extract",                                          height: "Ceiling" },
  fx_extractor_wall: { description: "Sound attenuated wall mounted extractor (Part F & SAP Part O)",    height: "High wall" },
  fx_ext_tap:        { description: "External Tap (electrically isolated)",                              height: "Per location" },
  fx_doorbell:       { description: "Door Bell Push",                                                    height: "1200mm AFL" },
  fx_motor:          { description: "Motor / Plant Connection",                                          height: "Per location" },
  fx_consumer:       { description: "Consumer Unit — switches to between",                               height: "1350–1450mm AFL" },
  fx_meter:          { description: "Electrical Meter Box (refer to site plans for plot locations)",     height: "Per site plan" },
  fx_isolator:       { description: "Isolator Switch",                                                   height: "1500mm AFL" },
  fx_domed:          { description: "Domed compact fitting (chrome collar)",                             height: "Ceiling" },
  mk_csp:            { description: "CSP location — set out on Preston Baker site drawings",             height: "Per site plan" },

  // Data
  data_point:    { description: "Data Point (Cat5e / Cat6)",                 height: "450mm AFL" },
  data_internet: { description: "Internet Connection Point",                 height: "450mm AFL" },
  data_ont:      { description: "Fibre Optic (ONT)",                         height: "Per location" },

  // Heating
  ht_towel:      { description: "Heated Towel Rail (electric)",              height: "Per location" },
  ht_radiator:   { description: "Radiator",                                  height: "Per location" },
  ht_uf:         { description: "Underfloor Heating Zone",                   height: "Floor" },
  ht_wiring_centre:{ description: "Heating Wiring Centre",                  height: "Per location" },

  // Added — isolators, spurs & services
  spur_unsw:       { description: "Unswitched Fused Spur",                  height: "Above worktop / per location" },
  lt_2d:           { description: "2D Surface Fitting",                     height: "Ceiling" },
  iso_dp:          { description: "1 Gang Double Pole Isolator",            height: "1500mm AFL" },
  iso_rotary:      { description: "Rotary Isolator (IP65)",                 height: "Per location" },
  iso_cooker:      { description: "Cooker Control Unit (45A DP)",           height: "1100\u20131450mm AFL" },
  ev_charger:      { description: "EV Charge Point",                        height: "Per manufacturer" },
  sec_bell:        { description: "External Alarm Sounder (Bell Box)",      height: "High level (eaves)" },
};

/* ============================================================================
 * Helpers
 * ========================================================================= */

// Map legacy symbol IDs to their current equivalents so old saved projects
// don't break when the library evolves.
const ID_ALIASES = {
  sock_sso:         "sock_sso_ll",
  sock_dso:         "sock_dso_ll",
  sock_usbc:        "sock_dso_usb_ll",
  sock_sso_2a:      "sock_2a",
  sock_cat5:        "data_point",
  sw_pir:           "sw_pir_light",
  lt_ceiling:       "lt_batten",
  det_alarm_panel:  "sec_hub",
  det_pir_intruder: "sec_pir",
  fx_camera:        "sec_cctv",
};

function resolveId(id) {
  return ID_ALIASES[id] || id;
}

export function findSymbol(id) {
  id = resolveId(id);
  for (const cat of Object.values(SYMBOLS)) {
    const s = cat.items.find(i => i.id === id);
    if (s) return s;
  }
  return null;
}

export function findCategory(id) {
  id = resolveId(id);
  for (const [key, cat] of Object.entries(SYMBOLS)) {
    if (cat.items.find(i => i.id === id)) return key;
  }
  return null;
}

export function resolveColours(symbolId, mode) {
  symbolId = resolveId(symbolId);
  const sym = findSymbol(symbolId);
  if (!sym) return { body: "#e7e5e4", feeder: "#a8a29e" };
  if (sym.forceColor) return { body: sym.forceColor, feeder: "#9a3412" };
  if (mode === "navy") return { body: "#2C3E50", feeder: "#94a3b8" };
  if (mode === "mono") return { body: "#0a0a0a", feeder: "#737373" };
  if (mode === "red")  return { body: "#cc1418", feeder: "#e88a8a" };
  const cat = findCategory(symbolId);
  const palette = CATEGORY_COLOURS[cat] || CATEGORY_COLOURS.fixtures;
  return { body: palette.primary, feeder: palette.soft };
}

/* ============================================================================
 * PALETTE_GROUPS — user-facing subcategories. The palette renders these as
 * labelled sections; search flattens across all of them.
 * ========================================================================= */
export const PALETTE_GROUPS = [
  { label: "Sockets & Data",        ids: ["sock_sso_ll", "sock_dso_ll", "sock_dso_usb_ll", "sock_tv", "data_point"] },
  { label: "Switches",              ids: ["sw_light", "sw_2g", "sw_3g", "sw_4g", "sw_grid"] },
  { label: "Lighting",              ids: ["lt_downlight", "lt_pendant", "lt_2d", "lt_wall", "lt_strip", "lt_external"] },
  { label: "Isolators & Spurs",     ids: ["iso_dp", "sock_fcu", "spur_unsw", "iso_rotary", "iso_cooker"] },
  { label: "Detection & Security",  ids: ["det_smoke", "det_co", "det_heat", "sec_pir", "sec_bell", "sec_cctv"] },
  { label: "Appliances & Services", ids: ["sock_cooker", "sock_shaver", "fx_extractor", "fx_extractor_wall", "ev_charger", "fx_consumer", "ht_wiring_centre"] },
];

// Grouped palette: [{ label, items: [{ sym, meta, category }] }]
export function getPaletteGroups() {
  return PALETTE_GROUPS
    .map(g => ({
      label: g.label,
      items: g.ids
        .map(id => {
          const sym = findSymbol(id);
          if (!sym) return null;
          return { sym, meta: SYMBOL_META[id] || {}, category: findCategory(id) };
        })
        .filter(Boolean),
    }))
    .filter(g => g.items.length);
}

// Flat list (used for search). Mirrors the grouped set.
export function getPaletteSymbols() {
  return getPaletteGroups().flatMap(g => g.items);
}
