"use client";

/* ============================================================================
 * components/cad/CadSketch.jsx - read-only CAD floor-plan preview (stage 2).
 *
 * Renders a Drawing (the sample plan for now) as proper CAD linework - double
 * line walls with poche, door swing arcs, multi-line windows, dimension
 * strings, room labels, stairs, boundary, grid - with pan + zoom. Strokes use
 * vector-effect:non-scaling-stroke so weights stay constant at any zoom.
 *
 * Drawing tools / selection arrive in later stages; this stage proves the look.
 * ========================================================================= */

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  T_EXT, T_INT, wallPoly, wallFaces, ptStr, hyp, fmtMM, SAMPLE_PLAN,
} from "@/lib/cad/plan";

const SHEET = { x: -2500, y: -2600, w: 12200, h: 12600 };
const SCALE_MIN = 0.02, SCALE_MAX = 0.6;

// ------------------------- node renderers -------------------------
function WallNode({ s }) {
  const t = s.type === "external" ? T_EXT : T_INT;
  const sw = s.type === "external" ? 1.4 : 1.1;
  return (
    <g>
      <polygon points={ptStr(wallPoly(s, t))} className="cadv-poche" stroke="none" />
      {wallFaces(s, t).map((f, i) => (
        <line key={i} x1={f[0][0]} y1={f[0][1]} x2={f[1][0]} y2={f[1][1]}
          className="cadv-ink" strokeWidth={sw} vectorEffect="non-scaling-stroke" strokeLinecap="square" />
      ))}
    </g>
  );
}

function DoorNode({ d }) {
  const { x, y, w, t } = d;
  const els = [];
  if (d.dir === "h") {
    els.push(<rect key="e" x={x - w / 2} y={y - t / 2} width={w} height={t} className="cadv-paper" stroke="none" />);
    els.push(<line key="j1" x1={x - w / 2} y1={y - t / 2} x2={x - w / 2} y2={y + t / 2} className="cadv-ink" strokeWidth={1.1} vectorEffect="non-scaling-stroke" />);
    els.push(<line key="j2" x1={x + w / 2} y1={y - t / 2} x2={x + w / 2} y2={y + t / 2} className="cadv-ink" strokeWidth={1.1} vectorEffect="non-scaling-stroke" />);
    const hx = x + d.hinge * w / 2, ex = hx, ey = y + d.fold * w, lx = x - d.hinge * w / 2;
    els.push(<line key="lf" x1={hx} y1={y} x2={ex} y2={ey} className="cadv-ink" strokeWidth={1.1} vectorEffect="non-scaling-stroke" />);
    const sweep = (d.hinge * d.fold > 0) ? 1 : 0;
    els.push(<path key="ar" d={`M${ex} ${ey} A${w} ${w} 0 0 ${sweep} ${lx} ${y}`} className="cadv-ink" fill="none" strokeWidth={0.9} vectorEffect="non-scaling-stroke" opacity={0.85} />);
  } else {
    els.push(<rect key="e" x={x - t / 2} y={y - w / 2} width={t} height={w} className="cadv-paper" stroke="none" />);
    els.push(<line key="j1" x1={x - t / 2} y1={y - w / 2} x2={x + t / 2} y2={y - w / 2} className="cadv-ink" strokeWidth={1.1} vectorEffect="non-scaling-stroke" />);
    els.push(<line key="j2" x1={x - t / 2} y1={y + w / 2} x2={x + t / 2} y2={y + w / 2} className="cadv-ink" strokeWidth={1.1} vectorEffect="non-scaling-stroke" />);
    const hy = y + d.hinge * w / 2, ey2 = hy, ex2 = x + d.fold * w, ly = y - d.hinge * w / 2;
    els.push(<line key="lf" x1={x} y1={hy} x2={ex2} y2={ey2} className="cadv-ink" strokeWidth={1.1} vectorEffect="non-scaling-stroke" />);
    const sweep2 = (d.hinge * d.fold > 0) ? 0 : 1;
    els.push(<path key="ar" d={`M${ex2} ${ey2} A${w} ${w} 0 0 ${sweep2} ${x} ${ly}`} className="cadv-ink" fill="none" strokeWidth={0.9} vectorEffect="non-scaling-stroke" opacity={0.85} />);
  }
  return <g>{els}</g>;
}

function WindowNode({ wn }) {
  const { x, y, w, t } = wn, g6 = t / 6, els = [];
  if (wn.dir === "h") {
    els.push(<rect key="e" x={x - w / 2} y={y - t / 2} width={w} height={t} className="cadv-paper" stroke="none" />);
    [-t / 2, -g6, g6, t / 2].forEach((oy, i) =>
      els.push(<line key={"g" + i} x1={x - w / 2} y1={y + oy} x2={x + w / 2} y2={y + oy} className="cadv-ink" strokeWidth={i === 0 || i === 3 ? 1.1 : 0.8} vectorEffect="non-scaling-stroke" />));
    els.push(<line key="j1" x1={x - w / 2} y1={y - t / 2} x2={x - w / 2} y2={y + t / 2} className="cadv-ink" strokeWidth={1.1} vectorEffect="non-scaling-stroke" />);
    els.push(<line key="j2" x1={x + w / 2} y1={y - t / 2} x2={x + w / 2} y2={y + t / 2} className="cadv-ink" strokeWidth={1.1} vectorEffect="non-scaling-stroke" />);
  } else {
    els.push(<rect key="e" x={x - t / 2} y={y - w / 2} width={t} height={w} className="cadv-paper" stroke="none" />);
    [-t / 2, -g6, g6, t / 2].forEach((ox, i) =>
      els.push(<line key={"g" + i} x1={x + ox} y1={y - w / 2} x2={x + ox} y2={y + w / 2} className="cadv-ink" strokeWidth={i === 0 || i === 3 ? 1.1 : 0.8} vectorEffect="non-scaling-stroke" />));
    els.push(<line key="j1" x1={x - t / 2} y1={y - w / 2} x2={x + t / 2} y2={y - w / 2} className="cadv-ink" strokeWidth={1.1} vectorEffect="non-scaling-stroke" />);
    els.push(<line key="j2" x1={x - t / 2} y1={y + w / 2} x2={x + t / 2} y2={y + w / 2} className="cadv-ink" strokeWidth={1.1} vectorEffect="non-scaling-stroke" />);
  }
  if (wn.escape) {
    const ty = wn.dir === "h" ? (y < 1000 ? y + 620 : y - 620) : y;
    els.push(<text key="esc" x={wn.dir === "h" ? x : x + (x < 1000 ? 700 : -700)} y={ty} className="cadv-note" fontSize={150} textAnchor="middle">ESCAPE WINDOW</text>);
  }
  return <g>{els}</g>;
}

function DimNode({ d }) {
  const crit = d.critical, lineCls = crit ? "cadv-dim-crit" : "cadv-dim";
  const txtCls = "cadv-dim-txt" + (crit ? " crit" : "");
  const len = Math.round(hyp(d.x2 - d.x1, d.y2 - d.y1));
  const gap = 120, over = 160, tick = 130, fs = 185, els = [];
  if (d.side === "top" || d.side === "bottom") {
    const dy = d.side === "top" ? Math.min(d.y1, d.y2) - d.off : Math.max(d.y1, d.y2) + d.off;
    els.push(<line key="e1" x1={d.x1} y1={d.y1 + (d.side === "top" ? -gap : gap)} x2={d.x1} y2={dy + (d.side === "top" ? -over : over)} className={lineCls} strokeWidth={0.7} vectorEffect="non-scaling-stroke" />);
    els.push(<line key="e2" x1={d.x2} y1={d.y2 + (d.side === "top" ? -gap : gap)} x2={d.x2} y2={dy + (d.side === "top" ? -over : over)} className={lineCls} strokeWidth={0.7} vectorEffect="non-scaling-stroke" />);
    els.push(<line key="dl" x1={d.x1} y1={dy} x2={d.x2} y2={dy} className={lineCls} strokeWidth={0.9} vectorEffect="non-scaling-stroke" />);
    [d.x1, d.x2].forEach((px, k) =>
      els.push(<line key={"t" + k} x1={px - tick} y1={dy + tick} x2={px + tick} y2={dy - tick} className={lineCls} strokeWidth={0.9} vectorEffect="non-scaling-stroke" />));
    els.push(<text key="tx" x={(d.x1 + d.x2) / 2} y={dy - 70} className={txtCls} fontSize={fs} textAnchor="middle">{fmtMM(len)}</text>);
  } else {
    const dx = d.side === "left" ? Math.min(d.x1, d.x2) - d.off : Math.max(d.x1, d.x2) + d.off;
    els.push(<line key="e1" x1={d.x1 + (d.side === "left" ? -gap : gap)} y1={d.y1} x2={dx + (d.side === "left" ? -over : over)} y2={d.y1} className={lineCls} strokeWidth={0.7} vectorEffect="non-scaling-stroke" />);
    els.push(<line key="e2" x1={d.x2 + (d.side === "left" ? -gap : gap)} y1={d.y2} x2={dx + (d.side === "left" ? -over : over)} y2={d.y2} className={lineCls} strokeWidth={0.7} vectorEffect="non-scaling-stroke" />);
    els.push(<line key="dl" x1={dx} y1={d.y1} x2={dx} y2={d.y2} className={lineCls} strokeWidth={0.9} vectorEffect="non-scaling-stroke" />);
    [d.y1, d.y2].forEach((py, k) =>
      els.push(<line key={"t" + k} x1={dx - tick} y1={py + tick} x2={dx + tick} y2={py - tick} className={lineCls} strokeWidth={0.9} vectorEffect="non-scaling-stroke" />));
    els.push(<text key="tx" x={dx - 70} y={(d.y1 + d.y2) / 2} className={txtCls} fontSize={fs} textAnchor="middle" transform={`rotate(-90 ${dx - 70} ${(d.y1 + d.y2) / 2})`}>{fmtMM(len)}</text>);
  }
  return <g>{els}</g>;
}

function StairNode({ s }) {
  const els = [], step = s.h / s.treads, cx = s.x + s.w / 2;
  els.push(<rect key="box" x={s.x} y={s.y} width={s.w} height={s.h} fill="none" className="cadv-ink" strokeWidth={1} vectorEffect="non-scaling-stroke" />);
  for (let k = 1; k < s.treads; k++)
    els.push(<line key={"tr" + k} x1={s.x} y1={s.y + k * step} x2={s.x + s.w} y2={s.y + k * step} className="cadv-ink" strokeWidth={0.7} vectorEffect="non-scaling-stroke" opacity={0.8} />);
  els.push(<line key="al" x1={cx} y1={s.y + s.h - 250} x2={cx} y2={s.y + 250} className="cadv-ink" strokeWidth={1} vectorEffect="non-scaling-stroke" />);
  els.push(<path key="ah" d={`M${cx - 140} ${s.y + 520} L${cx} ${s.y + 250} L${cx + 140} ${s.y + 520}`} fill="none" className="cadv-ink" strokeWidth={1} vectorEffect="non-scaling-stroke" />);
  els.push(<text key="up" x={cx + 360} y={s.y + s.h / 2} className="cadv-note" fontSize={165} textAnchor="middle" transform={`rotate(-90 ${cx + 360} ${s.y + s.h / 2})`}>{"UP  " + s.treads + " RISERS"}</text>);
  return <g>{els}</g>;
}

function Tag({ refTxt, x, y }) {
  return (
    <g>
      <rect x={x - 195} y={y - 130} width={390} height={250} rx={26} fill="#FFFFFF" className="cadv-ink" strokeWidth={0.8} vectorEffect="non-scaling-stroke" opacity={0.92} />
      <text x={x} y={y + 50} className="cadv-tag-txt" fontSize={145} textAnchor="middle" fontWeight={600}>{refTxt}</text>
    </g>
  );
}

// ------------------------- main screen -------------------------
export default function CadSketch({ drawing = SAMPLE_PLAN, title = "Maple House \u2014 First floor", ref: codeRef = "PW-0247" }) {
  const router = useRouter();
  const wrapRef = useRef(null);
  const svgRef = useRef(null);
  const drag = useRef(null);
  const [view, setView] = useState({ s: 0.08, tx: 200, ty: 200 });
  const [size, setSize] = useState({ w: 900, h: 600 });

  const fit = useCallback((sz) => {
    sz = sz || size;
    const pad = 80;
    const planX0 = -2300, planY0 = -2300;
    const planW = (drawing.EXTENT?.w || 8400) + 3400, planH = (drawing.EXTENT?.h || 8800) + 3000;
    const s = Math.min((sz.w - pad * 2) / planW, (sz.h - pad * 2) / planH);
    setView({ s, tx: (sz.w - planW * s) / 2 - planX0 * s, ty: (sz.h - planH * s) / 2 - planY0 * s });
  }, [drawing, size]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => { const r = el.getBoundingClientRect(); const sz = { w: r.width, h: r.height }; setSize(sz); return sz; };
    fit(measure());
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Native non-passive wheel listener so we can zoom toward the cursor.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e) => {
      e.preventDefault();
      const r = svg.getBoundingClientRect();
      setView((v) => {
        const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
        const ns = Math.max(SCALE_MIN, Math.min(SCALE_MAX, v.s * factor));
        const cxp = e.clientX - r.left, cyp = e.clientY - r.top;
        const wx = (cxp - v.tx) / v.s, wy = (cyp - v.ty) / v.s;
        return { s: ns, tx: cxp - wx * ns, ty: cyp - wy * ns };
      });
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, []);

  const onPointerDown = (e) => { drag.current = { x: e.clientX, y: e.clientY }; svgRef.current?.setPointerCapture?.(e.pointerId); };
  const onPointerMove = (e) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x, dy = e.clientY - drag.current.y;
    drag.current = { x: e.clientX, y: e.clientY };
    setView((v) => ({ ...v, tx: v.tx + dx, ty: v.ty + dy }));
  };
  const onPointerUp = () => { drag.current = null; };

  const zoomBy = (factor) => setView((v) => {
    const ns = Math.max(SCALE_MIN, Math.min(SCALE_MAX, v.s * factor));
    const cxp = size.w / 2, cyp = size.h / 2;
    const wx = (cxp - v.tx) / v.s, wy = (cyp - v.ty) / v.s;
    return { s: ns, tx: cxp - wx * ns, ty: cyp - wy * ns };
  });

  const planEls = useMemo(() => {
    const g = [];
    g.push(<rect key="sheet" x={SHEET.x} y={SHEET.y} width={SHEET.w} height={SHEET.h} className="cadv-paper" stroke="none" />);
    const grid = [];
    for (let gx = SHEET.x; gx <= SHEET.x + SHEET.w; gx += 500) {
      const maj = gx % 1000 === 0;
      grid.push(<line key={"gx" + gx} x1={gx} y1={SHEET.y} x2={gx} y2={SHEET.y + SHEET.h} className={maj ? "cadv-grid-major" : "cadv-grid-minor"} strokeWidth={maj ? 0.8 : 0.5} vectorEffect="non-scaling-stroke" />);
    }
    for (let gy = SHEET.y; gy <= SHEET.y + SHEET.h; gy += 500) {
      const maj = gy % 1000 === 0;
      grid.push(<line key={"gy" + gy} x1={SHEET.x} y1={gy} x2={SHEET.x + SHEET.w} y2={gy} className={maj ? "cadv-grid-major" : "cadv-grid-minor"} strokeWidth={maj ? 0.8 : 0.5} vectorEffect="non-scaling-stroke" />);
    }
    g.push(<g key="grid">{grid}</g>);
    if (drawing.boundary) g.push(<polyline key="bnd" points={ptStr(drawing.boundary)} className="cadv-boundary" fill="none" strokeWidth={1.4} strokeDasharray="14 10" vectorEffect="non-scaling-stroke" />);
    (drawing.rooflights || []).forEach((rl) => g.push(
      <g key={rl.ref}>
        <rect x={rl.x} y={rl.y} width={rl.w} height={rl.h} fill="none" className="cadv-ink" strokeWidth={0.8} strokeDasharray="20 14" vectorEffect="non-scaling-stroke" opacity={0.6} />
        <text x={rl.x + rl.w / 2} y={rl.y + rl.h / 2} className="cadv-note" fontSize={150} textAnchor="middle" fontWeight={600}>{rl.ref}</text>
      </g>));
    g.push(<g key="walls">{drawing.walls.map((s) => <WallNode key={s.id} s={s} />)}</g>);
    g.push(<g key="doors">{drawing.doors.map((d) => <DoorNode key={d.id} d={d} />)}</g>);
    g.push(<g key="wins">{drawing.windows.map((wn) => <WindowNode key={wn.id} wn={wn} />)}</g>);
    if (drawing.stairs) g.push(<StairNode key="stairs" s={drawing.stairs} />);
    g.push(<g key="dims">{drawing.dims.map((d) => <DimNode key={d.id} d={d} />)}</g>);
    g.push(<g key="rooms">{drawing.rooms.map((r, i) => (
      <g key={"room" + i} className="cadv-room">
        <text x={r.x} y={r.y} className="nm" fontSize={230} textAnchor="middle">{r.name.toUpperCase()}</text>
        {r.area ? <text x={r.x} y={r.y + 300} className="ar" fontSize={165} textAnchor="middle">{r.area.toFixed(1) + " m\u00B2"}</text> : null}
      </g>))}</g>);
    const tags = [];
    drawing.doors.forEach((d) => { if (d.ref) tags.push(<Tag key={"tg" + d.id} refTxt={d.ref} x={d.x + (d.dir === "h" ? 0 : d.fold * 430)} y={d.y + (d.dir === "h" ? d.fold * 430 : 0)} />); });
    drawing.windows.forEach((w) => { if (w.ref) tags.push(<Tag key={"tg" + w.id} refTxt={w.ref} x={w.x + (w.dir === "h" ? 0 : (w.x < 1000 ? 430 : -430))} y={w.y + (w.dir === "h" ? (w.y < 1000 ? 360 : -360) : 0)} />); });
    g.push(<g key="tags">{tags}</g>);
    return g;
  }, [drawing]);

  return (
    <div className="cadv">
      <style>{CSS}</style>
      <div className="cadv__top">
        <button className="cadv__back" onClick={() => router.push("/")} title="Back to dashboard">&#8249;</button>
        <div className="cadv__title">
          <div className="name">{title}</div>
          <div className="sub">{codeRef} &#183; Sketch preview &#183; 1:50 @ A3</div>
        </div>
        <div className="cadv__badge">Preview &#8212; drawing tools coming next</div>
      </div>
      <div className="cadv__workspace" ref={wrapRef}>
        <svg
          ref={svgRef}
          className="cadv__svg"
          width="100%" height="100%"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <g transform={`translate(${view.tx} ${view.ty}) scale(${view.s})`}>{planEls}</g>
        </svg>
        <div className="cadv__zoom">
          <button onClick={() => zoomBy(1.2)} title="Zoom in">+</button>
          <button onClick={() => zoomBy(1 / 1.2)} title="Zoom out">&#8722;</button>
          <button onClick={() => fit()} title="Zoom to fit">&#10530;</button>
        </div>
        <div className="cadv__chip">
          <span className="north">N &#8593;</span>
          <span className="bar"><i /><i className="alt" /><i /></span>
          <span>0 1 2 m</span>
        </div>
      </div>
    </div>
  );
}

const CSS = `
.cadv{position:absolute; inset:0; display:flex; flex-direction:column; background:#fff; font-family:'Inter',system-ui,sans-serif; overflow:hidden}
.cadv *{box-sizing:border-box}
.cadv__top{display:flex; align-items:center; gap:12px; padding:0 14px; height:56px; border-bottom:1px solid rgba(44,62,80,.1); flex:0 0 auto; background:#fff}
.cadv__back{width:36px; height:36px; border:1px solid rgba(44,62,80,.12); background:#fff; border-radius:9px; font-size:20px; line-height:1; color:#3E4C59; cursor:pointer}
.cadv__back:hover{background:#F4F6F9}
.cadv__title .name{font-family:'Space Grotesk',sans-serif; font-weight:600; font-size:15px; color:#18222D}
.cadv__title .sub{font-family:'JetBrains Mono',monospace; font-size:11px; color:#6E7B88}
.cadv__badge{margin-left:auto; font-family:'JetBrains Mono',monospace; font-size:10px; letter-spacing:.08em; text-transform:uppercase; color:#1C6F7C; background:rgba(63,183,201,.12); border:1px solid rgba(63,183,201,.25); border-radius:999px; padding:5px 11px}
.cadv__workspace{flex:1; position:relative; min-width:0; overflow:hidden; background:radial-gradient(120% 120% at 50% 0%, #243443 0%, #18222D 100%)}
.cadv__svg{position:absolute; inset:0; width:100%; height:100%; display:block; cursor:grab; touch-action:none}
.cadv__svg:active{cursor:grabbing}
.cadv-ink{stroke:#16212B}
.cadv-poche{fill:#C9D0D8}
.cadv-paper{fill:#FFFFFF}
.cadv-grid-minor{stroke:#93C7D0; opacity:.16}
.cadv-grid-major{stroke:#93C7D0; opacity:.30}
.cadv-dim{stroke:#2C3E50}
.cadv-dim-crit{stroke:#C4564B}
.cadv-boundary{stroke:#38B24A}
.cadv-dim-txt{font-family:'JetBrains Mono',monospace; fill:#2C3E50}
.cadv-dim-txt.crit{fill:#C4564B}
.cadv-room{font-family:'JetBrains Mono',monospace; fill:#2C3E50}
.cadv-room .nm{font-weight:600; letter-spacing:.08em}
.cadv-room .ar{fill:#6E7B88}
.cadv-tag-txt{font-family:'JetBrains Mono',monospace; fill:#16212B}
.cadv-note{font-family:'JetBrains Mono',monospace; fill:#54616E}
.cadv__zoom{position:absolute; right:16px; bottom:16px; display:flex; flex-direction:column; background:#fff; border:1px solid rgba(44,62,80,.1); border-radius:12px; overflow:hidden; box-shadow:0 6px 16px rgba(20,33,46,.09)}
.cadv__zoom button{width:38px; height:38px; border:0; background:#fff; color:#3E4C59; font-size:17px; cursor:pointer}
.cadv__zoom button:hover{background:#F4F6F9; color:#18222D}
.cadv__zoom button+button{border-top:1px solid rgba(44,62,80,.1)}
.cadv__chip{position:absolute; left:16px; bottom:16px; display:flex; align-items:center; gap:12px; background:rgba(255,255,255,.92); border:1px solid rgba(44,62,80,.1); border-radius:10px; padding:8px 12px; font-family:'JetBrains Mono',monospace; font-size:11px; color:#54616E}
.cadv__chip .north{color:#3E4C59; font-weight:600}
.cadv__chip .bar{display:inline-flex; height:6px; border:1px solid #6E7B88}
.cadv__chip .bar i{width:20px; height:100%; background:#3E4C59}
.cadv__chip .bar i.alt{background:#fff}
`;
