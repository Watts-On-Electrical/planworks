/* ============================================================================
 * Bill of Quantities → Word (.docx) generator
 *
 * Produces a document in the same format as the company's standard
 * "Electrical Bill of Quantities" template:
 *   - Title + subtitle
 *   - Project header table (Development / Site Address / Prepared by / …)
 *   - Notes to Supplier (bullets)
 *   - Items table: # | Item | Specification / Notes | Qty | Unit Rate (£) | Total (£)
 *
 * The builder takes the `docx` module as an argument so it can run both in
 * Node (for testing) and in the browser (via dynamic import).
 * ========================================================================= */

const NAVY = "2C3E50";   // Watts On brand navy
const TEAL = "3FB7CA";   // Watts On brand teal
const LIGHT = "EEF6F8";  // pale teal row tint
const BORDER = "B8C2CC";

export function buildBoqDocument(docx, { meta, rows, total }) {
  const {
    Document, Paragraph, TextRun, Table, TableRow, TableCell,
    AlignmentType, BorderStyle, WidthType, ShadingType, HeadingLevel,
    LevelFormat, VerticalAlign,
  } = docx;

  const CONTENT_W = 9026; // A4 portrait, 1" margins

  const cellBorder = { style: BorderStyle.SINGLE, size: 4, color: BORDER };
  const borders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

  // ---- helpers ----------------------------------------------------------
  const txt = (text, opts = {}) =>
    new Paragraph({
      alignment: opts.align || AlignmentType.LEFT,
      spacing: opts.spacing || { after: 0 },
      children: [new TextRun({
        text: String(text ?? ""),
        bold: !!opts.bold,
        color: opts.color,
        size: opts.size || 18, // half-points → 9pt
        font: "Arial",
      })],
    });

  const headerCell = (label) =>
    new TableCell({
      borders,
      shading: { fill: NAVY, type: ShadingType.CLEAR, color: "auto" },
      margins: { top: 60, bottom: 60, left: 100, right: 100 },
      verticalAlign: VerticalAlign.CENTER,
      children: [txt(label, { bold: true, color: "FFFFFF", size: 18 })],
    });

  const bodyCell = (content, { width, align, bold, fill } = {}) =>
    new TableCell({
      borders,
      width: width ? { size: width, type: WidthType.DXA } : undefined,
      shading: fill ? { fill, type: ShadingType.CLEAR, color: "auto" } : undefined,
      margins: { top: 50, bottom: 50, left: 100, right: 100 },
      verticalAlign: VerticalAlign.CENTER,
      children: [txt(content, { align: align || AlignmentType.LEFT, bold: !!bold, size: 18 })],
    });

  // ---- project header table --------------------------------------------
  const infoRow = (label, value) =>
    new TableRow({
      children: [
        new TableCell({
          borders, width: { size: 2400, type: WidthType.DXA },
          shading: { fill: LIGHT, type: ShadingType.CLEAR, color: "auto" },
          margins: { top: 50, bottom: 50, left: 100, right: 100 },
          children: [txt(label, { bold: true, size: 18 })],
        }),
        new TableCell({
          borders, width: { size: CONTENT_W - 2400, type: WidthType.DXA },
          margins: { top: 50, bottom: 50, left: 100, right: 100 },
          children: [txt(value, { size: 18 })],
        }),
      ],
    });

  const todayStr = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });

  const infoTable = new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [2400, CONTENT_W - 2400],
    rows: [
      infoRow("Development", meta.projectName || "—"),
      infoRow("Site Address", meta.plot || "—"),
      infoRow("Prepared by", meta.company || "Watts On Electrical Ltd"),
      infoRow("Drawing No.", meta.drawingNumber || "—"),
      infoRow("Date issued", meta.date || todayStr),
    ],
  });

  // ---- items table ------------------------------------------------------
  const COLS = [500, 2400, 2800, 900, 1200, 1226]; // sums to 9026
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      headerCell("#"), headerCell("Item"), headerCell("Specification / Notes"),
      headerCell("Qty"), headerCell("Unit Rate (£)"), headerCell("Total (£)"),
    ],
  });

  const itemRows = rows.map((r, i) =>
    new TableRow({
      children: [
        bodyCell(String(i + 1), { width: COLS[0], align: AlignmentType.CENTER }),
        bodyCell(r.description, { width: COLS[1], bold: true }),
        bodyCell(r.height && r.height !== "—" ? r.height : "", { width: COLS[2] }),
        bodyCell(String(r.qty), { width: COLS[3], align: AlignmentType.CENTER }),
        bodyCell("", { width: COLS[4] }),
        bodyCell("", { width: COLS[5] }),
      ],
    })
  );

  const totalRow = new TableRow({
    children: [
      bodyCell("", { width: COLS[0], fill: LIGHT }),
      bodyCell("", { width: COLS[1], fill: LIGHT }),
      bodyCell("", { width: COLS[2], fill: LIGHT }),
      bodyCell("TOTAL", { width: COLS[3], bold: true, align: AlignmentType.CENTER, fill: LIGHT }),
      bodyCell(String(total), { width: COLS[4], bold: true, align: AlignmentType.CENTER, fill: LIGHT }),
      bodyCell("", { width: COLS[5], fill: LIGHT }),
    ],
  });

  const itemsTable = new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: COLS,
    rows: [headerRow, ...itemRows, totalRow],
  });

  // ---- notes to supplier -----------------------------------------------
  const noteBullets = [
    "All prices ex-VAT, in GBP, to include delivery to site unless stated.",
    "Goods to comply with BS 7671:2018+A2:2022 (18th Edition) and current British Standards.",
    "Where \u201CTBC\u201D is shown, please quote your equivalent product and confirm lead time.",
    "Quote to remain valid for a minimum of 30 days.",
    "Quantities are taken from the electrical layout drawing and to be confirmed per plot prior to order.",
  ].map(t => new Paragraph({
    numbering: { reference: "boq-bullets", level: 0 },
    spacing: { after: 40 },
    children: [new TextRun({ text: t, size: 18, font: "Arial" })],
  }));

  // ---- assemble ---------------------------------------------------------
  return new Document({
    styles: { default: { document: { run: { font: "Arial", size: 18 } } } },
    numbering: {
      config: [{
        reference: "boq-bullets",
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: "\u2022",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 480, hanging: 240 } } },
        }],
      }],
    },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 }, // A4 portrait
          margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
        },
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 40 },
          children: [new TextRun({ text: "ELECTRICAL BILL OF QUANTITIES", bold: true, size: 36, color: NAVY, font: "Arial" })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: TEAL, space: 6 } },
          children: [new TextRun({ text: meta.projectName || "Electrical Layout Schedule", size: 22, color: "555555", font: "Arial" })],
        }),
        infoTable,
        new Paragraph({ spacing: { before: 240, after: 80 },
          children: [new TextRun({ text: "Notes to Supplier", bold: true, size: 22, color: NAVY, font: "Arial" })] }),
        ...noteBullets,
        new Paragraph({ spacing: { before: 240, after: 80 },
          children: [new TextRun({ text: "Schedule of Fittings (from layout drawing)", bold: true, size: 22, color: NAVY, font: "Arial" })] }),
        itemsTable,
        new Paragraph({ spacing: { before: 200 },
          children: [new TextRun({ text: "Unit rates and totals to be completed by supplier. This schedule is issued for pricing.", italics: true, size: 16, color: "777777", font: "Arial" })] }),
      ],
    }],
  });
}
