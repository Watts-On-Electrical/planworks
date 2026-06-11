"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Upload, Trash2, Save, FolderOpen, Download, Undo2, Redo2,
  MousePointer2, Cable, RotateCw, ZoomIn, ZoomOut, Maximize2,
  Palette as PaletteIcon, Ruler, Hand, Type, Printer, Settings, Search, Sun, Moon, Mail,
  ChevronRight, ChevronLeft, X, FileText, PanelLeftClose, PanelLeftOpen,
  Grid3x3, ClipboardList, Plus, Clock, LayoutPanelTop, ImagePlus,
} from "lucide-react";
import {
  SYMBOLS, SYMBOL_META, CATEGORY_COLOURS, VIEWBOX,
  findSymbol, findCategory, resolveColours,
  getPaletteSymbols, getPaletteGroups,
} from "@/lib/symbols.jsx";
import { useApp } from "@/components/AppShell";
import { DEFAULT_TITLEBLOCK, resizeImageToDataUrl } from "@/lib/titleBlock";

/* ============================================================================
 * The sheet model
 * Re-declared here so this file is self-contained. Must match the values
 * in ElectricalPlanTool.jsx.
 * ========================================================================= */
const SHEET = {
  width: 1587,
  height: 1123,
  margin: 18,
  legendWidth: 230,
  notesWidth: 280,
  titleHeight: 110,
};

const TOOLS = {
  select: { icon: MousePointer2, label: "Select", hint: "V" },
  pan:    { icon: Hand,          label: "Pan",    hint: "H" },
  wire:   { icon: Cable,         label: "Wire",   hint: "W" },
  note:   { icon: Type,          label: "Note",   hint: "N" },
};

/* ============================================================================
 * TOP BAR
 * ========================================================================= */
export function TopBar({
  meta, onHome, theme, onToggleTheme, onShowMeta, onImport, onUndo, onRedo, onSave, savedFlash, onShowProjects,
  onExportJSON, onPrint, colourMode, onToggleColour, onNormalise, normaliseFlash,
  snapEnabled, onToggleSnap, onShowBoq, onShowTitleBlock,
  sidebarHidden, onToggleSidebar,
}) {
  const projectLabel = meta.projectName || "Untitled Project";
  const sheetLabel = meta.sheetName || "Drawing";
  return (
    <header className="relative z-30 flex items-center justify-between px-4 h-12 bg-white dark:bg-[#16202B] border-b border-slate-200 dark:border-[#263441]">
      <div className="flex items-center gap-3 min-w-0">
        {onHome && (
          <>
            <button onClick={onHome} title="Back to dashboard"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-[11px] font-medium">
              <ChevronLeft size={14}/> Dashboard
            </button>
            <div className="w-px h-5 bg-slate-200 dark:bg-[#2A3947]"/>
          </>
        )}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[15px] tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Plan<span className="text-[#2C97A8]">.</span>Works
          </span>
        </div>
        <div className="w-px h-5 bg-slate-200 dark:bg-[#2A3947]"/>
        <button
          onClick={onShowMeta}
          className="group flex items-center gap-2 px-2.5 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-white/10 transition-colors min-w-0">
          <FileText size={12} className="text-slate-500 dark:text-slate-400 group-hover:text-slate-700 shrink-0"/>
          <div className="text-left min-w-0">
            <div className="text-[11px] font-medium text-slate-800 dark:text-slate-200 truncate max-w-[200px]">{projectLabel}</div>
            <div className="text-[9px] text-slate-500 dark:text-slate-400 tracking-wider uppercase truncate max-w-[200px]">{sheetLabel}</div>
          </div>
          <ChevronRight size={11} className="text-slate-400 group-hover:text-slate-600 shrink-0"/>
        </button>
      </div>

      <div className="flex items-center gap-1">
        <ToolbarButton onClick={onImport} icon={Upload} label="Import" primary/>
        <Divider />
        <ToolbarButton onClick={onUndo} icon={Undo2} label="Undo" hint="⌘Z"/>
        <ToolbarButton onClick={onRedo} icon={Redo2} label="Redo" hint="⌘⇧Z"/>
        <Divider />
        <ToolbarButton
          onClick={onToggleColour} icon={PaletteIcon}
          label={colourMode === "red" ? "PB Red" : colourMode === "colour" ? "Colour" : "Mono"}
          active={colourMode === "red"}/>
        <ToolbarButton onClick={onNormalise} icon={Ruler}
          label={normaliseFlash ? "Reset ✓" : "Reset sizes"} flash={normaliseFlash}
          hint="Make all symbols the same size"/>
        <ToolbarButton onClick={onToggleSnap} icon={Grid3x3} label="Grid" active={snapEnabled}/>
        <Divider />
        <ToolbarButton onClick={onSave} icon={Save} label={savedFlash ? "Saved ✓" : "Save"} flash={savedFlash} hint="⌘S"/>
        <ToolbarButton onClick={onShowProjects} icon={FolderOpen} label="Projects"/>
        <ToolbarButton onClick={onShowBoq} icon={ClipboardList} label="BOQ"/>
        <ToolbarButton onClick={onShowTitleBlock} icon={LayoutPanelTop} label="Title block"/>
        <ToolbarButton onClick={onExportJSON} icon={Download} label="JSON"/>
        <ToolbarButton onClick={onPrint} icon={Printer} label="Print" hint="⌘P" primary/>
        <Divider />
        <ToolbarButton
          onClick={onToggleSidebar}
          icon={sidebarHidden ? PanelLeftOpen : PanelLeftClose}
          label={sidebarHidden ? "Show" : "Hide"}
          hint=""/>
        {onToggleTheme && (
          <>
            <Divider />
            <button onClick={onToggleTheme}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-colors">
              {theme === "dark" ? <Sun size={15}/> : <Moon size={15}/>}
            </button>
          </>
        )}
      </div>
    </header>
  );
}

function ToolbarButton({ onClick, icon: Icon, label, primary, active, hint, flash }) {
  return (
    <button onClick={onClick}
      title={hint ? `${label} (${hint})` : label}
      className={`px-3 py-2 text-[11px] uppercase tracking-wide font-semibold flex items-center gap-2 rounded-lg transition-all duration-150 ${
        primary
          ? "bg-[#3FB7C9] text-[#08313a] hover:bg-[#52C4D5] shadow-[#3FB7C9]/30 shadow-md"
          : flash
          ? "bg-emerald-500 text-white"
          : active
          ? "bg-[#3FB7C9]/15 text-[#1C6E7B] ring-1 ring-[#3FB7C9]/45"
          : "bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/20 hover:text-slate-900 dark:hover:text-white"
      }`}>
      <Icon size={15} /> <span>{label}</span>
    </button>
  );
}

function Divider() { return <div className="w-px h-5 bg-slate-200 dark:bg-[#2A3947] mx-1" />; }

/* ============================================================================
 * SHEET TABS — switch between the drawings (floors) in a project
 * ========================================================================= */
export function SheetTabs({ sheets, activeId, onSwitch, onAdd, onRename, onDelete }) {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState("");

  const startRename = (s) => { setEditingId(s.id); setDraft(s.name); };
  const commit = () => {
    if (editingId && draft.trim()) onRename(editingId, draft.trim());
    setEditingId(null);
  };

  return (
    <div className="flex items-stretch gap-1.5 px-3 h-11 bg-[#2C3E50] border-b border-black/25 shadow-sm shrink-0 overflow-x-auto
                    [&::-webkit-scrollbar]:h-0">
      <div className="flex items-center pr-1 text-[9px] font-medium tracking-wider text-slate-300/75 uppercase shrink-0"
           style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        Drawings
      </div>
      {sheets.map(s => {
        const active = s.id === activeId;
        return (
          <div key={s.id}
            onClick={() => !active && onSwitch(s.id)}
            onDoubleClick={() => startRename(s)}
            title={active ? "Double-click to rename" : "Click to open · double-click to rename"}
            className={`group relative flex items-center gap-2 px-3 my-1.5 rounded-lg cursor-pointer transition-all shrink-0 ${
              active
                ? "bg-white ring-1 ring-[#3FB7C9]/60 shadow-sm text-slate-900"
                : "bg-white/10 hover:bg-white/20 text-slate-200"
            }`}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${active ? "bg-[#3FB7C9]" : "bg-slate-400"}`}/>
            {editingId === s.id ? (
              <input
                autoFocus value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditingId(null); }}
                onClick={(e) => e.stopPropagation()}
                className="text-[12px] font-medium bg-transparent outline-none border-b border-[#3FB7C9] w-24 text-slate-900"/>
            ) : (
              <span className={`text-[12px] whitespace-nowrap ${active ? "font-semibold text-slate-900" : "font-medium"}`}>
                {s.name}
              </span>
            )}
            {sheets.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${s.name}"? This removes that drawing and everything on it.`)) onDelete(s.id); }}
                title="Delete drawing"
                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity shrink-0">
                <X size={12}/>
              </button>
            )}
          </div>
        );
      })}
      <button
        onClick={onAdd}
        title="Add another drawing (e.g. First floor)"
        className="flex items-center gap-1 px-2.5 my-1.5 rounded-lg text-[11px] font-medium text-[#5fd0e0] hover:bg-white/10 transition-colors shrink-0">
        <Plus size={13}/> Add floor
      </button>
    </div>
  );
}

/* ============================================================================
 * PALETTE (left sidebar)
 * ========================================================================= */
export function Palette({ onPaletteDragStart, symbolScale, setSymbolScale, colourMode }) {
  const [query, setQuery] = useState("");
  const groups = useMemo(() => getPaletteGroups(), []);
  const all = useMemo(() => getPaletteSymbols(), []);
  const q = query.trim().toLowerCase();
  const matches = ({ sym, meta }) =>
    (meta?.description || sym.name).toLowerCase().includes(q) ||
    sym.name.toLowerCase().includes(q);
  const searchResults = q ? all.filter(matches) : null;

  const Tile = ({ sym, meta }) => {
    const cols = resolveColours(sym.id, colourMode || "colour");
    const label = meta?.description || sym.name;
    return (
      <div
        draggable
        onDragStart={(e) => onPaletteDragStart(e, sym.id)}
        title={label + (meta?.height ? ` · ${meta.height}` : "")}
        className="group relative bg-white dark:bg-[#22303D] hover:bg-slate-50 dark:hover:bg-[#283643] rounded-xl ring-1 ring-slate-200 dark:ring-[#2A3947] hover:ring-[#3FB7C9]/40 hover:shadow-sm
                   cursor-grab active:cursor-grabbing p-3 flex flex-col items-center gap-2
                   transition-all duration-200 hover:-translate-y-0.5">
        <svg viewBox={VIEWBOX} width="46" height="46"
             style={{ color: cols.body, "--feeder": cols.feeder, filter: `drop-shadow(0 0 5px ${cols.body}30)` }}
             className="relative z-10 transition-transform duration-200 group-hover:scale-110">
          {sym.svg}
        </svg>
        <div className="relative z-10 text-[9px] text-center text-slate-700 dark:text-slate-200 leading-tight font-medium line-clamp-3">{label}</div>
        {meta?.height && (
          <div className="text-[8px] text-slate-500 tabular-nums">{meta.height}</div>
        )}
      </div>
    );
  };

  return (
    <aside className="w-64 bg-[#EBEFF6] dark:bg-[#1A2530] border-r border-slate-200 dark:border-[#263441] flex flex-col">
      <div className="px-4 h-11 flex items-center justify-between bg-[#2C3E50] border-b border-black/25 shadow-sm">
        <div className="text-[15px] font-semibold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Symbols</div>
        <div className="text-[9px] tracking-wider text-slate-300/70 font-medium" style={{ fontFamily: "'JetBrains Mono', monospace" }}>MEP LEGEND</div>
      </div>

      <div className="px-3 py-3 border-b border-slate-200 dark:border-[#263441]">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search symbols…"
            className="w-full pl-9 pr-8 py-2 text-[12.5px] bg-white dark:bg-[#0E141B] rounded-lg ring-1 ring-slate-300 dark:ring-[#2A3947] focus:ring-[#3FB7C9]/50 focus:outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"/>
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
              <X size={13}/>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3
                      [&::-webkit-scrollbar]:w-1.5
                      [&::-webkit-scrollbar-track]:bg-transparent
                      [&::-webkit-scrollbar-thumb]:bg-slate-300/60
                      [&::-webkit-scrollbar-thumb]:rounded-full">
        {searchResults ? (
          searchResults.length ? (
            <div className="grid grid-cols-2 gap-2.5">
              {searchResults.map(({ sym, meta }) => <Tile key={sym.id} sym={sym} meta={meta} />)}
            </div>
          ) : (
            <div className="text-center text-[12px] text-slate-500 py-8">No symbols match “{query}”.</div>
          )
        ) : (
          groups.map((g) => (
            <section key={g.label} className="mb-4 last:mb-1">
              <div className="px-0.5 mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{g.label}</div>
              <div className="grid grid-cols-2 gap-2.5">
                {g.items.map(({ sym, meta }) => <Tile key={sym.id} sym={sym} meta={meta} />)}
              </div>
            </section>
          ))
        )}
      </div>

      <div className="border-t border-slate-200 dark:border-[#263441] px-4 py-3 bg-[#E3EAF3] dark:bg-[#141C24]">
        <div className="flex items-center justify-between mb-1.5">
          <span className="uppercase tracking-wider text-[9px] text-slate-500">Symbol Size</span>
          <span className="tabular-nums text-slate-700 text-[10px]">{Math.round(symbolScale*100)}%</span>
        </div>
        <input type="range" min="0.6" max="2.5" step="0.1" value={symbolScale}
               onChange={(e) => setSymbolScale(parseFloat(e.target.value))}
               className="w-full accent-[#3FB7C9]"/>
      </div>
    </aside>
  );
}

/* ============================================================================
 * WORKSPACE — the dark surround + the sheet inside it
 * ========================================================================= */
export function Workspace({
  viewportRef, drawingAreaRef, pan, zoom,
  meta, notes, updateMeta, updateNotes, onSheetField,
  bgImage, placed, wires, annotations,
  legendItems, colourMode, symbolSize,
  selectedId, selectedAnnoId, wireStart,
  tool, spacePressed, DRAW, showGrid, gridSize,
  onViewportMouseDown, onViewportMouseMove, onViewportMouseUp,
  onDrawingDrop, onDrawingDragOver, onDrawingDragLeave,
  onItemMouseDown, onAnnotationBodyMouseDown, onAnnotationAnchorMouseDown,
  startRotating,
}) {
  return (
    <div
      ref={viewportRef}
      className="absolute inset-0 overflow-hidden"
      style={{
        background: "radial-gradient(circle at 50% 50%, #e2e8f0, #cbd5e1 90%)",
        touchAction: "none",
      }}
      onPointerDown={onViewportMouseDown}
      onPointerMove={onViewportMouseMove}
      onPointerUp={onViewportMouseUp}
      onPointerCancel={onViewportMouseUp}
    >
      {/* Sheet, transformed by pan + zoom */}
      <div style={{
        position: "absolute", top: 0, left: 0,
        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        transformOrigin: "0 0",
        willChange: "transform",
      }}>
        <Sheet
          drawingAreaRef={drawingAreaRef}
          meta={meta} notes={notes}
          updateMeta={updateMeta} updateNotes={updateNotes} onSheetField={onSheetField}
          bgImage={bgImage}
          placed={placed} wires={wires} annotations={annotations}
          legendItems={legendItems}
          colourMode={colourMode}
          symbolSize={symbolSize}
          selectedId={selectedId} selectedAnnoId={selectedAnnoId} wireStart={wireStart}
          tool={tool} spacePressed={spacePressed}
          DRAW={DRAW}
          showGrid={showGrid} gridSize={gridSize}
          zoom={zoom}
          onDrawingDrop={onDrawingDrop}
          onDrawingDragOver={onDrawingDragOver}
          onDrawingDragLeave={onDrawingDragLeave}
          onItemMouseDown={onItemMouseDown}
          onAnnotationBodyMouseDown={onAnnotationBodyMouseDown}
          onAnnotationAnchorMouseDown={onAnnotationAnchorMouseDown}
          startRotating={startRotating}
        />
      </div>
    </div>
  );
}

/* ============================================================================
 * THE SHEET ITSELF — white page rendered at SHEET.width × SHEET.height
 * This is what prints. Layout:
 *   ┌────────────────────────────────────────────────────────┐
 *   │ LEGEND  │  DRAWING AREA              │  NOTES           │
 *   │         │                            │                  │
 *   │         │                            │                  │
 *   │         │                            │                  │
 *   ├─────────┴────────────────────────────┴──────────────────┤
 *   │ TITLE BLOCK                                              │
 *   └──────────────────────────────────────────────────────────┘
 * ========================================================================= */
export function Sheet({
  drawingAreaRef,
  meta, notes, updateMeta, updateNotes, onSheetField,
  bgImage, placed, wires, annotations, legendItems,
  colourMode, symbolSize, selectedId, selectedAnnoId, wireStart,
  tool, spacePressed, DRAW, showGrid, gridSize, zoom,
  onDrawingDrop, onDrawingDragOver, onDrawingDragLeave,
  onItemMouseDown, onAnnotationBodyMouseDown, onAnnotationAnchorMouseDown,
  startRotating,
}) {
  return (
    <div
      data-sheet-bg
      style={{
        width: SHEET.width,
        height: SHEET.height,
        background: "#ffffff",
        color: "#0a0a0a",
        position: "relative",
        boxShadow: "0 20px 50px -12px rgba(15,23,42,0.25), 0 0 0 1px rgba(15,23,42,0.08)",
        fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Sheet border */}
      <div style={{
        position: "absolute",
        left: SHEET.margin, top: SHEET.margin,
        width: SHEET.width - SHEET.margin*2,
        height: SHEET.height - SHEET.margin*2,
        border: "1px solid #0a0a0a",
        pointerEvents: "none",
      }}/>

      {/* LEGEND COLUMN */}
      <LegendColumn legendItems={legendItems} colourMode={colourMode} />

      {/* NOTES COLUMN */}
      <NotesColumn notes={notes} updateNotes={updateNotes} />

      {/* DRAWING AREA */}
      <DrawingArea
        drawingAreaRef={drawingAreaRef}
        DRAW={DRAW}
        bgImage={bgImage}
        placed={placed} wires={wires} annotations={annotations}
        colourMode={colourMode} symbolSize={symbolSize}
        selectedId={selectedId} selectedAnnoId={selectedAnnoId} wireStart={wireStart}
        tool={tool} spacePressed={spacePressed} zoom={zoom}
        showGrid={showGrid} gridSize={gridSize}
        onDrop={onDrawingDrop}
        onDragOver={onDrawingDragOver}
        onDragLeave={onDrawingDragLeave}
        onItemMouseDown={onItemMouseDown}
        onAnnotationBodyMouseDown={onAnnotationBodyMouseDown}
        onAnnotationAnchorMouseDown={onAnnotationAnchorMouseDown}
        startRotating={startRotating}
      />

      {/* TITLE BLOCK */}
      <TitleBlock meta={meta} updateMeta={updateMeta} onSheetField={onSheetField} />
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * SHEET COLUMN HEADER — a bold teal title bar used at the top of the Legend
 * and Notes columns. Bleeds to the column edges (negative margins) so it reads
 * as a section header. Bodies below stay white.
 * ------------------------------------------------------------------------- */
function SheetColumnHeader({ children, padL = 14, padR = 12, padT = 12 }) {
  return (
    <div style={{
      background: "#3FB7C9",
      color: "#08313a",
      fontSize: 11.5,
      fontWeight: 800,
      letterSpacing: "0.09em",
      textTransform: "uppercase",
      padding: "6px 12px 7px",
      margin: `-${padT}px -${padR}px 10px -${padL}px`,
    }}>{children}</div>
  );
}

// Colours offered in the notes formatting toolbar.
const NOTE_COLOURS = [
  { label: "Black", value: "#262626" },
  { label: "Red",   value: "#dc2626" },
  { label: "Teal",  value: "#22808F" },
  { label: "Navy",  value: "#2C3E50" },
  { label: "Amber", value: "#b45309" },
];

const NOTE_FMT_BTN = {
  minWidth: 22, height: 20, padding: "0 5px",
  fontWeight: 700, color: "#334155",
  background: "#fff", border: "1px solid #cbd5e1", borderRadius: 4,
  cursor: "pointer", lineHeight: 1,
  display: "inline-flex", alignItems: "center", justifyContent: "center",
};

// Notes are stored as light HTML. Older plain-text notes are converted on the
// fly (escaped, newlines → <br>).
function notesToHtml(n) {
  if (!n) return "";
  if (/<[a-z!/][\s\S]*>/i.test(n)) return n;
  return n
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
}

// Wrap the current selection (inside rootEl) in a span carrying inline style.
function styleNotesSelection(rootEl, style) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return false;
  const range = sel.getRangeAt(0);
  if (!rootEl || !rootEl.contains(range.commonAncestorContainer)) return false;
  const span = document.createElement("span");
  Object.entries(style).forEach(([k, v]) => { span.style[k] = v; });
  try {
    range.surroundContents(span);
  } catch {
    const frag = range.extractContents();
    span.appendChild(frag);
    range.insertNode(span);
  }
  sel.removeAllRanges();
  return true;
}

/* ----------------------------------------------------------------------------
 * LEGEND COLUMN — auto-generated from placed symbols
 * ------------------------------------------------------------------------- */
function LegendColumn({ legendItems, colourMode }) {
  return (
    <div style={{
      position: "absolute",
      left: SHEET.margin,
      top: SHEET.margin,
      width: SHEET.legendWidth,
      height: SHEET.height - SHEET.margin * 2 - SHEET.titleHeight - 8,
      borderRight: "1px solid #0a0a0a",
      padding: "12px 12px 12px 14px",
      overflow: "hidden",
    }}>
      <SheetColumnHeader padL={14} padR={12} padT={12}>Electrical Legend</SheetColumnHeader>
      <div style={{ fontSize: 8.5, color: "#404040", marginBottom: 10, letterSpacing: "0.06em" }}>
        UK ARCHITECTURAL · TO BE READ IN COLOUR
      </div>

      {legendItems.length === 0 ? (
        <div style={{ fontSize: 10, color: "#737373", fontStyle: "italic", marginTop: 14 }}>
          Place symbols on the drawing — they'll be listed here automatically with mounting heights.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {legendItems.map(({ id, symbol, meta }) => {
            const cols = resolveColours(id, colourMode);
            return (
              <div key={id} style={{
                display: "grid",
                gridTemplateColumns: "26px 1fr",
                alignItems: "center",
                gap: 6,
                padding: "3px 0",
                borderBottom: "0.5px solid #e5e5e5",
              }}>
                <svg viewBox={VIEWBOX} width={22} height={22}
                     style={{ color: cols.body, "--feeder": cols.feeder, flexShrink: 0 }}>
                  {symbol.svg}
                </svg>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 9, fontWeight: 600, color: "#171717", lineHeight: 1.2 }}>
                    {meta.description}
                  </div>
                  {meta.height && (
                    <div style={{ fontSize: 8, color: "#525252", marginTop: 1 }}>
                      {meta.height}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * NOTES COLUMN — editable MEP notes
 * ------------------------------------------------------------------------- */
function NotesColumn({ notes, updateNotes }) {
  const ref = useRef(null);
  const html = notesToHtml(notes);

  // Sync external changes (e.g. switching drawings) into the editor without
  // disturbing the caret while the user is typing.
  useEffect(() => {
    const el = ref.current;
    if (el && document.activeElement !== el && el.innerHTML !== html) {
      el.innerHTML = html;
    }
  }, [html]);

  const pushChange = () => { if (ref.current) updateNotes(ref.current.innerHTML); };
  const apply = (style) => {
    if (styleNotesSelection(ref.current, style)) pushChange();
    ref.current?.focus();
  };

  return (
    <div style={{
      position: "absolute",
      right: SHEET.margin,
      top: SHEET.margin,
      width: SHEET.notesWidth,
      height: SHEET.height - SHEET.margin * 2 - SHEET.titleHeight - 8,
      borderLeft: "1px solid #0a0a0a",
      padding: "12px 14px",
      display: "flex",
      flexDirection: "column",
    }}
      className="no-print-scrollbar"
    >
      <SheetColumnHeader padL={14} padR={14} padT={12}>Notes</SheetColumnHeader>

      {/* Formatting toolbar — never printed. preventDefault keeps the text selection. */}
      <div className="print:hidden"
        onMouseDown={(e) => e.preventDefault()}
        style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8, flexWrap: "wrap" }}>
        <button onClick={() => apply({ fontWeight: "700" })} title="Bold selected text"
          style={{ ...NOTE_FMT_BTN, fontWeight: 800 }}>B</button>
        <button onClick={() => apply({ fontSize: "7px" })} title="Small text" style={{ ...NOTE_FMT_BTN, fontSize: 9 }}>A</button>
        <button onClick={() => apply({ fontSize: "9px" })} title="Normal text" style={{ ...NOTE_FMT_BTN, fontSize: 11 }}>A</button>
        <button onClick={() => apply({ fontSize: "13px" })} title="Large text" style={{ ...NOTE_FMT_BTN, fontSize: 14 }}>A</button>
        <span style={{ width: 1, height: 16, background: "#d4d4d4", margin: "0 2px" }}/>
        {NOTE_COLOURS.map(c => (
          <button key={c.value} onClick={() => apply({ color: c.value })} title={`${c.label} text`}
            style={{ width: 15, height: 15, borderRadius: "50%", background: c.value, border: "1px solid rgba(0,0,0,0.18)", cursor: "pointer", padding: 0 }}/>
        ))}
      </div>

      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={pushChange}
        onBlur={pushChange}
        data-placeholder="Type notes here… select text to format it"
        className="notes-editable"
        style={{
          flex: 1, width: "100%",
          fontSize: 9, color: "#262626",
          outline: "none", lineHeight: 1.5,
          overflow: "auto",
          userSelect: "text",
          WebkitUserSelect: "text",
          cursor: "text",
        }}
      />
      <style>{`.notes-editable:empty:before{content:attr(data-placeholder);color:#9ca3af}`}</style>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * DRAWING AREA — the main canvas where the plan + symbols + annotations live
 * ------------------------------------------------------------------------- */
function DrawingArea({
  drawingAreaRef, DRAW, bgImage, placed, wires, annotations,
  colourMode, symbolSize, selectedId, selectedAnnoId, wireStart, tool, spacePressed,
  zoom, showGrid, gridSize,
  onDrop, onDragOver, onDragLeave,
  onItemMouseDown, onAnnotationBodyMouseDown, onAnnotationAnchorMouseDown,
  startRotating,
}) {
  // Fit the bgImage into the drawing area
  const imageDisplay = useMemo(() => {
    if (!bgImage) return null;
    const scale = Math.min(DRAW.w / bgImage.w, DRAW.h / bgImage.h);
    const w = bgImage.w * scale;
    const h = bgImage.h * scale;
    return {
      x: (DRAW.w - w) / 2,
      y: (DRAW.h - h) / 2,
      w, h,
    };
  }, [bgImage, DRAW.w, DRAW.h]);

  return (
    <div
      ref={drawingAreaRef}
      data-drawing-bg
      style={{
        position: "absolute",
        left: DRAW.x, top: DRAW.y,
        width: DRAW.w, height: DRAW.h,
        background: "#ffffff",
        border: "1px solid #0a0a0a",
        overflow: "hidden",
      }}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
    >
      {!bgImage && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexDirection: "column", gap: 8,
          color: "#a3a3a3", pointerEvents: "none",
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: "#f5f5f5", display: "flex",
            alignItems: "center", justifyContent: "center",
            border: "1px solid #e5e5e5",
          }}>
            <Upload size={18} />
          </div>
          <div style={{ fontSize: 11, color: "#737373", fontWeight: 500 }}>No drawing loaded</div>
          <div style={{ fontSize: 9, color: "#a3a3a3" }}>Click <b>Import</b> or drop a PDF/image here</div>
        </div>
      )}

      {bgImage && imageDisplay && (
        <img src={bgImage.src} alt="plan"
             style={{
               position: "absolute",
               left: imageDisplay.x, top: imageDisplay.y,
               width: imageDisplay.w, height: imageDisplay.h,
               display: "block",
             }}
             draggable={false}/>
      )}

      {/* Grid overlay — drawn above the imported plan, below symbols, so the
          Grid toggle shows alignment lines even when a document is loaded */}
      {showGrid && (
        <div style={{
          position: "absolute", inset: 0,
          pointerEvents: "none",
          backgroundImage:
            `linear-gradient(to right, rgba(37,99,235,0.18) 1px, transparent 1px),` +
            `linear-gradient(to bottom, rgba(37,99,235,0.18) 1px, transparent 1px)`,
          backgroundSize: `${gridSize}px ${gridSize}px`,
        }}/>
      )}

      <svg width={DRAW.w} height={DRAW.h}
           style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none", overflow: "visible" }}>
        {/* Wires */}
        {wires.map(w => {
          const a = placed.find(p => p.id === w.fromId);
          const b = placed.find(p => p.id === w.toId);
          if (!a || !b) return null;
          return (
            <line key={w.id}
              x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke={colourMode === "mono" ? "#0a0a0a" : "#dc2626"}
              strokeWidth={1.2}
              strokeDasharray="6 4"
              strokeLinecap="round"
            />
          );
        })}

        {/* Annotations (leader lines first so they're behind text) */}
        {annotations.map(a => {
          const isSel = a.id === selectedAnnoId;
          const stroke = colourMode === "mono" ? "#0a0a0a" : "#dc2626";
          // Compute leader line endpoints
          const dx = a.anchorX - a.x;
          const dy = a.anchorY - a.y;
          const len = Math.hypot(dx, dy);
          const ux = len > 0 ? dx / len : 0;
          const uy = len > 0 ? dy / len : 0;
          // Start the leader at the edge of the text block
          const startX = a.x + ux * 18;
          const startY = a.y + uy * 6;
          // Arrowhead at the anchor end
          const ah = 6; // size
          const angle = Math.atan2(dy, dx);
          const ax1 = a.anchorX - ah * Math.cos(angle - Math.PI/7);
          const ay1 = a.anchorY - ah * Math.sin(angle - Math.PI/7);
          const ax2 = a.anchorX - ah * Math.cos(angle + Math.PI/7);
          const ay2 = a.anchorY - ah * Math.sin(angle + Math.PI/7);
          return (
            <g key={a.id} style={{ pointerEvents: "none" }}>
              <line x1={startX} y1={startY} x2={a.anchorX} y2={a.anchorY}
                    stroke={stroke} strokeWidth={1.3}/>
              <polygon points={`${a.anchorX},${a.anchorY} ${ax1},${ay1} ${ax2},${ay2}`} fill={stroke}/>
              {isSel && (
                <circle cx={a.anchorX} cy={a.anchorY} r={5}
                        fill="rgba(251,191,36,0.4)" stroke="#d97706" strokeWidth={1}
                        style={{ pointerEvents: "all", cursor: "grab" }}
                        onPointerDown={(e) => onAnnotationAnchorMouseDown(e, a)}/>
              )}
            </g>
          );
        })}

        {/* Symbols */}
        {placed.map(item => {
          const sym = findSymbol(item.symbolId);
          if (!sym) return null;
          const isSel = item.id === selectedId;
          const isWireStart = item.id === wireStart;
          const itemScale = item.scale ?? 1;
          const itemSize = symbolSize * itemScale;
          const half = itemSize / 2;
          const cols = resolveColours(item.symbolId, colourMode);
          const handleOffset = half + 18;
          return (
            <g key={item.id}
               transform={`translate(${item.x - half} ${item.y - half}) rotate(${item.rotation} ${half} ${half})`}>
              {(isSel || isWireStart) && (
                <>
                  <rect x={-6} y={-6} width={itemSize+12} height={itemSize+12} rx={8}
                        fill={isWireStart ? "rgba(251,191,36,0.18)" : "rgba(251,191,36,0.10)"}/>
                  <rect x={-3} y={-3} width={itemSize+6} height={itemSize+6} rx={6}
                        fill="none" stroke="#d97706" strokeWidth={1.2}
                        strokeDasharray={isWireStart ? "4 3" : "none"}/>
                </>
              )}
              {/* Transparent hit area — whole symbol box is clickable, not
                  just the painted strokes. Critical for the wire tool. */}
              <rect x={0} y={0} width={itemSize} height={itemSize} fill="transparent"
                    style={{
                      pointerEvents: "all",
                      cursor: tool === "wire" ? "crosshair" : (tool === "pan" || spacePressed) ? "grab" : "move",
                    }}
                    onPointerDown={(e) => onItemMouseDown(e, item)}/>
              <svg x={0} y={0} width={itemSize} height={itemSize} viewBox={VIEWBOX}
                   style={{
                     color: cols.body, "--feeder": cols.feeder,
                     overflow: "visible", pointerEvents: "none",
                     cursor: tool === "wire" ? "crosshair" : (tool === "pan" || spacePressed) ? "grab" : "move",
                   }}>
                {sym.svg}
              </svg>
              {item.label && (
                <text x={half} y={itemSize + 9} fontSize={9} textAnchor="middle"
                      fill="#171717" fontFamily="ui-sans-serif, system-ui, sans-serif" fontWeight="600"
                      transform={`rotate(${-item.rotation} ${half} ${itemSize + 9})`}>
                  {item.label}
                </text>
              )}
              {isSel && tool === "select" && !spacePressed && (
                <g style={{ pointerEvents: "all", cursor: "grab" }}
                   onPointerDown={(e) => { e.stopPropagation(); try { viewportRef.current?.setPointerCapture?.(e.pointerId); } catch {} startRotating(item.id); }}>
                  <line x1={half} y1={-3} x2={half} y2={-handleOffset+5}
                        stroke="#d97706" strokeWidth={1} strokeDasharray="3 2"/>
                  <circle cx={half} cy={-handleOffset} r={4}
                          fill="#fbbf24" stroke="#fff" strokeWidth={1}/>
                </g>
              )}
            </g>
          );
        })}

        {/* Annotation text blocks (rendered last so they're on top) */}
        {annotations.map(a => {
          const isSel = a.id === selectedAnnoId;
          const stroke = colourMode === "mono" ? "#0a0a0a" : "#dc2626";
          // Wrap text by guessing — split on newlines first, then split long lines
          const lines = a.text.split("\n").flatMap(line => wrapText(line, 22));
          const padding = 4;
          const lineHeight = 11;
          const textW = Math.max(60, ...lines.map(l => estimateWidth(l, 8.5)));
          const textH = lines.length * lineHeight + padding * 2 - 2;
          return (
            <g key={a.id + "-text"}
               style={{ pointerEvents: "all", cursor: "move" }}
               onPointerDown={(e) => onAnnotationBodyMouseDown(e, a)}>
              <rect
                x={a.x - textW/2 - padding}
                y={a.y - textH/2}
                width={textW + padding*2}
                height={textH}
                rx={3}
                fill={isSel ? "rgba(255,255,200,0.95)" : "rgba(255,255,255,0.95)"}
                stroke={isSel ? "#d97706" : stroke}
                strokeWidth={isSel ? 1.2 : 1}
                strokeDasharray="4 2.5"
              />
              {lines.map((line, i) => (
                <text
                  key={i}
                  x={a.x}
                  y={a.y - textH/2 + padding + lineHeight * (i + 1) - 2}
                  fontSize={8.5}
                  textAnchor="middle"
                  fill={stroke}
                  fontWeight={600}
                  fontFamily="ui-sans-serif, system-ui, sans-serif"
                  style={{ pointerEvents: "none" }}
                >{line}</text>
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// Naive text wrapping helpers for SVG annotations
function wrapText(line, maxChars) {
  if (line.length <= maxChars) return [line];
  const words = line.split(" ");
  const out = [];
  let current = "";
  for (const w of words) {
    if ((current + " " + w).trim().length > maxChars) {
      if (current) out.push(current);
      current = w;
    } else {
      current = (current ? current + " " : "") + w;
    }
  }
  if (current) out.push(current);
  return out;
}
function estimateWidth(s, fontSize) {
  return s.length * fontSize * 0.55;
}

/* ----------------------------------------------------------------------------
 * TITLE BLOCK — bottom strip, editable fields
 * ------------------------------------------------------------------------- */
function TitleLogos({ logos, maxWidth = 240 }) {
  const list = (logos || []).filter(Boolean);
  if (!list.length) return <div style={{ width: 6 }} />;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center",
                  gap: 10, padding: "8px 12px", maxWidth }}>
      {list.map((src, i) => (
        <img key={i} src={src} alt="" style={{ height: 40, width: "auto", maxWidth: 120, objectFit: "contain", display: "block" }} />
      ))}
    </div>
  );
}

function TitleDetails({ details }) {
  const list = (details || []).filter(d => d && (d.label || d.value));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {list.map((d, i) => (
        <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 5, lineHeight: 1.15, minWidth: 0 }}>
          {d.label ? (
            <span style={{ fontSize: 7.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "#737373", whiteSpace: "nowrap", flexShrink: 0 }}>{d.label}</span>
          ) : null}
          <span style={{ fontSize: i === 0 ? 13 : 9, fontWeight: i === 0 ? 700 : 500, color: "#0a0a0a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.value}</span>
        </div>
      ))}
    </div>
  );
}

function TitleBlock({ meta, updateMeta, onSheetField }) {
  const setSheet = onSheetField || (() => {});
  const { titleBlock } = useApp();
  const tb = titleBlock || DEFAULT_TITLEBLOCK;
  const left = SHEET.margin;
  const width = SHEET.width - SHEET.margin * 2;
  const top = SHEET.height - SHEET.margin - SHEET.titleHeight;
  return (
    <div style={{
      position: "absolute",
      left, top, width,
      height: SHEET.titleHeight,
      borderTop: "1px solid #0a0a0a",
      display: "grid",
      gridTemplateColumns: "auto 1.5fr 0.9fr 1fr",
      fontSize: 10,
    }}>
      {/* Logos (account template) */}
      <div style={{ borderRight: "1px solid #0a0a0a", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <TitleLogos logos={tb.logos} />
      </div>

      {/* Company details (account template) + project (per drawing) */}
      <div style={{ padding: "10px 14px", borderRight: "1px solid #0a0a0a",
                    display: "flex", flexDirection: "column", justifyContent: "flex-start", gap: 7, overflow: "hidden" }}>
        <TitleDetails details={tb.details} />
        <div>
          <div style={{ fontSize: 8, letterSpacing: "0.15em", color: "#737373" }}>PROJECT</div>
          <EditableField value={meta.projectName} onChange={(v) => updateMeta({ projectName: v })}
                         fontSize={11} weight={600} placeholder="Project name"/>
          <EditableField value={meta.plot} onChange={(v) => updateMeta({ plot: v })}
                         fontSize={9} weight={500} placeholder="Plot / address"/>
        </div>
      </div>

      {/* Middle: sheet info */}
      <div style={{
        padding: "10px 14px",
        borderRight: "1px solid #0a0a0a",
        display: "flex", flexDirection: "column", justifyContent: "flex-start", gap: 9,
      }}>
        <div>
          <div style={{ fontSize: 8, letterSpacing: "0.15em", color: "#737373" }}>SHEET</div>
          <EditableField value={meta.sheetName} onChange={(v) => setSheet({ name: v })}
                         fontSize={12} weight={700} />
        </div>
        <div style={{ display: "flex", gap: 14 }}>
          <div>
            <div style={{ fontSize: 8, letterSpacing: "0.15em", color: "#737373" }}>SCALE</div>
            <EditableField value={meta.scale} onChange={(v) => updateMeta({ scale: v })}
                           fontSize={10} weight={600} />
          </div>
          <div>
            <div style={{ fontSize: 8, letterSpacing: "0.15em", color: "#737373" }}>DATE</div>
            <EditableField value={meta.date} onChange={(v) => updateMeta({ date: v })}
                           fontSize={10} weight={600} />
          </div>
        </div>
      </div>

      {/* Right: drawing number & revision */}
      <div style={{
        padding: "10px 14px",
        display: "grid", gridTemplateColumns: "1fr auto",
        columnGap: 14, rowGap: 6,
      }}>
        <div>
          <div style={{ fontSize: 8, letterSpacing: "0.15em", color: "#737373" }}>DRAWING NO.</div>
          <EditableField value={meta.drawingNumber} onChange={(v) => setSheet({ drawingNumber: v })}
                         fontSize={11} weight={700} placeholder="e.g. WOE-PB-XX-00-D-A-010401"/>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 8, letterSpacing: "0.15em", color: "#737373" }}>REV</div>
          <EditableField value={meta.revision} onChange={(v) => updateMeta({ revision: v })}
                         fontSize={18} weight={800} align="right"/>
        </div>
        <div style={{ gridColumn: "1 / span 2" }}>
          <div style={{ fontSize: 8, letterSpacing: "0.15em", color: "#737373" }}>REVISION NOTE</div>
          <EditableField value={meta.revNote} onChange={(v) => updateMeta({ revNote: v })}
                         fontSize={9} weight={500} placeholder="First issue"/>
        </div>
      </div>
    </div>
  );
}

function EditableField({ value, onChange, fontSize = 10, weight = 500, placeholder, align = "left" }) {
  return (
    <input
      type="text"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        fontSize, fontWeight: weight, color: "#0a0a0a",
        width: "100%", border: "none", background: "transparent",
        padding: 0, outline: "none", textAlign: align,
        fontFamily: "inherit",
      }}
      className="hover:bg-[#ECF8FA]/40 focus:bg-[#ECF8FA] transition-colors duration-150"
    />
  );
}

/* ============================================================================
 * INSPECTOR (right sidebar)
 * ========================================================================= */
export function Inspector({
  selectedItem, selectedAnno,
  updateLabel, updateAnnoText, setRotation, setItemScale,
  rotateSelected, deleteSelected, placed,
}) {
  return (
    <aside className="w-64 bg-[#EBEFF6] dark:bg-[#1A2530] border-l border-slate-200 dark:border-[#263441] flex flex-col">
      <div className="px-4 h-11 flex items-center border-b border-slate-200 dark:border-[#263441]">
        <div className="text-[15px] font-semibold text-slate-900 dark:text-slate-100" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Inspector</div>
      </div>

      {selectedItem ? (
        <SymbolInspector
          item={selectedItem}
          updateLabel={updateLabel}
          setRotation={setRotation}
          setItemScale={setItemScale}
          rotateSelected={rotateSelected}
          deleteSelected={deleteSelected}
        />
      ) : selectedAnno ? (
        <AnnoInspector
          anno={selectedAnno}
          updateAnnoText={updateAnnoText}
          deleteSelected={deleteSelected}
        />
      ) : (
        <EmptyInspector placed={placed} />
      )}
    </aside>
  );
}

function SymbolInspector({ item, updateLabel, setRotation, setItemScale, rotateSelected, deleteSelected }) {
  const sym = findSymbol(item.symbolId);
  const meta = SYMBOL_META[item.symbolId];
  const cols = resolveColours(item.symbolId, "colour");
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4
                    [&::-webkit-scrollbar]:w-1.5
                    [&::-webkit-scrollbar-thumb]:bg-white/10
                    [&::-webkit-scrollbar-thumb]:rounded-full">
      <div>
        <div className="text-[9px] tracking-[0.2em] uppercase text-slate-500 dark:text-slate-400 mb-2">Type</div>
        <div className="flex items-center gap-3">
          <svg viewBox={VIEWBOX} width="44" height="44"
               style={{ color: cols.body, "--feeder": cols.feeder, filter: `drop-shadow(0 0 8px ${cols.body}50)` }}
               className="bg-slate-50 dark:bg-[#22303D] rounded-lg ring-1 ring-slate-200 dark:ring-[#2A3947] p-1.5">
            {sym?.svg}
          </svg>
          <div>
            <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{sym?.name}</div>
            {meta?.height && <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{meta.height}</div>}
          </div>
        </div>
        {meta?.description && (
          <div className="text-[10px] text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">{meta.description}</div>
        )}
      </div>

      <div>
        <div className="text-[9px] tracking-[0.2em] uppercase text-slate-500 dark:text-slate-400 mb-1.5">Label / Reference</div>
        <input
          type="text"
          value={item.label}
          onChange={(e) => updateLabel(e.target.value)}
          placeholder="e.g. S1 / K-01"
          className="w-full px-3 py-2 text-xs bg-white dark:bg-[#0E141B] rounded-lg ring-1 ring-slate-200 dark:ring-[#2A3947] focus:ring-[#3FB7C9]/40 focus:bg-white focus:outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="X" value={Math.round(item.x)}/>
        <Stat label="Y" value={Math.round(item.y)}/>
        <Stat label="ROT" value={Math.round(item.rotation) + "°"}/>
      </div>

      <div className="pt-3 border-t border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] tracking-[0.2em] uppercase text-slate-500 dark:text-slate-400">Rotation</span>
          <span className="tabular-nums text-slate-800 dark:text-slate-200 text-[10px]">{Math.round(item.rotation)}°</span>
        </div>
        <input type="range" min="0" max="359" step="1" value={item.rotation}
               onChange={(e) => setRotation(parseInt(e.target.value))}
               className="w-full accent-[#3FB7C9] mb-2"/>
        <div className="grid grid-cols-4 gap-1">
          {[0, 90, 180, 270].map(deg => (
            <button key={deg} onClick={() => setRotation(deg)}
              className={`px-1 py-1 text-[9px] tracking-wider rounded-md transition-all ${
                Math.round(item.rotation) === deg
                  ? "bg-[#D8F0F4] text-[#22808F] ring-1 ring-[#3FB7C9]/30"
                  : "bg-slate-50 text-slate-600 dark:text-slate-300 ring-1 ring-slate-200 hover:bg-slate-100"
              }`}>{deg}°</button>
          ))}
        </div>
      </div>

      <div className="pt-3 border-t border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] tracking-[0.2em] uppercase text-slate-500 dark:text-slate-400">Scale</span>
          <span className="tabular-nums text-slate-800 dark:text-slate-200 text-[10px]">{Math.round((item.scale ?? 1)*100)}%</span>
        </div>
        <input type="range" min="0.4" max="3" step="0.05" value={item.scale ?? 1}
               onChange={(e) => setItemScale(parseFloat(e.target.value))}
               className="w-full accent-[#3FB7C9] mb-2"/>
        <button onClick={() => setItemScale(1)}
          className="w-full px-2 py-1.5 text-[9px] uppercase tracking-wider bg-slate-50 text-slate-600 dark:text-slate-300 ring-1 ring-slate-200 hover:bg-slate-100 rounded-md transition-all">
          Reset to 100%
        </button>
      </div>

      <div className="flex gap-2 pt-3 border-t border-slate-200">
        <button onClick={rotateSelected}
          className="flex-1 px-3 py-2 bg-slate-50 ring-1 ring-slate-200 hover:bg-slate-100 text-slate-800 dark:text-slate-200 rounded-md text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all">
          <RotateCw size={12}/> +15°
        </button>
        <button onClick={deleteSelected}
          className="flex-1 px-3 py-2 bg-slate-50 ring-1 ring-slate-200 hover:bg-red-500/[0.1] hover:text-red-300 text-slate-800 dark:text-slate-200 rounded-md text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all">
          <Trash2 size={12}/> Delete
        </button>
      </div>
    </div>
  );
}

function AnnoInspector({ anno, updateAnnoText, deleteSelected }) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <div>
        <div className="text-[9px] tracking-[0.2em] uppercase text-slate-500 dark:text-slate-400 mb-2">Annotation</div>
        <div className="text-[10px] text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
          Edit the note text below. Drag the box to move it. Drag the amber dot at the arrow tip to point it elsewhere.
        </div>
      </div>
      <div>
        <div className="text-[9px] tracking-[0.2em] uppercase text-slate-500 dark:text-slate-400 mb-1.5">Text</div>
        <textarea
          value={anno.text}
          onChange={(e) => updateAnnoText(e.target.value)}
          rows={5}
          className="w-full px-3 py-2 text-xs bg-white dark:bg-[#0E141B] rounded-lg ring-1 ring-slate-200 dark:ring-[#2A3947] focus:ring-[#3FB7C9]/40 focus:bg-white focus:outline-none transition-all text-slate-900 dark:text-slate-100 resize-none"
        />
      </div>
      <button onClick={deleteSelected}
        className="w-full px-3 py-2 bg-slate-50 ring-1 ring-slate-200 hover:bg-red-500/[0.1] hover:text-red-300 text-slate-800 dark:text-slate-200 rounded-md text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all">
        <Trash2 size={12}/> Delete Annotation
      </button>
    </div>
  );
}

function EmptyInspector({ placed }) {
  const counts = {};
  placed.forEach(p => {
    const sym = findSymbol(p.symbolId);
    if (!sym) return;
    counts[sym.name] = (counts[sym.name] || 0) + 1;
  });
  const entries = Object.entries(counts).sort();
  return (
    <div className="flex-1 overflow-y-auto p-4 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed
                    [&::-webkit-scrollbar]:w-1.5
                    [&::-webkit-scrollbar-thumb]:bg-white/10
                    [&::-webkit-scrollbar-thumb]:rounded-full">
      <div className="mb-4 text-slate-600 dark:text-slate-300">Select a symbol or annotation to inspect.</div>
      <div className="text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] text-[9px] mb-2">Schedule</div>
      {!entries.length ? (
        <div className="text-slate-400 mt-2 text-[10px] italic">No items placed yet.</div>
      ) : (
        <table className="w-full text-[10px] tabular-nums">
          <tbody>
            {entries.map(([name, n]) => (
              <tr key={name} className="border-b border-slate-100">
                <td className="py-1.5 text-slate-700 dark:text-slate-300">{name}</td>
                <td className="py-1.5 text-right text-[#22808F] font-semibold">{n}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-slate-50 dark:bg-[#22303D] rounded-lg ring-1 ring-slate-200 dark:ring-[#2A3947] px-2.5 py-2">
      <div className="text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[8.5px] mb-0.5">{label}</div>
      <div className="tabular-nums text-slate-900 dark:text-slate-100 font-medium text-[11px]">{value}</div>
    </div>
  );
}

/* ============================================================================
 * FLOATING TOOLBARS
 * ========================================================================= */
export function FloatingToolbar({ tool, setTool }) {
  return (
    <div className="absolute top-4 left-4 z-20 flex flex-col bg-white dark:bg-[#16202B] rounded-2xl ring-1 ring-slate-200/70 dark:ring-[#2A3947] shadow-[0_10px_30px_-10px_rgba(16,28,40,0.22)] overflow-hidden">
      {Object.entries(TOOLS).map(([key, info]) => {
        const Icon = info.icon;
        const active = tool === key;
        return (
          <button key={key}
            onClick={() => setTool(key)}
            title={`${info.label} (${info.hint})`}
            className={`relative p-2.5 transition-colors duration-150 ${
              active ? "text-[#22808F]" : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
            }`}>
            {active && <div className="absolute inset-0 bg-[#ECF8FA] dark:bg-[#3FB7C9]/15"/>}
            {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#3FB7C9] rounded-r-full"/>}
            <Icon size={15} className="relative"/>
          </button>
        );
      })}
    </div>
  );
}

export function ZoomControls({ zoom, onIn, onOut, onFit }) {
  return (
    <div className="absolute top-4 right-4 z-20 flex bg-white dark:bg-[#16202B] rounded-2xl ring-1 ring-slate-200/70 dark:ring-[#2A3947] shadow-[0_10px_30px_-10px_rgba(16,28,40,0.22)] overflow-hidden">
      <button onClick={onOut} className="p-2.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
        <ZoomOut size={14}/>
      </button>
      <div className="px-3 self-center text-[11px] text-slate-700 dark:text-slate-200 tabular-nums border-x border-slate-200 dark:border-[#2A3947] min-w-[56px] text-center" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        {Math.round(zoom*100)}%
      </div>
      <button onClick={onIn} className="p-2.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
        <ZoomIn size={14}/>
      </button>
      <button onClick={onFit} title="Fit (0)"
              className="p-2.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors border-l border-slate-200 dark:border-[#2A3947]">
        <Maximize2 size={14}/>
      </button>
    </div>
  );
}

/* ============================================================================
 * PROJECT MANAGER (modal) — save, open, and delete named projects
 * ========================================================================= */
export function ProjectManager({
  projectList, currentProjectId, currentName,
  onSaveAs, onOpen, onDelete, onNew, onClose,
}) {
  const [name, setName] = React.useState(currentName || "");
  const [confirmDelete, setConfirmDelete] = React.useState(null);

  const sorted = [...(projectList || [])].sort((a, b) =>
    (b.updatedAt || "").localeCompare(a.updatedAt || "")
  );

  const fmtDate = (iso) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    } catch { return ""; }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6"
         onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
           className="bg-white rounded-2xl ring-1 ring-slate-200 w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <div className="text-[10px] tracking-[0.3em] uppercase text-slate-500">Projects</div>
            <div className="text-base font-semibold mt-0.5 text-slate-900">Save &amp; open jobs</div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md">
            <X size={16}/>
          </button>
        </div>

        {/* Save current as a new project */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="text-[9px] tracking-[0.2em] uppercase text-slate-500 mb-2">Save current drawing as</div>
          <div className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name (e.g. Dalton — Plot 7)"
              className="flex-1 px-3 py-2 text-sm bg-white rounded-lg ring-1 ring-slate-200 focus:ring-[#3FB7C9] focus:outline-none transition-all text-slate-900 placeholder:text-slate-400"
            />
            <button
              onClick={() => { if (name.trim()) onSaveAs(name.trim()); }}
              disabled={!name.trim()}
              className="px-4 py-2 bg-[#3FB7C9] text-[#08313a] rounded-lg text-[10px] uppercase tracking-wider font-semibold hover:bg-[#52C4D5] transition disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap">
              Save As
            </button>
          </div>
        </div>

        {/* Saved projects list */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[9px] tracking-[0.2em] uppercase text-slate-500">
              Saved projects ({sorted.length})
            </div>
            <button onClick={onNew}
              className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-800 transition">
              <Plus size={12}/> New blank
            </button>
          </div>

          {sorted.length === 0 ? (
            <div className="text-sm text-slate-500 italic py-8 text-center">
              No saved projects yet. Name your current drawing above and click Save As to keep it.
            </div>
          ) : (
            <div className="space-y-1.5">
              {sorted.map(p => {
                const isCurrent = p.id === currentProjectId;
                return (
                  <div key={p.id}
                       className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ring-1 transition-all ${
                         isCurrent ? "bg-[#ECF8FA] ring-[#9FE1EC]" : "bg-white ring-slate-200 hover:ring-slate-300"
                       }`}>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate flex items-center gap-2">
                        {p.name}
                        {isCurrent && <span className="text-[8px] uppercase tracking-wider text-[#22808F] bg-[#D8F0F4] px-1.5 py-0.5 rounded-full">Open</span>}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock size={9}/> {fmtDate(p.updatedAt)}
                      </div>
                    </div>
                    {confirmDelete === p.id ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-500">Delete?</span>
                        <button onClick={() => { onDelete(p.id); setConfirmDelete(null); }}
                          className="px-2 py-1 bg-red-500 text-white rounded text-[9px] uppercase tracking-wider hover:bg-red-600">Yes</button>
                        <button onClick={() => setConfirmDelete(null)}
                          className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[9px] uppercase tracking-wider hover:bg-slate-200">No</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => onOpen(p.id)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md text-[10px] uppercase tracking-wider font-medium">
                          Open
                        </button>
                        <button onClick={() => setConfirmDelete(p.id)}
                          title="Delete"
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md">
                          <Trash2 size={13}/>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-slate-200 text-[10px] text-slate-400">
          Projects are saved in this browser. Use <span className="text-slate-600">JSON</span> export for a portable backup.
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
 * BILL OF QUANTITIES (modal) — auto-counted schedule of placed symbols
 * ========================================================================= */
export function BillOfQuantities({ project, onClose }) {
  const { meta } = project;
  // Count across every drawing (floor) in the project, not just the active one.
  const placed = useMemo(
    () => (project.sheets ? project.sheets.flatMap(s => s.placed || []) : (project.placed || [])),
    [project]
  );

  // Aggregate placed symbols by type
  const rows = useMemo(() => {
    const counts = {};
    placed.forEach(p => {
      counts[p.symbolId] = (counts[p.symbolId] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([id, qty]) => {
        const m = SYMBOL_META[id] || {};
        const sym = findSymbol(id);
        return {
          id,
          description: m.description || sym?.name || id,
          height: m.height || "—",
          qty,
        };
      })
      .sort((a, b) => a.description.localeCompare(b.description));
  }, [placed]);

  const total = rows.reduce((s, r) => s + r.qty, 0);

  const downloadCSV = () => {
    const header = ["Item", "Description", "Mounting Height", "Quantity"];
    const lines = rows.map((r, i) =>
      [i + 1, r.description, r.height, r.qty]
        .map(v => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
    const meta1 = `"Project","${(meta.projectName || "").replace(/"/g, '""')}"`;
    const meta2 = `"Plot","${(meta.plot || "").replace(/"/g, '""')}"`;
    const meta3 = `"Sheet","${(meta.sheetName || "").replace(/"/g, '""')}"`;
    const meta4 = `"Drawing No.","${(meta.drawingNumber || "").replace(/"/g, '""')}"`;
    const csv = [meta1, meta2, meta3, meta4, "", header.join(","), ...lines,
                 "", `"","TOTAL","",${total}`].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = ((meta.projectName || "plan").replace(/[^a-z0-9-_]+/gi, "_")) + "_BOQ.csv";
    a.click();
  };

  const [busyWord, setBusyWord] = React.useState(false);
  const downloadWord = async () => {
    setBusyWord(true);
    try {
      const docx = await import("docx");
      const { buildBoqDocument } = await import("@/lib/boqDocx");
      const doc = buildBoqDocument(docx, { meta, rows, total });
      const blob = await docx.Packer.toBlob(doc);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = ((meta.projectName || "plan").replace(/[^a-z0-9-_]+/gi, "_")) + "_BOQ.docx";
      a.click();
    } catch (err) {
      alert("Word export failed: " + err.message);
    } finally {
      setBusyWord(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6"
         onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
           className="bg-white rounded-2xl ring-1 ring-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <div className="text-[10px] tracking-[0.3em] uppercase text-slate-500">Bill of Quantities</div>
            <div className="text-base font-semibold mt-0.5 text-slate-900">
              {meta.projectName || "Untitled Project"}
              {meta.plot ? <span className="text-slate-400 font-normal"> · {meta.plot}</span> : null}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md">
            <X size={16}/>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {rows.length === 0 ? (
            <div className="text-sm text-slate-500 italic py-8 text-center">
              No symbols placed yet. As you add items to the drawing, they'll be counted here automatically.
            </div>
          ) : (
            <table className="w-full text-[12px] border-collapse">
              <thead>
                <tr className="text-left text-slate-500 uppercase tracking-wider text-[9px] border-b border-slate-200">
                  <th className="py-2 pr-2 w-8">#</th>
                  <th className="py-2 pr-2">Description</th>
                  <th className="py-2 pr-2">Mounting Height</th>
                  <th className="py-2 pl-2 text-right w-16">Qty</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.id} className="border-b border-slate-100">
                    <td className="py-2 pr-2 text-slate-400 tabular-nums">{i + 1}</td>
                    <td className="py-2 pr-2 text-slate-800 font-medium">{r.description}</td>
                    <td className="py-2 pr-2 text-slate-500">{r.height}</td>
                    <td className="py-2 pl-2 text-right tabular-nums font-semibold text-slate-900">{r.qty}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-slate-300">
                  <td/><td className="py-2 font-semibold text-slate-900 uppercase tracking-wider text-[10px]">Total</td>
                  <td/>
                  <td className="py-2 pl-2 text-right tabular-nums font-bold text-[#2C97A8]">{total}</td>
                </tr>
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
          <div className="text-[10px] text-slate-500">
            {rows.length} item type{rows.length === 1 ? "" : "s"} · {total} total fittings
          </div>
          <div className="flex gap-2">
            <button onClick={onClose}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md text-[10px] uppercase tracking-wider">
              Close
            </button>
            <button onClick={downloadCSV} disabled={rows.length === 0}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md text-[10px] uppercase tracking-wider font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5">
              <Download size={12}/> CSV
            </button>
            <button onClick={downloadWord} disabled={rows.length === 0 || busyWord}
              className="px-4 py-2 bg-[#3FB7C9] text-[#08313a] rounded-md text-[10px] uppercase tracking-wider font-semibold hover:bg-[#52C4D5] transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5">
              <Download size={12}/> {busyWord ? "Building…" : "Word (.docx)"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
 * METADATA EDITOR (modal)
 * ========================================================================= */
export function MetaEditor({ meta, updateMeta, onSheetField, onClose }) {
  const setSheet = onSheetField || (() => {});
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center p-6"
         onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
           className="bg-white rounded-2xl ring-1 ring-slate-300 w-full max-w-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-[10px] tracking-[0.3em] uppercase text-slate-500">Project Settings</div>
            <div className="text-base font-semibold mt-0.5">Sheet metadata</div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md">
            <X size={16}/>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <MetaField label="Project name"   value={meta.projectName}   onChange={(v) => updateMeta({ projectName: v })} />
          <MetaField label="Plot / address" value={meta.plot}          onChange={(v) => updateMeta({ plot: v })} />
          <MetaField label="Sheet name (this floor)" value={meta.sheetName}     onChange={(v) => setSheet({ name: v })} />
          <MetaField label="Scale"          value={meta.scale}         onChange={(v) => updateMeta({ scale: v })} />
          <MetaField label="Drawing number (this floor)" value={meta.drawingNumber} onChange={(v) => setSheet({ drawingNumber: v })} />
          <MetaField label="Date"           value={meta.date}          onChange={(v) => updateMeta({ date: v })} type="date"/>
          <MetaField label="Revision"       value={meta.revision}      onChange={(v) => updateMeta({ revision: v })} />
          <MetaField label="Revision note"  value={meta.revNote}       onChange={(v) => updateMeta({ revNote: v })} />
          <MetaField label="Company"        value={meta.company}       onChange={(v) => updateMeta({ company: v })} span={2}/>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="text-[9px] tracking-[0.25em] uppercase text-slate-400 mb-3">Client — used for emailing drawings</div>
          <div className="grid grid-cols-2 gap-3">
            <MetaField label="Client name"  value={meta.clientName}  onChange={(v) => updateMeta({ clientName: v })} />
            <MetaField label="Client email" value={meta.clientEmail} onChange={(v) => updateMeta({ clientEmail: v })} type="email"/>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button onClick={onClose}
            className="px-4 py-2 bg-[#3FB7C9] text-[#08313a] rounded-md text-[10px] uppercase tracking-wider font-semibold hover:bg-[#52C4D5] transition">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function MetaField({ label, value, onChange, type = "text", span = 1 }) {
  return (
    <div style={{ gridColumn: span === 2 ? "1 / span 2" : "auto" }}>
      <div className="text-[9px] tracking-[0.2em] uppercase text-slate-500 mb-1.5">{label}</div>
      <input
        type={type} value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm bg-slate-50 rounded-lg ring-1 ring-slate-200 focus:ring-[#3FB7C9]/40 focus:bg-slate-100 focus:outline-none transition-all text-slate-900"
      />
    </div>
  );
}

/* ============================================================================
 * TITLE BLOCK EDITOR  (per-account template: detail lines + logos)
 * Set once here, applied to every drawing and synced via the account.
 * ========================================================================= */
export function TitleBlockEditor({ onClose }) {
  const { titleBlock, saveTitleBlock } = useApp();
  const start = titleBlock || DEFAULT_TITLEBLOCK;
  const [details, setDetails] = React.useState(() =>
    (start.details && start.details.length ? start.details : DEFAULT_TITLEBLOCK.details).map(d => ({ ...d }))
  );
  const [logos, setLogos] = React.useState(() => [...(start.logos || [])]);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const fileRef = React.useRef(null);

  const addDetail = () => setDetails(d => [...d, { label: "", value: "" }]);
  const setDetail = (i, key, v) => setDetails(d => d.map((x, j) => (j === i ? { ...x, [key]: v } : x)));
  const removeDetail = (i) => setDetails(d => d.filter((_, j) => j !== i));

  const onPickLogos = async (e) => {
    const files = [...(e.target.files || [])];
    e.target.value = "";
    for (const f of files) {
      try { const url = await resizeImageToDataUrl(f); setLogos(l => [...l, url]); }
      catch { setError("Couldn't read one of those images."); }
    }
  };
  const removeLogo = (i) => setLogos(l => l.filter((_, j) => j !== i));

  const save = async () => {
    setSaving(true); setError("");
    try {
      await saveTitleBlock({ details: details.filter(d => d.label || d.value), logos });
      onClose();
    } catch (err) {
      setError(err.message || "Couldn't save. If this is the first time, make sure the user_settings table exists.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
           className="bg-white rounded-2xl ring-1 ring-slate-200 w-full max-w-2xl max-h-[88vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <div className="text-[10px] tracking-[0.3em] uppercase text-slate-500">Title block</div>
            <div className="text-base font-semibold mt-0.5 text-slate-900">Your company template</div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md"><X size={16}/></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          <p className="text-[12px] text-slate-500 -mt-1">Set once — these details and logos appear on the bottom of every drawing and in the PDF. Project, sheet, scale, date, drawing number and revision stay editable per drawing.</p>

          {/* Logos */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] tracking-[0.2em] uppercase text-slate-500">Logos</div>
              <button onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] uppercase tracking-wide font-semibold rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200">
                <ImagePlus size={13}/> Add logo
              </button>
              <input ref={fileRef} type="file" accept="image/*" multiple onChange={onPickLogos} className="hidden"/>
            </div>
            {logos.length === 0 ? (
              <div className="text-[12px] text-slate-400 italic py-3 px-3 rounded-lg bg-slate-50 ring-1 ring-slate-200">No logos yet — add your company and accreditation logos.</div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {logos.map((src, i) => (
                  <div key={i} className="relative group rounded-lg ring-1 ring-slate-200 bg-slate-50 p-2 flex items-center justify-center" style={{ height: 56 }}>
                    <img src={src} alt="" style={{ height: 40, width: "auto", maxWidth: 120, objectFit: "contain" }}/>
                    <button onClick={() => removeLogo(i)} title="Remove"
                      className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white ring-1 ring-slate-300 text-slate-500 hover:text-red-600 hover:ring-red-300 flex items-center justify-center shadow-sm">
                      <X size={11}/>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detail lines */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] tracking-[0.2em] uppercase text-slate-500">Details</div>
              <button onClick={addDetail}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] uppercase tracking-wide font-semibold rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200">
                <Plus size={13}/> Add line
              </button>
            </div>
            <div className="space-y-2">
              {details.map((d, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input value={d.label} onChange={(e) => setDetail(i, "label", e.target.value)} placeholder="Label (e.g. Tel)"
                    className="w-40 px-3 py-2 text-sm bg-slate-50 rounded-lg ring-1 ring-slate-200 focus:ring-[#3FB7C9]/40 focus:outline-none text-slate-900"/>
                  <input value={d.value} onChange={(e) => setDetail(i, "value", e.target.value)} placeholder="Value"
                    className="flex-1 px-3 py-2 text-sm bg-slate-50 rounded-lg ring-1 ring-slate-200 focus:ring-[#3FB7C9]/40 focus:outline-none text-slate-900"/>
                  <button onClick={() => removeDetail(i)} title="Remove"
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md shrink-0"><Trash2 size={14}/></button>
                </div>
              ))}
              {details.length === 0 && (
                <div className="text-[12px] text-slate-400 italic">No detail lines — add your company name, address, phone, email, registration…</div>
              )}
            </div>
            <div className="text-[11px] text-slate-400 mt-2">The first line shows largest, as your company name.</div>
          </div>

          {error && <div className="text-[12px] text-red-600 bg-red-50 ring-1 ring-red-200 rounded-lg px-3 py-2">{error}</div>}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-[10px] uppercase tracking-wider font-semibold rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200">Cancel</button>
          <button onClick={save} disabled={saving}
            className="px-4 py-2 bg-[#3FB7C9] text-[#08313a] rounded-md text-[10px] uppercase tracking-wider font-semibold hover:bg-[#52C4D5] transition disabled:opacity-60">
            {saving ? "Saving…" : "Save template"}
          </button>
        </div>
      </div>
    </div>
  );
}


/* ============================================================================
 * PRINT PREVIEW
 * Renders a clean copy of the sheet at 1:1, full-screen,
 * with the rest of the app hidden via the print stylesheet.
 * ========================================================================= */
export function PrintPreview({ project, legendItems, colourMode, DRAW, onClose, onPrint }) {
  const { meta, notes } = project;
  const sheets = project.sheets && project.sheets.length
    ? project.sheets
    : [{ id: "legacy", name: meta.sheetName, drawingNumber: meta.drawingNumber,
         bgImage: project.bgImage, placed: project.placed || [], wires: project.wires || [], annotations: project.annotations || [] }];

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const emailClient = () => {
    const greeting = meta.clientName ? `Hi ${meta.clientName},` : "Hi,";
    const what = sheets.length > 1 ? `the electrical drawings (${sheets.length} floors)` : "the electrical drawing";
    const forWhat = meta.plot ? ` for ${meta.plot}` : (meta.projectName ? ` for ${meta.projectName}` : "");
    const body = [
      greeting,
      "",
      `Please find attached ${what}${forWhat}.`,
      "",
      "Any questions, just let me know.",
    ].join("\n");
    const subject = `Electrical drawings — ${meta.projectName || meta.plot || "your project"}`;
    const href = `mailto:${meta.clientEmail || ""}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = href;
  };

  const legendFor = (placed) => {
    const ids = new Set((placed || []).map(p => p.symbolId));
    return Array.from(ids).map(id => ({
      id, symbol: findSymbol(id),
      meta: SYMBOL_META[id] || { description: findSymbol(id)?.name || id, height: null },
    })).filter(x => x.symbol);
  };

  if (!mounted) return null;

  // Rendered as a direct child of <body> so it's clear of the editor's
  // overflow-hidden / fixed-height shell — that's what lets every sheet
  // print onto its own page instead of just the first.
  return createPortal(
    <div id="print-root">
      <div className="pp-chrome">
        <div>
          <div className="pp-eyebrow">Print preview</div>
          <div className="pp-title">{meta.projectName || "Project"} · {sheets.length} {sheets.length === 1 ? "drawing" : "drawings"}</div>
        </div>
        <div className="pp-actions">
          <span className="pp-hint">Save the PDF, then <b>Email client</b> and attach it.</span>
          <button onClick={onClose} className="pp-btn pp-btn-ghost">Close</button>
          <button onClick={emailClient} className="pp-btn pp-btn-email"><Mail size={12}/> Email client</button>
          <button onClick={onPrint} className="pp-btn pp-btn-primary"><Printer size={12}/> Print / Save PDF</button>
        </div>
      </div>

      <div className="pp-pages">
        {sheets.map((s) => (
          <div key={s.id} className="print-page">
            <PrintSheet
              meta={{ ...meta, sheetName: s.name, drawingNumber: s.drawingNumber || meta.drawingNumber }}
              notes={s.notes || notes}
              bgImage={s.bgImage}
              placed={s.placed} wires={s.wires} annotations={s.annotations}
              legendItems={legendFor(s.placed)}
              colourMode={colourMode}
              DRAW={DRAW}
            />
          </div>
        ))}
      </div>

      <style>{`
        #print-root{position:fixed; inset:0; z-index:60; background:rgba(15,23,42,.5); overflow:auto; font-family:'Inter',system-ui,sans-serif}
        #print-root .pp-chrome{position:sticky; top:0; z-index:2; background:#fff; border-bottom:1px solid #e2e8f0; padding:12px 20px; display:flex; align-items:center; justify-content:space-between; gap:16px}
        #print-root .pp-eyebrow{font-size:10px; letter-spacing:.3em; text-transform:uppercase; color:#64748b}
        #print-root .pp-title{font-size:14px; font-weight:600; margin-top:2px; color:#0f172a}
        #print-root .pp-actions{display:flex; align-items:center; gap:12px}
        #print-root .pp-hint{font-size:10px; color:#64748b}
        #print-root .pp-hint b{color:#0f172a}
        #print-root .pp-btn{display:flex; align-items:center; gap:6px; padding:7px 14px; border-radius:7px; font-size:10px; letter-spacing:.08em; text-transform:uppercase; font-weight:600; border:none; cursor:pointer}
        #print-root .pp-btn-ghost{background:#f1f5f9; color:#1e293b}
        #print-root .pp-btn-ghost:hover{background:#e2e8f0}
        #print-root .pp-btn-primary{background:#3FB7C9; color:#08313a}
        #print-root .pp-btn-primary:hover{background:#52C4D5}
        #print-root .pp-btn-email{background:#fff; color:#22808F; box-shadow:inset 0 0 0 1px #3FB7C9}
        #print-root .pp-btn-email:hover{background:#ECF8FA}
        #print-root .pp-pages{display:flex; flex-direction:column; align-items:center; gap:32px; padding:32px}
        #print-root .print-page{width:${SHEET.width}px; height:${SHEET.height}px; background:#fff; box-shadow:0 20px 50px -10px rgba(0,0,0,.5); flex:none}

        @media print {
          @page { size: A3 landscape; margin: 0; }
          html, body { background:#fff !important; }
          body > div:not(#print-root){ display:none !important; }
          #print-root{ position:static !important; inset:auto !important; background:#fff !important; overflow:visible !important; }
          #print-root .pp-chrome{ display:none !important; }
          #print-root .pp-pages{ display:block !important; padding:0 !important; gap:0 !important; }
          #print-root .print-page{
            box-shadow:none !important;
            width:${SHEET.width}px !important; height:${SHEET.height}px !important;
            overflow:hidden;
            page-break-after:always; break-after:page;
          }
          #print-root .print-page:last-child{ page-break-after:auto; break-after:auto; }
          #print-root .print-page *{ -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
        }
      `}</style>
    </div>,
    document.body
  );
}

// A non-interactive version of the Sheet used by Print Preview.
function PrintSheet({ meta, notes, bgImage, placed, wires, annotations, legendItems, colourMode, DRAW }) {
  return (
    <div style={{
      width: SHEET.width, height: SHEET.height,
      background: "#ffffff", color: "#0a0a0a",
      position: "relative",
      fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
    }}>
      <div style={{
        position: "absolute",
        left: SHEET.margin, top: SHEET.margin,
        width: SHEET.width - SHEET.margin*2,
        height: SHEET.height - SHEET.margin*2,
        border: "1px solid #0a0a0a",
      }}/>
      <LegendColumnStatic legendItems={legendItems} colourMode={colourMode} />
      <NotesColumnStatic notes={notes} />
      <DrawingAreaStatic
        DRAW={DRAW}
        bgImage={bgImage}
        placed={placed} wires={wires} annotations={annotations}
        colourMode={colourMode}
      />
      <TitleBlockStatic meta={meta} />
    </div>
  );
}

function LegendColumnStatic({ legendItems, colourMode }) {
  return (
    <div style={{
      position: "absolute",
      left: SHEET.margin, top: SHEET.margin,
      width: SHEET.legendWidth,
      height: SHEET.height - SHEET.margin * 2 - SHEET.titleHeight - 8,
      borderRight: "1px solid #0a0a0a",
      padding: "12px 12px 12px 14px",
    }}>
      <SheetColumnHeader padL={14} padR={12} padT={12}>Electrical Legend</SheetColumnHeader>
      <div style={{ fontSize: 8.5, color: "#404040", marginBottom: 10, letterSpacing: "0.06em" }}>
        UK ARCHITECTURAL · TO BE READ IN COLOUR
      </div>
      {legendItems.map(({ id, symbol, meta }) => {
        const cols = resolveColours(id, colourMode);
        return (
          <div key={id} style={{
            display: "grid", gridTemplateColumns: "26px 1fr",
            alignItems: "center", gap: 6, padding: "3px 0",
            borderBottom: "0.5px solid #e5e5e5",
          }}>
            <svg viewBox={VIEWBOX} width={22} height={22}
                 style={{ color: cols.body, "--feeder": cols.feeder }}>
              {symbol.svg}
            </svg>
            <div>
              <div style={{ fontSize: 9, fontWeight: 600, color: "#171717", lineHeight: 1.2 }}>
                {meta.description}
              </div>
              {meta.height && <div style={{ fontSize: 8, color: "#525252", marginTop: 1 }}>{meta.height}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function NotesColumnStatic({ notes }) {
  return (
    <div style={{
      position: "absolute",
      right: SHEET.margin, top: SHEET.margin,
      width: SHEET.notesWidth,
      height: SHEET.height - SHEET.margin * 2 - SHEET.titleHeight - 8,
      borderLeft: "1px solid #0a0a0a",
      padding: "12px 14px",
      overflow: "hidden",
    }}>
      <SheetColumnHeader padL={14} padR={14} padT={12}>Notes</SheetColumnHeader>
      <div style={{ fontSize: 9, color: "#262626", lineHeight: 1.5 }}
           dangerouslySetInnerHTML={{ __html: notesToHtml(notes) }} />
    </div>
  );
}

function DrawingAreaStatic({ DRAW, bgImage, placed, wires, annotations, colourMode }) {
  const imageDisplay = useMemo(() => {
    if (!bgImage) return null;
    const scale = Math.min(DRAW.w / bgImage.w, DRAW.h / bgImage.h);
    const w = bgImage.w * scale;
    const h = bgImage.h * scale;
    return { x: (DRAW.w - w) / 2, y: (DRAW.h - h) / 2, w, h };
  }, [bgImage, DRAW.w, DRAW.h]);

  return (
    <div style={{
      position: "absolute",
      left: DRAW.x, top: DRAW.y, width: DRAW.w, height: DRAW.h,
      background: "#ffffff", border: "1px solid #0a0a0a", overflow: "hidden",
    }}>
      {bgImage && imageDisplay && (
        <img src={bgImage.src} alt="plan"
             style={{
               position: "absolute",
               left: imageDisplay.x, top: imageDisplay.y,
               width: imageDisplay.w, height: imageDisplay.h,
               display: "block",
             }}/>
      )}
      <svg width={DRAW.w} height={DRAW.h}
           style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {wires.map(w => {
          const a = placed.find(p => p.id === w.fromId);
          const b = placed.find(p => p.id === w.toId);
          if (!a || !b) return null;
          return (
            <line key={w.id}
              x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke={colourMode === "mono" ? "#0a0a0a" : "#dc2626"}
              strokeWidth={1.2} strokeDasharray="6 4" strokeLinecap="round"/>
          );
        })}
        {annotations.map(a => {
          const stroke = colourMode === "mono" ? "#0a0a0a" : "#dc2626";
          const dx = a.anchorX - a.x;
          const dy = a.anchorY - a.y;
          const len = Math.hypot(dx, dy);
          const ux = len > 0 ? dx / len : 0;
          const uy = len > 0 ? dy / len : 0;
          const startX = a.x + ux * 18;
          const startY = a.y + uy * 6;
          const ah = 6;
          const angle = Math.atan2(dy, dx);
          const ax1 = a.anchorX - ah * Math.cos(angle - Math.PI/7);
          const ay1 = a.anchorY - ah * Math.sin(angle - Math.PI/7);
          const ax2 = a.anchorX - ah * Math.cos(angle + Math.PI/7);
          const ay2 = a.anchorY - ah * Math.sin(angle + Math.PI/7);
          return (
            <g key={a.id}>
              <line x1={startX} y1={startY} x2={a.anchorX} y2={a.anchorY}
                    stroke={stroke} strokeWidth={1.3}/>
              <polygon points={`${a.anchorX},${a.anchorY} ${ax1},${ay1} ${ax2},${ay2}`} fill={stroke}/>
            </g>
          );
        })}
        {placed.map(item => {
          const sym = findSymbol(item.symbolId);
          if (!sym) return null;
          const itemScale = item.scale ?? 1;
          const itemSize = 48 * itemScale;
          const half = itemSize / 2;
          const cols = resolveColours(item.symbolId, colourMode);
          return (
            <g key={item.id}
               transform={`translate(${item.x - half} ${item.y - half}) rotate(${item.rotation} ${half} ${half})`}>
              <svg x={0} y={0} width={itemSize} height={itemSize} viewBox={VIEWBOX}
                   style={{ color: cols.body, "--feeder": cols.feeder, overflow: "visible" }}>
                {sym.svg}
              </svg>
              {item.label && (
                <text x={half} y={itemSize + 9} fontSize={9} textAnchor="middle"
                      fill="#171717" fontFamily="ui-sans-serif, system-ui, sans-serif" fontWeight="600"
                      transform={`rotate(${-item.rotation} ${half} ${itemSize + 9})`}>
                  {item.label}
                </text>
              )}
            </g>
          );
        })}
        {annotations.map(a => {
          const stroke = colourMode === "mono" ? "#0a0a0a" : "#dc2626";
          const lines = a.text.split("\n").flatMap(line => wrapText(line, 22));
          const padding = 4;
          const lineHeight = 11;
          const textW = Math.max(60, ...lines.map(l => estimateWidth(l, 8.5)));
          const textH = lines.length * lineHeight + padding * 2 - 2;
          return (
            <g key={a.id + "-text"}>
              <rect
                x={a.x - textW/2 - padding}
                y={a.y - textH/2}
                width={textW + padding*2}
                height={textH}
                rx={3}
                fill="rgba(255,255,255,0.95)"
                stroke={stroke}
                strokeWidth={1}
                strokeDasharray="4 2.5"
              />
              {lines.map((line, i) => (
                <text
                  key={i}
                  x={a.x}
                  y={a.y - textH/2 + padding + lineHeight * (i + 1) - 2}
                  fontSize={8.5}
                  textAnchor="middle"
                  fill={stroke}
                  fontWeight={600}
                >{line}</text>
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function TitleBlockStatic({ meta }) {
  const { titleBlock } = useApp();
  const tb = titleBlock || DEFAULT_TITLEBLOCK;
  return (
    <div style={{
      position: "absolute",
      left: SHEET.margin,
      top: SHEET.height - SHEET.margin - SHEET.titleHeight,
      width: SHEET.width - SHEET.margin * 2,
      height: SHEET.titleHeight,
      borderTop: "1px solid #0a0a0a",
      display: "grid",
      gridTemplateColumns: "auto 1.5fr 0.9fr 1fr",
      fontSize: 10,
    }}>
      <div style={{ borderRight: "1px solid #0a0a0a", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <TitleLogos logos={tb.logos} />
      </div>
      <div style={{ padding: "10px 14px", borderRight: "1px solid #0a0a0a", display: "flex", flexDirection: "column", justifyContent: "flex-start", gap: 7, overflow: "hidden" }}>
        <TitleDetails details={tb.details} />
        <div>
          <div style={{ fontSize: 8, letterSpacing: "0.15em", color: "#737373" }}>PROJECT</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#0a0a0a" }}>{meta.projectName || "—"}</div>
          <div style={{ fontSize: 9, color: "#0a0a0a" }}>{meta.plot}</div>
        </div>
      </div>
      <div style={{ padding: "10px 14px", borderRight: "1px solid #0a0a0a", display: "flex", flexDirection: "column", justifyContent: "flex-start", gap: 9 }}>
        <div>
          <div style={{ fontSize: 8, letterSpacing: "0.15em", color: "#737373" }}>SHEET</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#0a0a0a" }}>{meta.sheetName}</div>
        </div>
        <div style={{ display: "flex", gap: 14 }}>
          <div>
            <div style={{ fontSize: 8, letterSpacing: "0.15em", color: "#737373" }}>SCALE</div>
            <div style={{ fontSize: 10, fontWeight: 600 }}>{meta.scale}</div>
          </div>
          <div>
            <div style={{ fontSize: 8, letterSpacing: "0.15em", color: "#737373" }}>DATE</div>
            <div style={{ fontSize: 10, fontWeight: 600 }}>{meta.date}</div>
          </div>
        </div>
      </div>
      <div style={{ padding: "10px 14px", display: "grid", gridTemplateColumns: "1fr auto", columnGap: 14, rowGap: 6 }}>
        <div>
          <div style={{ fontSize: 8, letterSpacing: "0.15em", color: "#737373" }}>DRAWING NO.</div>
          <div style={{ fontSize: 11, fontWeight: 700 }}>{meta.drawingNumber || "—"}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 8, letterSpacing: "0.15em", color: "#737373" }}>REV</div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>{meta.revision}</div>
        </div>
        <div style={{ gridColumn: "1 / span 2" }}>
          <div style={{ fontSize: 8, letterSpacing: "0.15em", color: "#737373" }}>REVISION NOTE</div>
          <div style={{ fontSize: 9 }}>{meta.revNote}</div>
        </div>
      </div>
    </div>
  );
}
