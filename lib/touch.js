"use client";

/* ============================================================================
 * Touch-device detection
 * ----------------------------------------------------------------------------
 * One definition, shared by everything that has to behave differently on an
 * iPad. It was written inline in the PDF export first; the drawing editor and
 * the CAD sketch now need the same answer, and three copies of a device check
 * that must agree is three chances for them to disagree.
 *
 * Deliberately NOT a media query in CSS: the callers use it to decide what to
 * put in a style object and what scale to rasterise at, which CSS can't
 * express, and keeping one mechanism means one thing to reason about.
 *
 * Safe before hydration -- returns false when there is no window.
 * ========================================================================= */

export function isTouchDevice() {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  if (navigator.maxTouchPoints > 1) return true;
  return Boolean(window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
}
