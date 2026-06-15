// model/geometry.ts
// The ONE place symbol sizing is computed. The interactive canvas, the print
// preview, and the PDF export all import this — so they can never drift apart
// again (the screen-vs-print size bug came from two separate copies of this math).

export const SYMBOL_BASE = 48; // px, matching the "0 0 48 48" symbol viewBox

/** Final on-page size (px) of a placed symbol. */
export function symbolSize(sheetScale: number, itemScale: number): number {
  return SYMBOL_BASE * (sheetScale ?? 1) * (itemScale ?? 1);
}
