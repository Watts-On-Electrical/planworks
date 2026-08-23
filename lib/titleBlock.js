// Per-account title block template. Set once in the Title block editor, applied
// to every drawing (editor + PDF), synced via the user's account.
//
// Shape: { details: [{ label, value }], logos: [ "<url or data-uri>" ] }
//
// The default ships NEUTRAL — no company name and no logos — so the app never
// imposes one user's branding (or third-party marks) on another. Each account
// sets its own company details and uploads its own logos in the Title block editor.

export const DEFAULT_TITLEBLOCK = {
  details: [
    { label: "Company", value: "" },
  ],
  logos: [],
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

/* ----------------------------------------------------------------------------
 * company_profile -> title block
 * ----------------------------------------------------------------------------
 * company_profile is the authoritative source of company identity. The sheet
 * renderers still speak { details: [{label, value}], logos: [] }, so the profile
 * is mapped onto that shape rather than rewriting them.
 *
 * The FIRST detail is rendered as the large bold company line, so company_name
 * must lead. Empty fields are dropped so the block never shows blank labels.
 *
 * The logo comes from the cached data-URI (logo_data_url), NEVER the signed
 * storage URL: a remote image taints the html2canvas canvas and the signed URL
 * expires after 8 hours, which would show a logo on screen that then went
 * missing from the exported PDF.
 * -------------------------------------------------------------------------- */
export function companyProfileToTitleBlock(profile) {
  if (!profile) return null;
  const details = [
    { label: "Company", value: profile.company_name },
    { label: "Address", value: profile.address },
    { label: "Tel",     value: profile.phone },
    { label: "Email",   value: profile.email },
    { label: "Web",     value: profile.website },
  ].filter((d) => d.value && String(d.value).trim())
   .map((d) => ({ label: d.label, value: String(d.value).trim() }));

  const logo = profile.logo_data_url;
  const logos = typeof logo === "string" && logo.startsWith("data:") ? [logo] : [];

  // Nothing worth showing: let the caller fall back to whatever it used before,
  // so an account that has not filled in a profile keeps its existing block.
  if (!details.length && !logos.length) return null;
  return { details, logos };
}

/* ----------------------------------------------------------------------------
 * Merge the profile-derived block over the legacy per-account block.
 * ----------------------------------------------------------------------------
 * company_profile is authoritative for company identity, but it only knows the
 * five fields it stores. Accounts set up before it existed keep other lines in
 * user_settings.titleBlock -- accreditation numbers, registration lines -- and
 * their scheme logos (NICEIC, NAPIT and so on). Replacing the legacy block
 * outright would wipe those off live drawings, so the profile wins per FIELD,
 * and everything it doesn't cover is carried through.
 * -------------------------------------------------------------------------- */
export function mergeTitleBlocks(profileBlock, legacyBlock) {
  const profileDetails = Array.isArray(profileBlock?.details) ? profileBlock.details : [];
  const legacyDetails  = Array.isArray(legacyBlock?.details)  ? legacyBlock.details  : [];

  const key = (d) => String((d && d.label) || "").trim().toLowerCase();
  const hasValue = (d) => d && String(d.value == null ? "" : d.value).trim() !== "";

  // Only the profile's labels claim a slot. Legacy labels are NOT added as we
  // go, so two legacy lines sharing a label both survive, as they did before.
  const claimed = new Set(profileDetails.map(key));

  const details = [
    // Profile first: the renderer shows detail[0] as the large company line.
    ...profileDetails,
    // Then whatever the profile doesn't cover. Blank lines are dropped --
    // DEFAULT_TITLEBLOCK ships { label: "Company", value: "" } and that must
    // never survive to shadow a real company name.
    ...legacyDetails.filter((d) => hasValue(d) && !claimed.has(key(d))),
  ];

  const profileLogos = Array.isArray(profileBlock?.logos) ? profileBlock.logos.filter(Boolean) : [];
  const legacyLogos  = Array.isArray(legacyBlock?.logos)  ? legacyBlock.logos.filter(Boolean)  : [];
  const logos = profileLogos.length ? profileLogos : legacyLogos;

  if (!details.length && !logos.length) return null;
  return { details, logos };
}
