/* ============================================================================
 * lib/cad/plan.js — Plotwire CAD floor-plan: data model + geometry helpers.
 *
 * Framework-agnostic. Pure functions only — no React, no DOM. This is the
 * single source of truth for the sketch model and the maths the renderer and
 * tools build on. Ported from the design handoff (cad-plan.js).
 *
 * Model space is in MILLIMETRES. Origin top-left, +x right, +y down.
 * ========================================================================= */

// -- Wall thicknesses (mm) --
export const T_EXT = 300;
export const T_INT = 100;

// Default opening widths (mm)
export const DOOR_W = 850;
export const WIN_W = 1200;

/** A new, empty drawing. */
export function emptyDrawing() {
  return { walls: [], doors: [], windows: [], dims: [], rooms: [], notes: [] };
}

// --------------------------- geometry helpers ---------------------------

export function hyp(dx, dy) { return Math.sqrt(dx * dx + dy * dy); }
export function segLen(s) { return hyp(s.x2 - s.x1, s.y2 - s.y1); }
export function snap(v, g) { return Math.round(v / g) * g; }
export function fmtMM(n) { return Math.round(n).toLocaleString("en-GB"); }

/**
 * Wall rectangle polygon, extended by t/2 at each end so perpendicular walls
 * overlap and corners close. Returned as an array of [x,y] points.
 */
export function wallPoly(s, t) {
  const dx = s.x2 - s.x1, dy = s.y2 - s.y1, len = hyp(dx, dy) || 1;
  const ux = dx / len, uy = dy / len, nx = -uy, ny = ux, e = t / 2;
  const ax = s.x1 - ux * e, ay = s.y1 - uy * e, bx = s.x2 + ux * e, by = s.y2 + uy * e;
  return [
    [ax + nx * e, ay + ny * e], [bx + nx * e, by + ny * e],
    [bx - nx * e, by - ny * e], [ax - nx * e, ay - ny * e],
  ];
}

/**
 * The two long faces of a wall (parallel offset lines, NO end caps) — drawing
 * only these makes runs read as continuous double lines and corners auto-close.
 * Returns [[a,b],[a,b]] (two segments, each two [x,y] points).
 */
export function wallFaces(s, t) {
  const dx = s.x2 - s.x1, dy = s.y2 - s.y1, len = hyp(dx, dy) || 1;
  const ux = dx / len, uy = dy / len, nx = -uy, ny = ux, e = t / 2;
  const ax = s.x1 - ux * e, ay = s.y1 - uy * e, bx = s.x2 + ux * e, by = s.y2 + uy * e;
  return [
    [[ax + nx * e, ay + ny * e], [bx + nx * e, by + ny * e]],
    [[ax - nx * e, ay - ny * e], [bx - nx * e, by - ny * e]],
  ];
}

/** Serialise a list of [x,y] points to an SVG points string. */
export function ptStr(pts) { return pts.map((p) => p[0] + "," + p[1]).join(" "); }

/** Wall thickness for a type. */
export function thicknessFor(type) { return type === "external" ? T_EXT : T_INT; }

/**
 * Nearest wall segment to a world point (mm) — for select hit-testing and for
 * door/window placement. Returns { seg, cx, cy, dist, dir } or null.
 */
export function nearestWall(walls, px, py) {
  let best = null, bestD = Infinity;
  for (const s of walls) {
    const dx = s.x2 - s.x1, dy = s.y2 - s.y1, len2 = dx * dx + dy * dy || 1;
    let tt = ((px - s.x1) * dx + (py - s.y1) * dy) / len2;
    tt = Math.max(0, Math.min(1, tt));
    const cx = s.x1 + tt * dx, cy = s.y1 + tt * dy;
    const d = hyp(px - cx, py - cy);
    if (d < bestD) {
      bestD = d;
      best = { seg: s, cx, cy, dist: d, dir: Math.abs(dx) >= Math.abs(dy) ? "h" : "v" };
    }
  }
  return best;
}

/**
 * Select hit-test: the nearest wall counts as a hit if within max(thickness,220mm).
 * Returns { kind:'wall', id } | null.
 */
export function hitTest(walls, px, py) {
  const n = nearestWall(walls, px, py);
  if (!n) return null;
  const tol = Math.max(thicknessFor(n.seg.type), 220);
  return n.dist <= tol ? { kind: "wall", id: n.seg.id } : null;
}

// --------------------------- worked sample (seed / fixture) ---------------------------
// A complete first-floor plan -- kept as a demo seed and as the fidelity fixture
// to check the renderer against reference-floorplan.png.

const EXT = { x0: 150, y0: 150, x1: 8250, y1: 8650 };

export const SAMPLE_PLAN = {
  EXT,
  EXTENT: { w: 8400, h: 8800, margin: 2600 },
  walls: [
    { id: "EW-N", type: "external", x1: EXT.x0, y1: EXT.y0, x2: EXT.x1, y2: EXT.y0 },
    { id: "EW-E", type: "external", x1: EXT.x1, y1: EXT.y0, x2: EXT.x1, y2: EXT.y1 },
    { id: "EW-S", type: "external", x1: EXT.x0, y1: EXT.y1, x2: EXT.x1, y2: EXT.y1 },
    { id: "EW-W", type: "external", x1: EXT.x0, y1: EXT.y0, x2: EXT.x0, y2: EXT.y1 },
    { id: "IW-spine", type: "internal", x1: 4200, y1: 150, x2: 4200, y2: 8650 },
    { id: "IW-L1", type: "internal", x1: 150, y1: 2900, x2: 4200, y2: 2900 },
    { id: "IW-L2", type: "internal", x1: 150, y1: 4150, x2: 4200, y2: 4150 },
    { id: "IW-L3", type: "internal", x1: 150, y1: 5400, x2: 4200, y2: 5400 },
    { id: "IW-R1", type: "internal", x1: 4200, y1: 2600, x2: 8250, y2: 2600 },
    { id: "IW-RV", type: "internal", x1: 6200, y1: 150, x2: 6200, y2: 2600 },
    { id: "IW-R2", type: "internal", x1: 4200, y1: 6100, x2: 8250, y2: 6100 },
  ],
  doors: [
    { id: "DF.01", x: 1100, y: 2900, dir: "h", w: 850, t: T_INT, hinge: -1, fold: 1, ref: "DF.01" },
    { id: "DF.02", x: 1100, y: 4150, dir: "h", w: 850, t: T_INT, hinge: -1, fold: 1, ref: "DF.02" },
    { id: "DF.03", x: 4200, y: 3500, dir: "v", w: 850, t: T_INT, hinge: -1, fold: -1, ref: "DF.03" },
    { id: "DF.04", x: 4200, y: 6800, dir: "v", w: 900, t: T_INT, hinge: 1, fold: -1, ref: "DF.04" },
    { id: "DF.05", x: 5300, y: 2600, dir: "h", w: 800, t: T_INT, hinge: -1, fold: -1, ref: "DF.05" },
    { id: "DF.06", x: 6900, y: 2600, dir: "h", w: 850, t: T_INT, hinge: 1, fold: -1, ref: "DF.06" },
    { id: "DF.07", x: 5100, y: 6100, dir: "h", w: 850, t: T_INT, hinge: -1, fold: 1, ref: "DF.07" },
  ],
  windows: [
    { id: "FW.03", x: 2050, y: 150, dir: "h", w: 1500, t: T_EXT, escape: true, ref: "FW.03" },
    { id: "W-L1", x: 150, y: 1450, dir: "v", w: 1200, t: T_EXT, escape: false, ref: "" },
    { id: "FW.01", x: 2050, y: 8650, dir: "h", w: 1500, t: T_EXT, escape: true, ref: "FW.01" },
    { id: "W-L2", x: 150, y: 6900, dir: "v", w: 1200, t: T_EXT, escape: false, ref: "" },
    { id: "W-R1", x: 8250, y: 1300, dir: "v", w: 1200, t: T_EXT, escape: false, ref: "" },
    { id: "W-R2", x: 8250, y: 7400, dir: "v", w: 1400, t: T_EXT, escape: false, ref: "" },
    { id: "W-S1", x: 6400, y: 8650, dir: "h", w: 1200, t: T_EXT, escape: false, ref: "" },
  ],
  dims: [
    { id: "d-topA", x1: 150, y1: 150, x2: 4200, y2: 150, side: "top", off: 1100 },
    { id: "d-topB", x1: 4200, y1: 150, x2: 8250, y2: 150, side: "top", off: 1100 },
    { id: "d-topAll", x1: 150, y1: 150, x2: 8250, y2: 150, side: "top", off: 1900 },
    { id: "d-leftA", x1: 150, y1: 150, x2: 150, y2: 2900, side: "left", off: 1100 },
    { id: "d-leftB", x1: 150, y1: 2900, x2: 150, y2: 5400, side: "left", off: 1100 },
    { id: "d-leftC", x1: 150, y1: 5400, x2: 150, y2: 8650, side: "left", off: 1100 },
    { id: "d-leftAll", x1: 150, y1: 150, x2: 150, y2: 8650, side: "left", off: 1900 },
    { id: "d-crit", x1: 8250, y1: 150, x2: 8250, y2: 2600, side: "right", off: 700, critical: true },
  ],
  rooms: [
    { name: "Bed 1", area: 11.2, x: 2175, y: 1525 },
    { name: "Dressing", area: 4.7, x: 2750, y: 3450 },
    { name: "En-suite", area: 4.4, x: 2750, y: 4780 },
    { name: "Bed 2", area: 12.8, x: 2175, y: 7025 },
    { name: "Bath", area: 5.6, x: 5200, y: 1375 },
    { name: "Bed 4", area: 6.1, x: 7225, y: 1375 },
    { name: "Landing", area: 9.4, x: 6900, y: 4500 },
    { name: "Bed 3", area: 13.5, x: 6225, y: 7375 },
  ],
  notes: [],
  rooflights: [
    { ref: "RL.01", x: 6450, y: 2820, w: 820, h: 1150, note: "Flat glass roof light" },
    { ref: "RL.02", x: 7380, y: 2820, w: 820, h: 1150, note: "Flat glass roof light" },
  ],
  stairs: { x: 4550, y: 2900, w: 1500, h: 3100, treads: 13, up: "up" },
  boundary: [[60, 60], [4260, 60], [4260, 8740], [60, 8740], [60, 60]],
};
