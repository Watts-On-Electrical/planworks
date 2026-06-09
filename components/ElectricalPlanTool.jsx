"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  Upload, Trash2, Save, FolderOpen, Download, Undo2, Redo2,
  MousePointer2, Cable, RotateCw, ZoomIn, ZoomOut, Maximize2,
  Palette, Ruler, Hand, Sparkles, Type, Printer, Settings,
  ChevronRight, X, FileText, Eye, EyeOff, Layers,
} from "lucide-react";
import { storage } from "@/lib/storage";
import {
  SYMBOLS, SYMBOL_META, CATEGORY_COLOURS, VIEWBOX,
  findSymbol, findCategory, resolveColours,
} from "@/lib/symbols.jsx";
import {
  TopBar, Palette as PalettePanel, Workspace, Inspector,
  FloatingToolbar, ZoomControls, MetaEditor, PrintPreview,
} from "@/components/SheetParts";

/* ============================================================================
 * PLAN.WORKS — Drawing production tool
 *
 * Sheet-based architecture: the workspace IS an A3 landscape drawing sheet.
 * The sheet contains:
 *   - Title block (project name, plot, sheet, scale, date, revision)
 *   - Legend column (auto-generated from symbols actually placed)
 *   - Notes panel (free-text MEP notes)
 *   - Drawing area (imported floor plan + symbols + annotations)
 *
 * Print/export uses the browser's native print-to-PDF for full fidelity.
 * ========================================================================= */

// Sheet dimensions — A3 landscape at 96 DPI (web standard)
const SHEET = {
  width: 1587,   // 420mm at 96dpi  (≈ 16.5")
  height: 1123,  // 297mm at 96dpi
  margin: 18,
  legendWidth: 230,
  notesWidth: 280,
  titleHeight: 110,
};

const ZOOM_MIN = 0.1;
const ZOOM_MAX = 5;
const ZOOM_WHEEL_SPEED = 0.0015;

const DEFAULT_PROJECT = {
  meta: {
    projectName: "",
    plot: "",
    sheetName: "Ground Floor MEP Plan",
    scale: "1:50 @ A3",
    drawingNumber: "",
    date: new Date().toISOString().slice(0, 10),
    revision: "A",
    revNote: "First Issue",
    company: "Watts On Electrical Ltd",
  },
  notes: [
    {
      heading: "Fixing Heights & Location",
      body:
        "Refer to Building Regulations Approved Document M for equipment mounting heights in all instances.\n\nAll switches & sockets in kitchen areas to be installed minimum 300mm clear of any adjacent sink, drainer or hob.",
    },
    {
      heading: "Fire & Smoke Detection",
      body:
        "Dwelling to be provided with a fire detection and alarm system to Grade D2 Category LD3 standard, in accordance with BS 5839-6 (alarms in hallways and landings — circulation spaces and escape routes), plus alarms in kitchen and living room (high risk areas). Heat detection in kitchens and smoke detectors in circulation spaces.",
    },
    {
      heading: "Important Note",
      body:
        "The electrical layout provided is indicative only and to show locations of client required electrical items. Contractor to confirm all locations, runs and products with the client prior to purchase or installation of goods. All electrical works are to be carried out by a certified electrician and provide completion certificates. All works to be completed in accordance with BS 7671.",
    },
  ],
  bgImage: null,        // { src, w, h } — the imported plan
  placed: [],           // [{ id, symbolId, x, y, rotation, scale, label }]
  wires: [],            // [{ id, fromId, toId }]
  annotations: [],      // [{ id, x, y, text, anchorX, anchorY }]
};

// Tool definitions
const TOOLS = {
  select: { icon: MousePointer2, label: "Select", hint: "V" },
  pan:    { icon: Hand,          label: "Pan",    hint: "H" },
  wire:   { icon: Cable,         label: "Wire",   hint: "W" },
  note:   { icon: Type,          label: "Note",   hint: "N" },
};

// ============================================================================
export default function ElectricalPlanTool() {
  // Project state
  const [project, setProject] = useState(DEFAULT_PROJECT);
  const { meta, notes, bgImage, placed, wires, annotations } = project;

  // Helper to patch parts of the project immutably
  const updateProject = useCallback((patch) => {
    setProject(p => ({ ...p, ...patch }));
  }, []);
  const updateMeta = useCallback((patch) => {
    setProject(p => ({ ...p, meta: { ...p.meta, ...patch } }));
  }, []);

  // UI state
  const [selectedId, setSelectedId] = useState(null);
  const [selectedAnnoId, setSelectedAnnoId] = useState(null);
  const [tool, setTool] = useState("select");
  const [wireStart, setWireStart] = useState(null);
  const [zoom, setZoom] = useState(0.5);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [draggingPlacedId, setDraggingPlacedId] = useState(null);
  const [draggingAnno, setDraggingAnno] = useState(null); // { id, mode: 'body' | 'anchor' }
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [rotatingId, setRotatingId] = useState(null);
  const [activeCategory, setActiveCategory] = useState("sockets");
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [symbolScale, setSymbolScale] = useState(1.0);
  const [colourMode, setColourMode] = useState("red");
  const [isPanning, setIsPanning] = useState(false);
  const [spacePressed, setSpacePressed] = useState(false);
  const [draggingFile, setDraggingFile] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [showMeta, setShowMeta] = useState(false);     // metadata edit modal
  const [printPreview, setPrintPreview] = useState(false);
  const [sidebarHidden, setSidebarHidden] = useState(false);

  // Refs
  const viewportRef = useRef(null);   // the dark workspace that holds the sheet
  const fileInputRef = useRef(null);
  const drawingAreaRef = useRef(null); // the SVG drawing area inside the sheet
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  // ---------- Drawing area geometry ----------
  // The drawing area occupies the centre of the sheet, bounded by margins,
  // legend column, notes column, and title block.
  const DRAW = useMemo(() => ({
    x: SHEET.margin + SHEET.legendWidth + 8,
    y: SHEET.margin,
    w: SHEET.width - SHEET.margin * 2 - SHEET.legendWidth - SHEET.notesWidth - 16,
    h: SHEET.height - SHEET.margin * 2 - SHEET.titleHeight - 8,
  }), []);

  // ---------- Undo / Redo ----------
  const snapshot = useCallback(() => {
    setHistory(h => [...h.slice(-49), { placed, wires, annotations }]);
    setFuture([]);
  }, [placed, wires, annotations]);

  const undo = () => {
    setHistory(h => {
      if (!h.length) return h;
      const prev = h[h.length - 1];
      setFuture(f => [{ placed, wires, annotations }, ...f].slice(0, 50));
      setProject(p => ({ ...p, ...prev }));
      return h.slice(0, -1);
    });
  };
  const redo = () => {
    setFuture(f => {
      if (!f.length) return f;
      const next = f[0];
      setHistory(h => [...h, { placed, wires, annotations }].slice(-50));
      setProject(p => ({ ...p, ...next }));
      return f.slice(1);
    });
  };

  // ---------- File import (PDF or image) ----------
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
        // Just use first page for now (multi-page is a future feature)
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 2 });
        const c = document.createElement("canvas");
        c.width = viewport.width; c.height = viewport.height;
        const ctx = c.getContext("2d");
        await page.render({ canvasContext: ctx, viewport }).promise;
        updateProject({
          bgImage: { src: c.toDataURL("image/png"), w: viewport.width, h: viewport.height },
        });
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
          updateProject({
            bgImage: { src: e.target.result, w: img.width, h: img.height },
          });
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
    setTimeout(fitToScreen, 100);
  };

  // ---------- Zoom & pan (over the whole sheet) ----------
  const fitToScreen = useCallback(() => {
    const vp = viewportRef.current?.getBoundingClientRect();
    if (!vp) return;
    const padding = 40;
    const scaleX = (vp.width - padding * 2) / SHEET.width;
    const scaleY = (vp.height - padding * 2) / SHEET.height;
    const scale = Math.min(scaleX, scaleY);
    setZoom(scale);
    setPan({
      x: (vp.width - SHEET.width * scale) / 2,
      y: (vp.height - SHEET.height * scale) / 2,
    });
  }, []);

  // Initial fit
  useEffect(() => {
    const t = setTimeout(fitToScreen, 50);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const zoomAt = useCallback((clientX, clientY, factor) => {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return;
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

  // Mouse-wheel zoom across the workspace
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      const factor = Math.exp(-e.deltaY * ZOOM_WHEEL_SPEED);
      zoomAt(e.clientX, e.clientY, factor);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  // ---------- Coordinate transforms ----------
  // Convert client (screen) coordinates to drawing-area coordinates.
  // The drawing area lives inside the sheet, which is itself transformed
  // by (pan, zoom) inside the viewport. So:
  //   sheetSpace = (client - viewportTopLeft - pan) / zoom
  //   drawingAreaSpace = sheetSpace - (DRAW.x, DRAW.y)
  const clientToDrawing = (clientX, clientY) => {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const sheetX = (clientX - rect.left - pan.x) / zoom;
    const sheetY = (clientY - rect.top - pan.y) / zoom;
    return { x: sheetX - DRAW.x, y: sheetY - DRAW.y };
  };

  // ---------- Drag from palette ----------
  const onPaletteDragStart = (e, symbolId) => {
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("text/plain", symbolId);
  };

  // Drop onto the drawing area
  const onDrawingDrop = (e) => {
    e.preventDefault();
    setDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
      return;
    }
    const symbolId = e.dataTransfer.getData("text/plain");
    if (!symbolId || !findSymbol(symbolId)) return;
    const { x, y } = clientToDrawing(e.clientX, e.clientY);
    if (x < 0 || y < 0 || x > DRAW.w || y > DRAW.h) return;
    snapshot();
    const newItem = {
      id: "p_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
      symbolId, x, y, rotation: 0, scale: 1, label: "",
    };
    updateProject({ placed: [...placed, newItem] });
    setSelectedId(newItem.id);
    setSelectedAnnoId(null);
  };

  const onDrawingDragOver = (e) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes("Files") && !bgImage) {
      setDraggingFile(true);
    }
  };
  const onDrawingDragLeave = (e) => {
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
        updateProject({ wires: [...wires, { id: "w_" + Date.now(), fromId: wireStart, toId: item.id }] });
        setWireStart(null);
      } else {
        setWireStart(null);
      }
      return;
    }
    setSelectedId(item.id);
    setSelectedAnnoId(null);
    const { x, y } = clientToDrawing(e.clientX, e.clientY);
    setDragOffset({ x: x - item.x, y: y - item.y });
    setDraggingPlacedId(item.id);
  };

  // ---------- Annotation interactions ----------
  const onAnnotationBodyMouseDown = (e, anno) => {
    if (tool === "pan" || spacePressed) return;
    e.stopPropagation();
    setSelectedAnnoId(anno.id);
    setSelectedId(null);
    const { x, y } = clientToDrawing(e.clientX, e.clientY);
    setDragOffset({ x: x - anno.x, y: y - anno.y });
    setDraggingAnno({ id: anno.id, mode: "body" });
  };
  const onAnnotationAnchorMouseDown = (e, anno) => {
    if (tool === "pan" || spacePressed) return;
    e.stopPropagation();
    setSelectedAnnoId(anno.id);
    setSelectedId(null);
    setDraggingAnno({ id: anno.id, mode: "anchor" });
  };

  // ---------- Viewport mouse handling ----------
  const onViewportMouseDown = (e) => {
    const explicitPan = e.button === 1 || spacePressed || tool === "pan";
    // Don't intercept clicks on real interactive elements inside the sheet
    const isInteractive =
      e.target.tagName === "INPUT" ||
      e.target.tagName === "TEXTAREA" ||
      e.target.tagName === "BUTTON" ||
      e.target.closest?.("button");
    if (isInteractive) return;

    // Pan when clicking blank workspace, sheet background, drawing background
    // (anywhere that isn't a symbol/annotation/text field)
    const onPannableBg =
      e.target === viewportRef.current ||
      e.target.closest?.("[data-sheet-bg]") ||
      e.target.closest?.("[data-drawing-bg]") && tool !== "note";

    const wantPan = explicitPan || (e.button === 0 && onPannableBg);

    if (wantPan) {
      e.preventDefault();
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
      if (e.button === 0 && onPannableBg) {
        setSelectedId(null);
        setSelectedAnnoId(null);
        setWireStart(null);
      }
      return;
    }

    // Click in drawing area in note mode → create a new annotation
    if (tool === "note" && e.target.closest?.("[data-drawing-bg]")) {
      const { x, y } = clientToDrawing(e.clientX, e.clientY);
      if (x < 0 || y < 0 || x > DRAW.w || y > DRAW.h) return;
      snapshot();
      const newAnno = {
        id: "a_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
        x, y,
        anchorX: x + 80, anchorY: y + 40,
        text: "Note",
      };
      updateProject({ annotations: [...annotations, newAnno] });
      setSelectedAnnoId(newAnno.id);
      setSelectedId(null);
      setTool("select");
    }
  };

  const onViewportMouseMove = (e) => {
    if (isPanning) {
      setPan({
        x: panStart.current.panX + (e.clientX - panStart.current.x),
        y: panStart.current.panY + (e.clientY - panStart.current.y),
      });
      return;
    }
    if (rotatingId) {
      const item = placed.find(p => p.id === rotatingId);
      if (!item) return;
      const { x, y } = clientToDrawing(e.clientX, e.clientY);
      const dx = x - item.x;
      const dy = y - item.y;
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
      const rounded = e.shiftKey ? Math.round(angle / 15) * 15 : Math.round(angle);
      updateProject({
        placed: placed.map(it =>
          it.id === rotatingId ? { ...it, rotation: ((rounded % 360) + 360) % 360 } : it
        ),
      });
      return;
    }
    if (draggingPlacedId) {
      const { x, y } = clientToDrawing(e.clientX, e.clientY);
      updateProject({
        placed: placed.map(it =>
          it.id === draggingPlacedId
            ? { ...it, x: x - dragOffset.x, y: y - dragOffset.y }
            : it
        ),
      });
      return;
    }
    if (draggingAnno) {
      const { x, y } = clientToDrawing(e.clientX, e.clientY);
      if (draggingAnno.mode === "body") {
        const target = annotations.find(a => a.id === draggingAnno.id);
        if (!target) return;
        const dx = (x - dragOffset.x) - target.x;
        const dy = (y - dragOffset.y) - target.y;
        updateProject({
          annotations: annotations.map(a =>
            a.id === draggingAnno.id
              ? { ...a, x: a.x + dx, y: a.y + dy, anchorX: a.anchorX + dx, anchorY: a.anchorY + dy }
              : a
          ),
        });
      } else if (draggingAnno.mode === "anchor") {
        updateProject({
          annotations: annotations.map(a =>
            a.id === draggingAnno.id ? { ...a, anchorX: x, anchorY: y } : a
          ),
        });
      }
    }
  };

  const onViewportMouseUp = () => {
    setDraggingPlacedId(null);
    setDraggingAnno(null);
    setRotatingId(null);
    setIsPanning(false);
  };

  // ---------- Symbol actions ----------
  const rotateSelected = () => {
    if (!selectedId) return;
    snapshot();
    updateProject({
      placed: placed.map(it =>
        it.id === selectedId ? { ...it, rotation: (it.rotation + 15) % 360 } : it
      ),
    });
  };
  const setRotation = (deg) => {
    if (!selectedId) return;
    updateProject({
      placed: placed.map(it =>
        it.id === selectedId ? { ...it, rotation: ((deg % 360) + 360) % 360 } : it
      ),
    });
  };
  const setItemScale = (s) => {
    if (!selectedId) return;
    const clamped = Math.max(0.4, Math.min(3, s));
    updateProject({
      placed: placed.map(it =>
        it.id === selectedId ? { ...it, scale: clamped } : it
      ),
    });
  };
  const normaliseSizes = () => {
    if (!placed.length) return;
    snapshot();
    updateProject({ placed: placed.map(it => ({ ...it, scale: 1 })) });
  };
  const deleteSelected = () => {
    if (selectedId) {
      snapshot();
      updateProject({
        placed: placed.filter(it => it.id !== selectedId),
        wires: wires.filter(w => w.fromId !== selectedId && w.toId !== selectedId),
      });
      setSelectedId(null);
    } else if (selectedAnnoId) {
      snapshot();
      updateProject({ annotations: annotations.filter(a => a.id !== selectedAnnoId) });
      setSelectedAnnoId(null);
    }
  };
  const updateLabel = (val) => {
    updateProject({
      placed: placed.map(it =>
        it.id === selectedId ? { ...it, label: val } : it
      ),
    });
  };
  const updateAnnoText = (val) => {
    updateProject({
      annotations: annotations.map(a =>
        a.id === selectedAnnoId ? { ...a, text: val } : a
      ),
    });
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
      else if (e.key === "Escape") { setSelectedId(null); setSelectedAnnoId(null); setWireStart(null); setTool("select"); setPrintPreview(false); setShowMeta(false); }
      else if ((e.metaKey || e.ctrlKey) && e.key === "z") { e.preventDefault(); undo(); }
      else if ((e.metaKey || e.ctrlKey) && (e.key === "y" || (e.shiftKey && e.key === "Z"))) { e.preventDefault(); redo(); }
      else if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); saveProject(); }
      else if ((e.metaKey || e.ctrlKey) && e.key === "p") { e.preventDefault(); setPrintPreview(true); }
      else if (e.key === "v" || e.key === "V") setTool("select");
      else if (e.key === "w" || e.key === "W") setTool("wire");
      else if (e.key === "h" || e.key === "H") setTool("pan");
      else if (e.key === "n" || e.key === "N") setTool("note");
      else if (e.key === "+" || e.key === "=") {
        const r = viewportRef.current?.getBoundingClientRect();
        if (r) zoomAt(r.left + r.width/2, r.top + r.height/2, 1.2);
      }
      else if (e.key === "-" || e.key === "_") {
        const r = viewportRef.current?.getBoundingClientRect();
        if (r) zoomAt(r.left + r.width/2, r.top + r.height/2, 1/1.2);
      }
      else if (e.key === "0") fitToScreen();
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

  // ---------- Save / Load / Export ----------
  const saveProject = async () => {
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
      // Backfill defaults for older save shapes
      setProject({
        ...DEFAULT_PROJECT,
        ...p,
        meta: { ...DEFAULT_PROJECT.meta, ...(p.meta || {}) },
        notes: p.notes || DEFAULT_PROJECT.notes,
        annotations: p.annotations || [],
        placed: (p.placed || []).map(it => ({ scale: 1, ...it })),
        wires: p.wires || [],
      });
      setTimeout(fitToScreen, 50);
    } catch (err) {
      alert("Load failed.");
    }
  };
  const exportJSON = () => {
    const data = JSON.stringify(project, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = (meta.projectName || "plan").replace(/[^a-z0-9-_]+/gi, "_") + ".json";
    a.click();
  };
  const printSheet = () => {
    window.print();
  };

  const selectedItem = placed.find(p => p.id === selectedId);
  const selectedAnno = annotations.find(a => a.id === selectedAnnoId);

  // Cursor over viewport
  const viewportCursor =
    isPanning ? "grabbing" :
    (tool === "pan" || spacePressed) ? "grab" :
    tool === "wire" ? "crosshair" :
    tool === "note" ? "text" :
    "default";

  // The list of distinct symbol IDs used in the current sheet (for the legend)
  const legendItems = useMemo(() => {
    const ids = new Set(placed.map(p => p.symbolId));
    return Array.from(ids).map(id => ({
      id,
      symbol: findSymbol(id),
      meta: SYMBOL_META[id] || { description: findSymbol(id)?.name || id, height: null },
    })).filter(x => x.symbol);
  }, [placed]);

  return (
    <div className="w-full h-screen flex flex-col bg-slate-100 text-slate-900 overflow-hidden select-none print:hidden"
         style={{ fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Inter', sans-serif" }}>

      {/* ==================== TOP BAR ==================== */}
      <TopBar
        meta={meta}
        onShowMeta={() => setShowMeta(true)}
        onImport={() => fileInputRef.current.click()}
        onUndo={undo} onRedo={redo}
        onSave={saveProject} savedFlash={savedFlash}
        onLoad={loadProject}
        onExportJSON={exportJSON}
        onPrint={() => setPrintPreview(true)}
        colourMode={colourMode}
        onToggleColour={() => setColourMode(m => m === "red" ? "colour" : m === "colour" ? "mono" : "red")}
        onNormalise={normaliseSizes}
        sidebarHidden={sidebarHidden}
        onToggleSidebar={() => setSidebarHidden(s => !s)}
      />
      <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden"
             onChange={(e) => handleFile(e.target.files[0])} />

      <div className="relative z-10 flex-1 flex overflow-hidden">

        {/* ==================== LEFT PALETTE ==================== */}
        {!sidebarHidden && (
          <PalettePanel
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            onPaletteDragStart={onPaletteDragStart}
            symbolScale={symbolScale}
            setSymbolScale={setSymbolScale}
            colourMode={colourMode}
          />
        )}

        {/* ==================== WORKSPACE (sheet inside) ==================== */}
        <main className="flex-1 relative overflow-hidden bg-slate-200"
              style={{ cursor: viewportCursor }}>
          <Workspace
            viewportRef={viewportRef}
            drawingAreaRef={drawingAreaRef}
            pan={pan} zoom={zoom}
            meta={meta} notes={notes}
            updateMeta={updateMeta}
            updateNotes={(n) => updateProject({ notes: n })}
            bgImage={bgImage}
            placed={placed} wires={wires} annotations={annotations}
            legendItems={legendItems}
            colourMode={colourMode}
            symbolSize={48 * symbolScale}
            selectedId={selectedId}
            selectedAnnoId={selectedAnnoId}
            wireStart={wireStart}
            tool={tool}
            spacePressed={spacePressed}
            DRAW={DRAW}
            onViewportMouseDown={onViewportMouseDown}
            onViewportMouseMove={onViewportMouseMove}
            onViewportMouseUp={onViewportMouseUp}
            onDrawingDrop={onDrawingDrop}
            onDrawingDragOver={onDrawingDragOver}
            onDrawingDragLeave={onDrawingDragLeave}
            onItemMouseDown={onItemMouseDown}
            onAnnotationBodyMouseDown={onAnnotationBodyMouseDown}
            onAnnotationAnchorMouseDown={onAnnotationAnchorMouseDown}
            startRotating={setRotatingId}
          />

          {/* Floating tool toolbar */}
          <FloatingToolbar tool={tool} setTool={(t) => { setTool(t); setWireStart(null); }} />

          {/* Floating zoom toolbar */}
          <ZoomControls
            zoom={zoom}
            onIn={() => {
              const r = viewportRef.current.getBoundingClientRect();
              zoomAt(r.left + r.width/2, r.top + r.height/2, 1.2);
            }}
            onOut={() => {
              const r = viewportRef.current.getBoundingClientRect();
              zoomAt(r.left + r.width/2, r.top + r.height/2, 1/1.2);
            }}
            onFit={fitToScreen}
          />

          {/* PDF loading */}
          {pdfLoading && (
            <div className="absolute inset-0 z-30 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center">
              <div className="bg-white px-8 py-5 rounded-xl ring-1 ring-slate-300 flex items-center gap-3">
                <Sparkles size={16} className="text-amber-700 animate-pulse"/>
                <span className="text-xs tracking-[0.2em] uppercase text-slate-800">Rendering PDF</span>
              </div>
            </div>
          )}

          {/* External file drop overlay */}
          {draggingFile && (
            <div className="absolute inset-4 z-30 rounded-2xl border-2 border-dashed border-amber-400/60 bg-amber-50 flex items-center justify-center pointer-events-none">
              <div className="text-amber-700 text-sm tracking-[0.2em] uppercase">Drop to import</div>
            </div>
          )}

          {/* Status bar */}
          <div className="absolute bottom-0 left-0 right-0 px-4 h-7 bg-white/95 backdrop-blur-xl text-slate-600 text-[10px] tracking-wider flex justify-between items-center border-t border-slate-200">
            <div className="flex gap-5">
              <span>SYMBOLS <span className="text-amber-700 tabular-nums ml-1">{placed.length}</span></span>
              <span>WIRES <span className="text-amber-700 tabular-nums ml-1">{wires.length}</span></span>
              <span>NOTES <span className="text-amber-700 tabular-nums ml-1">{annotations.length}</span></span>
              <span>TOOL <span className="text-amber-700 ml-1">{tool.toUpperCase()}</span></span>
              {tool === "wire" && wireStart && <span className="text-amber-700 animate-pulse">→ click target</span>}
              {tool === "note" && <span className="text-amber-700">click drawing area to add</span>}
              {spacePressed && <span className="text-amber-700">PAN</span>}
            </div>
            <div className="text-slate-400 tabular-nums">
              SHEET A3 · {meta.scale}
            </div>
          </div>
        </main>

        {/* ==================== RIGHT INSPECTOR ==================== */}
        {!sidebarHidden && (
          <Inspector
            selectedItem={selectedItem}
            selectedAnno={selectedAnno}
            updateLabel={updateLabel}
            updateAnnoText={updateAnnoText}
            setRotation={setRotation}
            setItemScale={setItemScale}
            rotateSelected={rotateSelected}
            deleteSelected={deleteSelected}
            placed={placed}
          />
        )}
      </div>

      {/* ==================== METADATA EDITOR ==================== */}
      {showMeta && (
        <MetaEditor meta={meta} updateMeta={updateMeta} onClose={() => setShowMeta(false)} />
      )}

      {/* ==================== PRINT PREVIEW ==================== */}
      {printPreview && (
        <PrintPreview
          project={project}
          legendItems={legendItems}
          colourMode={colourMode}
          DRAW={DRAW}
          onClose={() => setPrintPreview(false)}
          onPrint={printSheet}
        />
      )}
    </div>
  );
}
