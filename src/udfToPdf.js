import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { DOMParser } from "@xmldom/xmldom";
import JSZip from "jszip";
import PDFDocument from "pdfkit";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONT_DIR = path.resolve(__dirname, "..", "assets", "fonts");

export async function udfToPdf(inputPath, outputPath) {
  const data = fs.readFileSync(inputPath);
  const zip = await JSZip.loadAsync(data);
  const contentFile = zip.file("content.xml");
  if (!contentFile) {
    console.log("The 'content.xml' file could not be found in the UDF file.");
    process.exit(1);
  }
  const xml = await contentFile.async("string");
  const parser = new DOMParser();
  const docXml = parser.parseFromString(xml, "application/xml");
  const root = docXml.documentElement;

  const contentEl = root.getElementsByTagName("content")[0];
  let content_text = contentEl ? (contentEl.textContent || "") : "";
  if (content_text.startsWith("<![CDATA[") && content_text.endsWith("]]>")) {
    content_text = content_text.slice(9, -3);
  }

  const pdf = new PDFDocument({ size: "A4" });
  const stream = fs.createWriteStream(outputPath);
  pdf.pipe(stream);

  pdf.registerFont("Noto", path.join(FONT_DIR, "NotoSans-Regular.ttf"));
  pdf.registerFont("Noto-Bold", path.join(FONT_DIR, "NotoSans-Bold.ttf"));
  pdf.registerFont("Noto-Italic", path.join(FONT_DIR, "NotoSans-Italic.ttf"));
  pdf.registerFont("Noto-BoldItalic", path.join(FONT_DIR, "NotoSans-BoldItalic.ttf"));

  const elementsEl = root.getElementsByTagName("elements")[0];
  if (elementsEl) {
    const elems = elementsEl.childNodes;
    for (let i = 0; i < elems.length; i++) {
      const elem = elems[i];
      if (elem.nodeType !== 1) continue;
      if (elem.localName === "paragraph") {
        renderParagraph(pdf, elem, content_text);
      } else if (elem.localName === "table") {
        renderTable(pdf, elem, content_text);
      } else if (elem.localName === "image") {
        renderImage(pdf, elem);
      }
      pdf.moveDown(0.5);
    }
  } else {
    console.log("'elements' could not be found in the XML.");
  }

  pdf.end();
  await new Promise((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
  });
  console.log(`PDF file created: ${outputPath}`);
}

function renderParagraph(pdf, elem, content_text) {
  const children = elem.childNodes;
  // collect text runs
  let hasText = false;
  for (let i = 0; i < children.length; i++) {
    const c = children[i];
    if (c.nodeType !== 1) continue;
    if (c.localName === "content" || c.localName === "space" || c.localName === "tab") hasText = true;
    if (c.localName === "image") {
      // flush pending? We'll handle inline: images appended after text
    }
  }

  // Build text with font switching using continued
  let first = true;
  for (let i = 0; i < children.length; i++) {
    const c = children[i];
    if (c.nodeType !== 1) continue;
    const tag = c.localName;
    if (tag === "content") {
      const start = parseInt(c.getAttribute("startOffset") || "0", 10);
      const len = parseInt(c.getAttribute("length") || "0", 10);
      const text = content_text.slice(start, start + len);
      const size = parseInt(c.getAttribute("size") || "12", 10);
      const bold = c.getAttribute("bold") === "true";
      const italic = c.getAttribute("italic") === "true";
      let font = "Noto";
      if (bold && italic) font = "Noto-BoldItalic";
      else if (bold) font = "Noto-Bold";
      else if (italic) font = "Noto-Italic";
      pdf.font(font).fontSize(size || 12);
      pdf.text(text, { continued: true });
      first = false;
    } else if (tag === "space") {
      pdf.font("Noto").fontSize(12);
      pdf.text(" ", { continued: true });
    } else if (tag === "tab") {
      pdf.text("\t", { continued: true });
    } else if (tag === "image") {
      renderImage(pdf, c);
    }
  }
  // end paragraph
  if (children.length > 0) {
    pdf.text("", { continued: false });
  } else {
    pdf.text("");
  }
}

function renderTable(pdf, elem, content_text) {
  const rows = elem.getElementsByTagName("row");
  const tableRows = [];
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    const cells = row.getElementsByTagName("cell");
    const rowArr = [];
    for (let c = 0; c < cells.length; c++) {
      const cell = cells[c];
      const paras = cell.getElementsByTagName("paragraph");
      let cellText = "";
      for (let p = 0; p < paras.length; p++) {
        const para = paras[p];
        const pcs = para.childNodes;
        for (let k = 0; k < pcs.length; k++) {
          const ch = pcs[k];
          if (ch.nodeType !== 1) continue;
          if (ch.localName === "content") {
            const start = parseInt(ch.getAttribute("startOffset") || "0", 10);
            const len = parseInt(ch.getAttribute("length") || "0", 10);
            cellText += content_text.slice(start, start + len);
          } else if (ch.localName === "space") {
            cellText += " ";
          }
        }
        if (p < paras.length - 1) cellText += "\n";
      }
      rowArr.push(cellText);
    }
    tableRows.push(rowArr);
  }

  const colCount = parseInt(elem.getAttribute("columnCount") || (tableRows[0]?.length || 1), 10);
  const pageWidth = pdf.page.width - pdf.page.margins.left - pdf.page.margins.right;
  const colWidth = pageWidth / Math.max(1, colCount);
  const startX = pdf.page.margins.left;

  for (const row of tableRows) {
    const y = pdf.y;
    let maxH = 0;
    for (let i = 0; i < row.length; i++) {
      const h = pdf.heightOfString(row[i] || "", { width: colWidth });
      if (h > maxH) maxH = h;
      pdf.text(row[i] || "", startX + i * colWidth, y, { width: colWidth });
    }
    pdf.y = y + maxH + 6;
    pdf.x = pdf.page.margins.left;
  }
  pdf.moveDown(0.5);
}

function renderImage(pdf, elem) {
  const imageData = elem.getAttribute("imageData");
  if (!imageData) return;
  const buf = Buffer.from(imageData, "base64");
  const width = parseInt(elem.getAttribute("width") || "100", 10);
  const height = parseInt(elem.getAttribute("height") || "100", 10);
  try {
    pdf.image(buf, { fit: [Math.max(50, width * 2), Math.max(50, height * 2)] });
  } catch (e) {
    // ignore
  }
}

function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.log("Usage: node udf_to_pdf.js input.udf [output.pdf]");
    process.exit(1);
  }
  const input = args[0];
  if (!fs.existsSync(input)) {
    console.log(`Input file not found: ${input}`);
    process.exit(1);
  }
  const output = args[1] || input.replace(/\.udf$/i, ".pdf");
  udfToPdf(input, output).catch(e => { console.error(e); process.exit(1); });
}

if (import.meta.url === `file://${process.argv[1]}`) main();
