// model/factory.ts
// Constructors for new data. Ported from your existing freshSheet / freshProject
// so behaviour matches today — just typed and in one place.

import type { Project, Sheet, PlacedItem, Annotation, Meta } from './types';
import { CURRENT_SCHEMA_VERSION } from './types';

export const sid = (): string => 's_' + Math.random().toString(36).slice(2, 9);

// Matches the app's DEFAULT_NOTES_TEXT so a freshly created project is identical
// whether it originates here or in the editor component.
export const DEFAULT_NOTES =
`FIXING HEIGHTS & LOCATION
Refer to Building Regulations Approved Document M for equipment mounting heights in all instances.

All switches & sockets in kitchen areas to be installed minimum 300mm clear of any adjacent sink, drainer or hob.

FIRE & SMOKE DETECTION
Dwelling to be provided with a fire detection and alarm system to Grade D2 Category LD3 standard, in accordance with BS 5839-6 (alarms in hallways and landings — circulation spaces and escape routes), plus alarms in kitchen and living room (high risk areas). Heat detection in kitchens and smoke detectors in circulation spaces.

IMPORTANT NOTE
The electrical layout provided is indicative only and to show locations of client required electrical items. Contractor to confirm all locations, runs and products with the client prior to purchase or installation of goods. All electrical works are to be carried out by a certified electrician and provide completion certificates. All works to be completed in accordance with BS 7671.`;

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
    furniture: [],
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
