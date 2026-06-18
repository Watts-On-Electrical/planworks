/* ============================================================================
 * Bill of Quantities → Word (.docx) generator
 *
 * Reproduces the company's standard "Electrical Bill of Quantities" template:
 *   - Title + subtitle
 *   - Project header table (Development / Site Address / Prepared by / …)
 *   - Notes to Supplier (bullets)
 *   - Sections, each a 6-column table (# | Item | Specification / Notes |
 *     Qty | Unit Rate (£) | Total (£)) with a subtotal row:
 *        1. First Fix      (standard line items, blank qty — manual entry)
 *        2. Second Fix     (standard line items, QTY AUTO-FILLED from the
 *                           layout drawing; unmapped placed symbols appended)
 *        3. Consumer Unit  (standard line items, blank qty — manual entry)
 *        4. Ducting        (standard line items, blank qty — manual entry)
 *   - Plot Total summary
 *
 * The builder takes the `docx` module as an argument so it runs both in Node
 * (for testing) and in the browser (via dynamic import).
 * ========================================================================= */

const NAVY = "2C3E50";
const TEAL = "3FB7CA";
const LIGHT = "EEF6F8";
const SUBTOT = "DCEAF0";
const BORDER = "B8C2CC";
const COLS = [460, 2360, 2780, 900, 1240, 1286]; // sums to 9026 (A4 portrait, 1" margins)
const CONTENT_W = 9026;

// ---- Standard template line items -----------------------------------------
const FIRST_FIX = [
  ["1.0mm\u00B2 twin & earth", "BS 6004, grey"],
  ["1mm\u00B2 3 core", "BS 6004, grey"],
  ["2.5mm\u00B2 twin & earth", "BS 6004, grey"],
  ["4.0mm\u00B2 twin & earth", "BS 6004, grey"],
  ["6.0mm\u00B2 twin & earth", "BS 6004, grey"],
  ["Coax", "Single"],
  ["25mm\u00B2 meter tails", "6181Y, single core, brown/blue"],
  ["25mm\u00B2 SWA + internal gland pack", "3-core"],
  ["1.5mm\u00B2 cable clips", "Round band, white"],
  ["2.5mm\u00B2 cable clips", "Round band, white"],
  ["4\u20136mm\u00B2 cable clips", "Round band, white"],
  ["10mm\u00B2 cable clips", "Round band, white"],
  ["25mm back boxes", "Galvanised steel, 1G & 2G as required"],
  ["35mm Fast-Fix back boxes", "Dry-lining / plasterboard, 1G & 2G as required"],
  ["Cable ties", "Assorted lengths, black/white"],
  ["Round band", "Round band cable clips, assorted sizes"],
  ["20mm grommets", "Open / closed rubber grommets"],
  ["1\u00BD\" screws with plugs", "Red plugs"],
  ["Flexicon conduit", "20mm flexible nylon conduit"],
];

// Second Fix: [item, spec, [mapped app symbol ids]]
const SECOND_FIX = [
  ["Fused spurs", "White \u2013 Click Mode", ["sock_fcu"]],
  ["Single sockets", "White \u2013 Click Mode", ["sock_sso_ll", "sock_sso_hl"]],
  ["Double sockets", "White \u2013 Click Mode", ["sock_dso_ll", "sock_dso_hl"]],
  ["Double sockets with USB", "White \u2013 Click Mode", ["sock_dso_usb_ll", "sock_dso_usb_hl"]],
  ["External sockets", "Grey \u2013 Click Mode", []],
  ["TV points", "White \u2013 Click Mode", ["sock_tv"]],
  ["Data points", "White \u2013 Click Mode", ["data_point"]],
  ["Shaver points", "White \u2013 Click Mode", ["sock_shaver"]],
  ["1 gang light switch", "White \u2013 Click Mode", ["sw_light"]],
  ["2 gang light switch", "White \u2013 Click Mode", ["sw_2g"]],
  ["3 gang light switch", "White \u2013 Click Mode", ["sw_3g"]],
  ["4 gang light switch", "White \u2013 Click Mode", ["sw_4g"]],
  ["2-way light switch", "White \u2013 Click Mode", ["sw_2way"]],
  ["Intermediate light switch", "White \u2013 Click Mode", ["sw_intermediate"]],
  ["Dimmer switch", "LED trailing-edge \u2013 White", ["sw_dimmer"]],
  ["Pull cord switch", "Ceiling pull \u2013 White", ["sw_pull"]],
  ["PIR lighting sensor", "Ceiling presence detector", ["sw_pir_light"]],
  ["Keycard switch", "White \u2013 Click Mode", ["sw_keycard"]],
  ["Grid switches", "Brushed chrome \u2013 Click", ["sw_grid"]],
  ["20A double-pole switches", "White \u2013 Click Mode", []],
  ["Fan isolators", "Fused fan isolator \u2013 White", []],
  ["32A rotary isolator", "4-pole rotary isolator IP65", []],
  ["EV charge point", "7.4kW single-phase", []],
  ["Pendants", "6\" white pendant / batten holder", ["lt_pendant", "lt_batten"]],
  ["Downlights", "JCC X50 \u2013 white bezel", ["lt_downlight", "lt_downlight_ip"]],
  ["External up & down lights", "Dawn/Dusk \u2013 GU10 warm white", ["lt_external_updown"]],
  ["Smoke detectors", "AICO \u2013 10 year / 230v", ["det_smoke"]],
  ["Heat detectors", "AICO \u2013 10 year / 230v", ["det_heat"]],
];

const CONSUMER_UNIT = [
  ["Consumer unit", "Elucian 16-way + SPD \u2013 RCBO"],
  ["6A MCB / RCBO", "RCBO"],
  ["10A MCB / RCBO", "RCBO"],
  ["16A MCB / RCBO", "RCBO"],
  ["20A MCB / RCBO", "RCBO"],
  ["32A MCB / RCBO", "RCBO"],
  ["40A MCB / RCBO", "RCBO"],
  ["100A SP & N fused switch", "Fusebox"],
];

const DUCTING = [
  ["4\" solid ducting", "100mm rigid round duct"],
  ["5\" solid ducting", "125mm rigid round duct"],
  ["4\" couplers", "100mm round duct connector"],
  ["4\" 90\u00B0 bends", "100mm round 90\u00B0 bend"],
  ["4\" 45\u00B0 bends", "100mm round 45\u00B0 bend"],
  ["5\" couplers", "125mm round duct connector"],
  ["5\" 90\u00B0 bends", "125mm round 90\u00B0 bend"],
  ["5\" 45\u00B0 bends", "125mm round 45\u00B0 bend"],
  ["4\" fixed grille", "100mm external wall grille"],
  ["5\" grille", "125mm external wall grille"],
];

export function buildBoqDocument(docx, { meta, rows, total }) {
  const {
    Document, Paragraph, TextRun, Table, TableRow, TableCell,
    AlignmentType, BorderStyle, WidthType, ShadingType,
    LevelFormat, VerticalAlign,
  } = docx;

  const cb = { style: BorderStyle.SINGLE, size: 4, color: BORDER };
  const borders = { top: cb, bottom: cb, left: cb, right: cb };

  // counts by symbol id
  const counts = {};
  (rows || []).forEach(r => { counts[r.id] = (counts[r.id] || 0) + r.qty; });

  const run = (text, o = {}) => new TextRun({
    text: String(text ?? ""), bold: !!o.bold, italics: !!o.italics,
    color: o.color, size: o.size || 18, font: "Arial",
  });
  const txt = (text, o = {}) => new Paragraph({
    alignment: o.align || AlignmentType.LEFT, spacing: o.spacing || { after: 0 },
    children: [run(text, o)],
  });

  const cell = (content, { w, align, bold, fill, color } = {}) => new TableCell({
    borders, width: w ? { size: w, type: WidthType.DXA } : undefined,
    shading: fill ? { fill, type: ShadingType.CLEAR, color: "auto" } : undefined,
    margins: { top: 48, bottom: 48, left: 90, right: 90 },
    verticalAlign: VerticalAlign.CENTER,
    children: [txt(content, { align: align || AlignmentType.LEFT, bold, color, size: 18 })],
  });

  const hCell = (label, align) => new TableCell({
    borders, shading: { fill: NAVY, type: ShadingType.CLEAR, color: "auto" },
    margins: { top: 54, bottom: 54, left: 90, right: 90 }, verticalAlign: VerticalAlign.CENTER,
    children: [txt(label, { bold: true, color: "FFFFFF", align: align || AlignmentType.LEFT })],
  });

  const headerRow = () => new TableRow({
    tableHeader: true,
    children: [
      hCell("#", AlignmentType.CENTER), hCell("Item"), hCell("Specification / Notes"),
      hCell("Qty", AlignmentType.CENTER), hCell("Unit Rate (\u00A3)", AlignmentType.CENTER),
      hCell("Total (\u00A3)", AlignmentType.CENTER),
    ],
  });

  const itemRow = (n, item, spec, qty) => new TableRow({ children: [
    cell(String(n), { w: COLS[0], align: AlignmentType.CENTER }),
    cell(item, { w: COLS[1], bold: true }),
    cell(spec, { w: COLS[2] }),
    cell(qty != null && qty !== "" ? String(qty) : "", { w: COLS[3], align: AlignmentType.CENTER }),
    cell("", { w: COLS[4] }),
    cell("", { w: COLS[5] }),
  ]});

  const subtotalRow = (label) => new TableRow({ children: [
    new TableCell({ borders, columnSpan: 5,
      width: { size: COLS[0] + COLS[1] + COLS[2] + COLS[3] + COLS[4], type: WidthType.DXA },
      shading: { fill: SUBTOT, type: ShadingType.CLEAR, color: "auto" },
      margins: { top: 48, bottom: 48, left: 90, right: 90 }, verticalAlign: VerticalAlign.CENTER,
      children: [txt(label, { bold: true, align: AlignmentType.RIGHT })] }),
    cell("", { w: COLS[5], fill: SUBTOT }),
  ]});

  const sectionHeading = (t) => new Paragraph({
    spacing: { before: 220, after: 80 },
    children: [run(t, { bold: true, size: 24, color: NAVY })],
  });

  const buildTable = (rowsArr) => new Table({
    width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: COLS, rows: rowsArr,
  });

  // ---- First Fix (blank qty) ----
  const firstFixRows = [headerRow(),
    ...FIRST_FIX.map(([i, s], idx) => itemRow(idx + 1, i, s, "")),
    subtotalRow("First Fix Subtotal"),
  ];

  // ---- Second Fix (auto-filled) ----
  const usedIds = new Set();
  const sfRows = SECOND_FIX.map(([item, spec, ids], idx) => {
    let q = 0;
    ids.forEach(id => { if (counts[id]) { q += counts[id]; usedIds.add(id); } });
    return itemRow(idx + 1, item, spec, q > 0 ? q : "");
  });
  // Append any placed symbols not mapped above, so nothing is lost
  const extras = (rows || [])
    .filter(r => !usedIds.has(r.id) && r.qty > 0)
    .map(r => ({ desc: r.description, height: r.height, qty: r.qty }));
  let n = SECOND_FIX.length;
  const extraRows = [];
  if (extras.length) {
    extraRows.push(new TableRow({ children: [
      cell("", { w: COLS[0], fill: LIGHT }),
      new TableCell({ borders, columnSpan: 2,
        width: { size: COLS[1] + COLS[2], type: WidthType.DXA },
        shading: { fill: LIGHT, type: ShadingType.CLEAR, color: "auto" },
        margins: { top: 48, bottom: 48, left: 90, right: 90 }, verticalAlign: VerticalAlign.CENTER,
        children: [txt("Additional items (from drawing)", { bold: true })] }),
      cell("", { w: COLS[3], fill: LIGHT }),
      cell("", { w: COLS[4], fill: LIGHT }),
      cell("", { w: COLS[5], fill: LIGHT }),
    ]}));
    extras.forEach(e => {
      n += 1;
      extraRows.push(itemRow(n, e.desc, e.height && e.height !== "\u2014" ? e.height : "", e.qty));
    });
  }
  const secondFixRows = [headerRow(), ...sfRows, ...extraRows, subtotalRow("Second Fix Subtotal")];

  // ---- Consumer Unit (blank qty) ----
  const cuRows = [headerRow(),
    ...CONSUMER_UNIT.map(([i, s], idx) => itemRow(idx + 1, i, s, "")),
    subtotalRow("Consumer Unit Subtotal"),
  ];

  // ---- Ducting (blank qty) ----
  const ductRows = [headerRow(),
    ...DUCTING.map(([i, s], idx) => itemRow(idx + 1, i, s, "")),
    subtotalRow("Ducting Subtotal"),
  ];

  // ---- Project header table ----
  const todayStr = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
  const infoRow = (label, value) => new TableRow({ children: [
    new TableCell({ borders, width: { size: 2400, type: WidthType.DXA },
      shading: { fill: LIGHT, type: ShadingType.CLEAR, color: "auto" },
      margins: { top: 50, bottom: 50, left: 100, right: 100 },
      children: [txt(label, { bold: true })] }),
    new TableCell({ borders, width: { size: CONTENT_W - 2400, type: WidthType.DXA },
      margins: { top: 50, bottom: 50, left: 100, right: 100 },
      children: [txt(value)] }),
  ]});
  const infoTable = new Table({
    width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: [2400, CONTENT_W - 2400],
    rows: [
      infoRow("Development", meta.projectName || "\u2014"),
      infoRow("Site Address", meta.plot || "\u2014"),
      infoRow("Prepared by", meta.company || ""),
      infoRow("Supplier", "\u2014"),
      infoRow("Drawing No.", meta.drawingNumber || "\u2014"),
      infoRow("Date issued", meta.date || todayStr),
      infoRow("Required on site", "\u2014"),
    ],
  });

  // ---- Plot total summary ----
  const totRow = (label, strong) => new TableRow({ children: [
    new TableCell({ borders, width: { size: 6800, type: WidthType.DXA },
      shading: strong ? { fill: NAVY, type: ShadingType.CLEAR, color: "auto" } : { fill: LIGHT, type: ShadingType.CLEAR, color: "auto" },
      margins: { top: 50, bottom: 50, left: 100, right: 100 },
      children: [txt(label, { bold: true, color: strong ? "FFFFFF" : undefined })] }),
    new TableCell({ borders, width: { size: CONTENT_W - 6800, type: WidthType.DXA },
      margins: { top: 50, bottom: 50, left: 100, right: 100 }, children: [txt("")] }),
  ]});
  const totalTable = new Table({
    width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: [6800, CONTENT_W - 6800],
    rows: [
      totRow("First Fix Subtotal"), totRow("Second Fix Subtotal"),
      totRow("Consumer Unit Subtotal"), totRow("Ducting Subtotal"),
      totRow("PROJECT TOTAL (ex-VAT)", true),
    ],
  });

  // ---- Notes to Supplier ----
  const noteBullets = [
    "All prices ex-VAT, in GBP, to include delivery to site unless stated.",
    "Goods to comply with BS 7671:2018+A2:2022 (18th Edition) and current British Standards.",
    "Where \u201CTBC\u201D is shown, please quote your equivalent product and confirm lead time.",
    "Quote to remain valid for a minimum of 30 days.",
    "Second Fix quantities are taken from the electrical layout drawing; remaining sections to be completed and confirmed per plot prior to order.",
  ].map(t => new Paragraph({
    numbering: { reference: "boq-bullets", level: 0 }, spacing: { after: 40 },
    children: [run(t)],
  }));

  return new Document({
    styles: { default: { document: { run: { font: "Arial", size: 18 } } } },
    numbering: { config: [{
      reference: "boq-bullets",
      levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 480, hanging: 240 } } } }],
    }]},
    sections: [{
      properties: { page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
      }},
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 },
          children: [run("ELECTRICAL BILL OF QUANTITIES", { bold: true, size: 36, color: NAVY })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: TEAL, space: 6 } },
          children: [run(meta.projectName || "Electrical Layout Schedule", { size: 22, color: "555555" })] }),
        infoTable,
        new Paragraph({ spacing: { before: 240, after: 80 }, children: [run("Notes to Supplier", { bold: true, size: 22, color: NAVY })] }),
        ...noteBullets,
        sectionHeading("1.  First Fix"),
        buildTable(firstFixRows),
        sectionHeading("2.  Second Fix  (quantities from layout drawing)"),
        buildTable(secondFixRows),
        sectionHeading("3.  Consumer Unit"),
        buildTable(cuRows),
        sectionHeading("4.  Ducting"),
        buildTable(ductRows),
        new Paragraph({ spacing: { before: 240, after: 80 }, children: [run("Plot Total", { bold: true, size: 22, color: NAVY })] }),
        totalTable,
        new Paragraph({ spacing: { before: 200 },
          children: [run("Unit rates and totals to be completed by supplier. This schedule is issued for pricing.", { italics: true, size: 16, color: "777777" })] }),
      ],
    }],
  });
}
