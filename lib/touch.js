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

/* ============================================================================
 * Sheet supersample factor
 * ----------------------------------------------------------------------------
 * iOS keeps the zoom wrapper on a composited layer -- pinch mutates its
 * transform continuously -- and then stretches that layer's cached raster.
 * Neither releasing will-change nor nudging a repaint on settle shifted it.
 *
 * So lay the sheet out N times larger and scale the wrapper down by the same
 * N. The mapping from stored coordinates to the screen is unchanged, but the
 * layer now holds N times the detail when iOS rasterises it, so a stretch has
 * more to work with.
 *
 * HARD CAP OF 2, by construction -- this function can return nothing else.
 * 1587 x 1123 at 3x is ~16M pixels, right on iOS Safari's canvas ceiling;
 * 2x is ~7M and safe.
 *
 * Ships DARK. Touch devices only, and only with ?supersample=1 on the URL or
 * NEXT_PUBLIC_SUPERSAMPLE=true in the environment.
 * ========================================================================= */
export function supersampleFactor() {
  if (typeof window === "undefined") return 1;
  if (!isTouchDevice()) return 1;
  try {
    if (new URLSearchParams(window.location.search).get("supersample") === "1") return 2;
  } catch { /* ignore */ }
  return process.env.NEXT_PUBLIC_SUPERSAMPLE === "true" ? 2 : 1;
}
