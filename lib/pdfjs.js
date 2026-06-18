// Shared pdf.js loader.
//
// pdf.js is loaded from CDN on demand (it's large, and not every session touches
// a PDF). This used to happen ONLY inside the import flow, which meant opening an
// already-saved PDF drawing in a fresh session left the renderer with no library
// to draw with — a blank plan. This helper makes loading available everywhere:
// both the importer and the on-screen renderer call it before using pdf.js.
//
// Safe to call repeatedly and concurrently; it resolves once window.pdfjsLib is
// ready and its worker is configured.

const PDFJS_VERSION = "3.11.174";
const PDFJS_SRC = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js`;
const PDFJS_WORKER = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`;

let _loadPromise = null;

function configureWorker() {
  if (window.pdfjsLib && window.pdfjsLib.GlobalWorkerOptions &&
      !window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
  }
}

export function ensurePdfjs() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("pdf.js can only load in the browser"));
  }
  if (window.pdfjsLib) {
    configureWorker();
    return Promise.resolve(window.pdfjsLib);
  }
  if (_loadPromise) return _loadPromise;
  _loadPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = PDFJS_SRC;
    s.async = true;
    s.onload = () => {
      try { configureWorker(); resolve(window.pdfjsLib); }
      catch (e) { reject(e); }
    };
    s.onerror = () => { _loadPromise = null; reject(new Error("Failed to load PDF library")); };
    document.head.appendChild(s);
  });
  return _loadPromise;
}
