// Per-account title block template. Set once in the Title block editor, applied
// to every drawing (editor + PDF), synced via the user's account.
//
// Shape: { details: [{ label, value }], logos: [ "<url or data-uri>" ] }
//
// The default reproduces the current Watts On branding so nothing changes for
// existing drawings until the user customises it.

export const DEFAULT_TITLEBLOCK = {
  details: [
    { label: "Company", value: "Watts On Electrical Ltd" },
  ],
  logos: ["/logos/watts.png", "/logos/napit.png", "/logos/trustmark.png"],
};

export function normaliseTitleBlock(tb) {
  if (!tb || typeof tb !== "object") return DEFAULT_TITLEBLOCK;
  return {
    details: Array.isArray(tb.details) ? tb.details : DEFAULT_TITLEBLOCK.details,
    logos: Array.isArray(tb.logos) ? tb.logos : [],
  };
}

// Downscale an uploaded image to a small PNG data-URI so the saved config stays
// light (logos render at ~40px tall, so 130px keeps them crisp on retina).
export function resizeImageToDataUrl(file, maxHeight = 130) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not load image"));
      img.onload = () => {
        const scale = Math.min(1, maxHeight / img.height);
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        const ctx = c.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h); // transparency preserved
        resolve(c.toDataURL("image/png"));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
