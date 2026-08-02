/* ============================================================================
 * symbolPdf.js — draw a 32-unit symbol as TRUE VECTOR into a pdf-lib page.
 * ========================================================================= */

const BOX = 48; // symbol viewBox is 0 0 48 48 (matches lib/symbols.jsx)

function primToPath(p) {
  switch (p.kind) {
    case "path":
      return p.d;
    case "line":
      return `M ${p.x1} ${p.y1} L ${p.x2} ${p.y2}`;
    case "rect": {
      const { x, y, w, h } = p;
      let rx = Math.abs(p.rx || 0), ry = Math.abs(p.ry || 0);
      if (rx && !ry) ry = rx;
      if (ry && !rx) rx = ry;
      rx = Math.min(rx, Math.abs(w) / 2);
      ry = Math.min(ry, Math.abs(h) / 2);
      if (!rx || !ry) return `M ${x} ${y} h ${w} v ${h} h ${-w} Z`;
      return (
        `M ${x + rx} ${y}` +
        ` h ${w - 2 * rx}` +
        ` a ${rx} ${ry} 0 0 1 ${rx} ${ry}` +
        ` v ${h - 2 * ry}` +
        ` a ${rx} ${ry} 0 0 1 ${-rx} ${ry}` +
        ` h ${-(w - 2 * rx)}` +
        ` a ${rx} ${ry} 0 0 1 ${-rx} ${-ry}` +
        ` v ${-(h - 2 * ry)}` +
        ` a ${rx} ${ry} 0 0 1 ${rx} ${-ry}` +
        ` Z`
      );
    }
    case "circle": {
      const { cx, cy, r } = p;
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

export function drawSymbol(page, opts, PDFLib) {
  const { prims, cx, cy, size, rotationDeg = 0 } = opts;
  const { rgb, degrees } = PDFLib;
  const k = size / BOX;

  const theta = (-rotationDeg * Math.PI) / 180;
  const cos = Math.cos(theta), sin = Math.sin(theta);

  const ox = -(BOX / 2) * k;
  const oy = (BOX / 2) * k;
  const anchorX = cx + (ox * cos - oy * sin);
  const anchorY = cy + (ox * sin + oy * cos);

  for (const p of prims) {
    const d = primToPath(p);
    if (!d) continue;

    const draw = { x: anchorX, y: anchorY, scale: k, rotate: degrees(-rotationDeg) };

    const fill = p.fill && p.fill !== "none" ? p.fill : null;
    const stroke = p.stroke && p.stroke !== "none" ? p.stroke : null;

    if (fill) {
      draw.color = toRgb(fill, rgb);
      if (p.fillOpacity != null && p.fillOpacity < 1) draw.opacity = p.fillOpacity;
    }
    if (stroke) {
      draw.borderColor = toRgb(stroke, rgb);
      draw.borderWidth = (p.strokeWidth ?? 1.5) * k;
      if (p.strokeOpacity != null && p.strokeOpacity < 1) draw.borderOpacity = p.strokeOpacity;
      if (p.strokeDasharray) draw.borderDashArray = p.strokeDasharray.map((n) => n * k);
    }
    if (!fill && !stroke) continue;

    page.drawSvgPath(d, draw);
  }
}

export function toRgb(hex, rgb) {
  let h = (hex || "#000000").replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}


