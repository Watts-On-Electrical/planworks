// model/factory.ts
// Constructors for new data. Ported from your existing freshSheet / freshProject
// so behaviour matches today — just typed and in one place.

import type { Project, Sheet, PlacedItem, Annotation, Meta } from './types';
import { CURRENT_SCHEMA_VERSION } from './types';

export const sid = (): string => 's_' + Math.random().toString(36).slice(2, 9);

// TODO: paste your real DEFAULT_NOTES_TEXT here.
export const DEFAULT_NOTES = '';

export function defaultMeta(): Meta {
  return {
    projectName: '',
    plot: '',
    sheetName: 'Ground Floor MEP Plan',
    scale: '1:50 @ A3',
    drawingNumber: '',
    date: new Date().toISOString().slice(0, 10),
    revision: 'A',
    revNote: 'First Issue',
    company: 'Watts On Electrical Ltd',
    clientName: '',
    clientEmail: '',
  };
}

export function freshSheet(name = 'Ground floor'): Sheet {
  return {
    id: sid(),
    name,
    drawingNumber: '',
    symbolScale: 1,
    bgImage: null,
    placed: [],
    wires: [],
    annotations: [],
    notes: DEFAULT_NOTES,
  };
}

export function freshProject(): Project {
  const sheet = freshSheet('Ground floor');
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    meta: defaultMeta(),
    notes: DEFAULT_NOTES,
    boq: null,
    titleBlock: null,
    sheets: [sheet],
    activeSheetId: sheet.id,
  };
}

export function makeItem(symbolId: string, x: number, y: number): PlacedItem {
  return { id: sid(), symbolId, x, y, rotation: 0, scale: 1, label: '' };
}

export function makeAnnotation(x: number, y: number): Annotation {
  return { id: sid(), x, y, anchorX: x + 80, anchorY: y + 40, text: 'Note' };
}
