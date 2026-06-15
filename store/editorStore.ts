// store/editorStore.ts
// The single home for editor state. Components read exactly what they need with
// useEditor(...) — no props threaded through Workspace → Sheet → DrawingArea, so
// there's no link to miss and nothing to crash. Adding a feature = add it here.
//
// Setup:  npm i zustand
// Usage:  const tool = useEditor(s => s.tool);
//         const placeSymbol = useEditor(s => s.placeSymbol);

import { create } from 'zustand';
import type { Project, Sheet, Wire, Annotation, Selection, Tool, ID } from '../model/types';
import { freshProject, makeItem, makeAnnotation } from '../model/factory';

const initial = freshProject();

interface EditorState {
  // ---------- state ----------
  project: Project;
  activeSheetId: ID;
  selection: Selection;
  tool: Tool;
  pan: { x: number; y: number };
  zoom: number;

  // ---------- selectors ----------
  activeSheet(): Sheet;

  // ---------- project / sheet ----------
  setProject(p: Project | ((prev: Project) => Project)): void;
  patchActiveSheet(patch: Partial<Sheet>): void;
  switchSheet(id: ID): void;
  setSymbolScale(scale: number): void;

  // ---------- items / wires / annotations ----------
  placeSymbol(symbolId: string, x: number, y: number): void;
  moveItem(id: ID, x: number, y: number): void;
  rotateSelected(): void;
  addWire(fromId: ID, toId: ID): void;
  addAnnotation(x: number, y: number): void;
  deleteSelection(): void;

  // ---------- selection / tool / view ----------
  select(sel: Selection): void;
  clearSelection(): void;
  // Compatibility setters mirroring the old per-kind selection state.
  // Setting an id selects that kind; passing null only clears if that kind
  // is the current selection (so clearing one kind never wipes another).
  setSelectedId(id: ID | null): void;
  setSelectedAnnoId(id: ID | null): void;
  setSelectedWireId(id: ID | null): void;
  setTool(tool: Tool): void;
  setView(pan: { x: number; y: number }, zoom: number): void;
  // useState-style setters: accept a direct value OR an updater function.
  setPan(p: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })): void;
  setZoom(z: number | ((prev: number) => number)): void;
}

export const useEditor = create<EditorState>((set, get) => ({
  project: initial,
  activeSheetId: initial.activeSheetId,
  selection: null,
  tool: 'select',
  pan: { x: 0, y: 0 },
  zoom: 0.5,

  activeSheet() {
    const { project, activeSheetId } = get();
    return project.sheets.find(s => s.id === activeSheetId) ?? project.sheets[0];
  },

  setProject: (p) => set(s => ({ project: typeof p === 'function' ? p(s.project) : p })),

  // Every sheet edit goes through here, so it ALWAYS preserves the other fields
  // (e.g. symbolScale) — that's the bug that kept dropping the per-floor size.
  patchActiveSheet(patch) {
    set(s => ({
      project: {
        ...s.project,
        sheets: s.project.sheets.map(sh =>
          sh.id === s.activeSheetId ? { ...sh, ...patch } : sh
        ),
      },
    }));
  },

  switchSheet(id) {
    set({ activeSheetId: id, selection: null });
  },

  setSymbolScale(scale) {
    get().patchActiveSheet({ symbolScale: scale });
  },

  placeSymbol(symbolId, x, y) {
    const item = makeItem(symbolId, x, y);
    const sheet = get().activeSheet();
    get().patchActiveSheet({ placed: [...sheet.placed, item] });
    set({ selection: { kind: 'symbol', id: item.id } });
  },

  moveItem(id, x, y) {
    const sheet = get().activeSheet();
    get().patchActiveSheet({
      placed: sheet.placed.map(it => (it.id === id ? { ...it, x, y } : it)),
    });
  },

  rotateSelected() {
    const sel = get().selection;
    if (sel?.kind !== 'symbol') return;
    const sheet = get().activeSheet();
    get().patchActiveSheet({
      placed: sheet.placed.map(it =>
        it.id === sel.id ? { ...it, rotation: (it.rotation + 90) % 360 } : it
      ),
    });
  },

  addWire(fromId, toId) {
    if (fromId === toId) return;
    const sheet = get().activeSheet();
    const wire: Wire = { id: 's_' + Math.random().toString(36).slice(2, 9), fromId, toId };
    get().patchActiveSheet({ wires: [...sheet.wires, wire] });
  },

  addAnnotation(x, y) {
    const anno: Annotation = makeAnnotation(x, y);
    const sheet = get().activeSheet();
    get().patchActiveSheet({ annotations: [...sheet.annotations, anno] });
    set({ selection: { kind: 'annotation', id: anno.id } });
  },

  // The whole "delete whatever is selected" rule lives in ONE place. Compare this
  // to the version that needed selection state threaded through three components.
  deleteSelection() {
    const sel = get().selection;
    if (!sel) return;
    const sheet = get().activeSheet();
    if (sel.kind === 'symbol') {
      get().patchActiveSheet({
        placed: sheet.placed.filter(it => it.id !== sel.id),
        wires: sheet.wires.filter(w => w.fromId !== sel.id && w.toId !== sel.id),
      });
    } else if (sel.kind === 'wire') {
      get().patchActiveSheet({ wires: sheet.wires.filter(w => w.id !== sel.id) });
    } else if (sel.kind === 'annotation') {
      get().patchActiveSheet({ annotations: sheet.annotations.filter(a => a.id !== sel.id) });
    }
    set({ selection: null });
  },

  select(sel) { set({ selection: sel }); },
  clearSelection() { set({ selection: null }); },
  setSelectedId: (id) =>
    set(s => ({ selection: id ? { kind: 'symbol', id } : (s.selection?.kind === 'symbol' ? null : s.selection) })),
  setSelectedAnnoId: (id) =>
    set(s => ({ selection: id ? { kind: 'annotation', id } : (s.selection?.kind === 'annotation' ? null : s.selection) })),
  setSelectedWireId: (id) =>
    set(s => ({ selection: id ? { kind: 'wire', id } : (s.selection?.kind === 'wire' ? null : s.selection) })),
  setTool(tool) { set({ tool }); },
  setView(pan, zoom) { set({ pan, zoom }); },
  setPan: (p) => set(s => ({ pan: typeof p === 'function' ? p(s.pan) : p })),
  setZoom: (z) => set(s => ({ zoom: typeof z === 'function' ? z(s.zoom) : z })),
}));
