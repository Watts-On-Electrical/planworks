/* ============================================================================
 * symbolPdf.js — draw a 32-unit symbol as TRUE VECTOR into a pdf-lib page.
 *
 * Symbols are authored in a "0 0 32 32" box (see VIEWBOX in symbols.jsx) and
 * placed in the editor centred at (x,y), scaled to itemSize, rotated about
 * their centre. This module reproduces that placement directly in the PDF so
 * the export needs no html2canvas raster of the symbol layer — which is what
 * crashes iOS Safari and what made symbols drift.
 *
 * This file is intentionally framework-free (no React / DOM) so it can be unit
 * tested in Node. The browser-only step that turns a symbol's JSX into the
 * `prims` array lives separately and feeds into drawSymbol().
 * ========================================================================= */

const BOX = 32; // symbol viewBox is 0 0 32 32

// Convert the simple SVG primitives our symbols use into a path `d` string,
// so everything can go through pdf-lib's drawSvgPath with one code path.
function primToPath(p) {
  switch (p.kind) {
    case "path":
      return p.d;
    case "line":
      return `M ${p.x1} ${p.y1} L ${p.x2} ${p.y2}`;
    case "rect": {
      const { x, y, w, h } = p;
      return `M ${x} ${y} h ${w} v ${h} h ${-w} Z`;
    }
    case "circle": {
      const { cx, cy, r } = p;
      // two half-arcs make a full circle
      return `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0 Z`;
    }
    case "polyline":
    case "polygon": {
      const pts = p.points;
      if (!pts || !pts.length) return "";
      let d = `M ${pts[0][0]} ${pts[0][1]}`;
      for (let i = 1; i < pts.length; i++) d += ` L ${pts[i][0]} ${pts[i][1]}`;
      if (p.kind === "polygon") d += " Z";
      return d;
    }
    default:
      return "";
  }
}

/**
 * Draw one placed symbol into a pdf-lib page.
 *
 * @param page    pdf-lib PDFPage
 * @param opts.prims        array of primitives (kind + geometry + fill/stroke)
 * @param opts.cx,opts.cy   symbol CENTRE, in PDF points (y-up)
 * @param opts.size         symbol box size in PDF points (itemSize * scaleToPt)
 * @param opts.rotationDeg  on-screen rotation (clockwise, as in the editor)
 * @param PDFLib  the imported pdf-lib module ({ rgb, degrees, ... })
 */
export function drawSymbol(page, opts, PDFLib) {
  const { prims, cx, cy, size, rotationDeg = 0 } = opts;
  const { rgb, degrees } = PDFLib;
  const k = size / BOX; // PDF points per local unit

  // pdf-lib's drawSvgPath places SVG (0,0) at the anchor (x,y), draws with the
  // SVG y-axis pointing DOWN, scales uniformly, and rotates the path about the
  // anchor counter-clockwise for a positive angle. On-screen rotation is
  // clockwise, so we negate. To rotate about the symbol CENTRE while anchoring
  // at the local origin, we pre-compute where the origin lands.
  const theta = (-rotationDeg * Math.PI) / 180; // radians, PDF-space
  const cos = Math.cos(theta), sin = Math.sin(theta);

  // Local origin (0,0) sits at (-16,-16) units from the centre. Before rotation
  // that offset in PDF space is (+dx, +dy) with y flipped: (-16k, +16k).
  const ox = -(BOX / 2) * k;            //  x offset of origin from centre (PDF)
  const oy = (BOX / 2) * k;             //  y offset of origin from centre (PDF)
  // Rotate that offset, then place relative to the centre.
  const anchorX = cx + (ox * cos - oy * sin);
  const anchorY = cy + (ox * sin + oy * cos);

  for (const p of prims) {
    const d = primToPath(p);
    if (!d) continue;

    const draw = { x: anchorX, y: anchorY, scale: k, rotate: degrees(rotationDeg) };

    const fill = p.fill && p.fill !== "none" ? p.fill : null;
    const stroke = p.stroke && p.stroke !== "none" ? p.stroke : null;

    // pdf-lib fills black by default when neither colour is set, so we are
    // explicit: a stroke-only path must pass NO fill colour.
    if (fill) draw.color = toRgb(fill, rgb);
    if (stroke) {
      draw.borderColor = toRgb(stroke, rgb);
      draw.borderWidth = (p.strokeWidth ?? 1.5) * k;
      if (p.strokeDasharray) draw.borderDashArray = p.strokeDasharray.map((n) => n * k);
    }
    // Guard: if a primitive somehow has neither, skip rather than fill black.
    if (!fill && !stroke) continue;

    page.drawSvgPath(d, draw);
  }
}

// "#rrggbb" -> pdf-lib rgb()
export function toRgb(hex, rgb) {
  let h = (hex || "#000000").replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}
