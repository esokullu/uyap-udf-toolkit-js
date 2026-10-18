import fs from "fs";
import JSZip from "jszip";
import { DOMParser } from "@xmldom/xmldom";
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun, AlignmentType,
} from "docx";

export async function udfToDocx(inputPath, outputPath) {
  const data = fs.readFileSync(inputPath);
  const zip = await JSZip.loadAsync(data);
  const contentFile = zip.file("content.xml");
  if (!contentFile) {
    console.log("The 'content.xml' file could not be found in the UDF file.");
    process.exit(1);
  }
  const xml = await contentFile.async("string");
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "application/xml");
  const root = doc.documentElement;

  // styles
  const styles = {};
  const stylesEl = root.getElementsByTagName("styles")[0];
  if (stylesEl) {
    const styleNodes = stylesEl.getElementsByTagName("style");
    for (let i = 0; i < styleNodes.length; i++) {
      const s = styleNodes[i];
      styles[s.getAttribute("name")] = {
        family: s.getAttribute("family"),
        size: parseInt(s.getAttribute("size") || "12", 10),
        bold: s.getAttribute("bold") === "true",
        italic: s.getAttribute("italic") === "true",
        foreground: parseInt(s.getAttribute("foreground") || "-13421773", 10),
      };
    }
  }

  const contentEl = root.getElementsByTagName("content")[0];
  let content_text = contentEl ? (contentEl.textContent || "") : "";
  // strip CDATA markers if present
  if (content_text.startsWith("<![CDATA[") && content_text.endsWith("]]>")) {
    content_text = content_text.slice(9, -3);
  }

  // We'll collect paragraphs/tables then create document with children.
  const children = [];

  const elementsEl = root.getElementsByTagName("elements")[0];
  if (elementsEl) {
    const elems = elementsEl.childNodes;
    for (let i = 0; i < elems.length; i++) {
      const elem = elems[i];
      if (elem.nodeType !== 1) continue;
      if (elem.localName === "paragraph") {
        const para = buildParagraph(elem, content_text);
        children.push(para);
      } else if (elem.localName === "table") {
        const table = buildTable(elem, content_text);
        children.push(table);
      }
    }
  } else {
    console.log("'elements' could not be found in the XML.");
  }

  const finalDoc = new Document({ sections: [{ children }] });
  const buf = await Packer.toBuffer(finalDoc);
  fs.writeFileSync(outputPath, buf);
  console.log(`DOCX file created: ${outputPath}`);
}

function colorFromInt(val) {
  if (val === null || val === undefined) return undefined;
  let color_int = parseInt(val, 10);
  if (isNaN(color_int)) return undefined;
  if (color_int < 0) color_int += 2 ** 32;
  const r = (color_int >> 16) & 0xff;
  const g = (color_int >> 8) & 0xff;
  const b = color_int & 0xff;
  return `${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function buildParagraph(elem, content_text) {
  const alignment = elem.getAttribute("Alignment") || "0";
  let align;
  if (alignment === "0") align = AlignmentType.LEFT;
  else if (alignment === "1") align = AlignmentType.CENTER;
  else if (alignment === "2") align = AlignmentType.RIGHT;
  else if (alignment === "3") align = AlignmentType.JUSTIFIED;

  const runs = [];
  const children = elem.childNodes;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child.nodeType !== 1) continue;
    const tag = child.localName;
    if (tag === "content") {
      const start = parseInt(child.getAttribute("startOffset") || "0", 10);
      const len = parseInt(child.getAttribute("length") || "0", 10);
      const text = content_text.slice(start, start + len);
      const size = parseInt(child.getAttribute("size") || "12", 10);
      const runOpts = { text, size: size * 2 };
      if (child.getAttribute("bold") === "true") runOpts.bold = true;
      if (child.getAttribute("italic") === "true") runOpts.italic = true;
      const family = child.getAttribute("family");
      if (family) runOpts.font = family;
      const fg = child.getAttribute("foreground");
      if (fg) {
        const c = colorFromInt(fg);
        if (c) runOpts.color = c;
      }
      runs.push(new TextRun(runOpts));
    } else if (tag === "space") {
      runs.push(new TextRun(" "));
    } else if (tag === "image") {
      const imageData = child.getAttribute("imageData");
      if (imageData) {
        const buf = Buffer.from(imageData, "base64");
        const width = parseInt(child.getAttribute("width") || "100", 10);
        const height = parseInt(child.getAttribute("height") || "100", 10);
        runs.push(new ImageRun({ data: buf, type: "png", transformation: { width, height } }));
      }
    } else if (tag === "tab") {
      runs.push(new TextRun("\t"));
    }
  }
  return new Paragraph({ alignment: align, children: runs.length ? runs : [new TextRun("")] });
}

function buildTable(elem, content_text) {
  const columnCount = parseInt(elem.getAttribute("columnCount") || "1", 10);
  const rows = elem.getElementsByTagName("row");
  const tableRows = [];
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    const cells = row.getElementsByTagName("cell");
    const tableCells = [];
    for (let c = 0; c < cells.length; c++) {
      const cell = cells[c];
      const paras = cell.getElementsByTagName("paragraph");
      const cellChildren = [];
      for (let p = 0; p < paras.length; p++) {
        cellChildren.push(buildParagraph(paras[p], content_text));
      }
      if (cellChildren.length === 0) cellChildren.push(new Paragraph(""));
      tableCells.push(new TableCell({ children: cellChildren }));
    }
    // pad columns
    while (tableCells.length < columnCount) tableCells.push(new TableCell({ children: [new Paragraph("")] }));
    tableRows.push(new TableRow({ children: tableCells }));
  }
  return new Table({ rows: tableRows });
}

function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.log("Usage: node udf_to_docx.js input.udf [output.docx]");
    process.exit(1);
  }
  const input = args[0];
  if (!fs.existsSync(input)) {
    console.log(`Input file not found: ${input}`);
    process.exit(1);
  }
  const output = args[1] || input.replace(/\.udf$/i, ".docx");
  udfToDocx(input, output).catch(e => { console.error(e); process.exit(1); });
}

// Only run main when executed directly
if (import.meta.url === `file://${process.argv[1]}`) main();
