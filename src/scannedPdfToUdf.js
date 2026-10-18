import fs from "fs";
import JSZip from "jszip";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import path from "path";
import { execFileSync } from "child_process";
import os from "os";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function scannedPdfToUdf(inputPath, outputPath) {
  const data = new Uint8Array(fs.readFileSync(inputPath));
  const doc = await pdfjs.getDocument({ data }).promise;

  const content = [];
  const elements = [];
  let current_offset = 0;
  const udf_template = (c, e) => `<?xml version="1.0" encoding="UTF-8" ?>
<template format_id="1.8">
<content><![CDATA[${c}]]></content>
<properties><pageFormat mediaSizeName="1" leftMargin="42.51968479156494" rightMargin="28.34645652770996" topMargin="14.17322826385498" bottomMargin="14.17322826385498" paperOrientation="1" headerFOffset="20.0" footerFOffset="20.0" /></properties>
<elements resolver="hvl-default">
${e}
</elements>
<styles><style name="default" description="Geçerli" family="Dialog" size="12" bold="false" italic="false" foreground="-13421773" FONT_ATTRIBUTE_KEY="javax.swing.plaf.FontUIResource[family=Dialog,name=Dialog,style=plain,size=12]" /><style name="hvl-default" family="Times New Roman" size="12" description="Gövde" /></styles>
</template>`;

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);

    // Extract text
    const tc = await page.getTextContent();
    let text = tc.items.map(x => x.str).join(" ").trim();
    if (text) {
      content.push(text);
      elements.push(`<paragraph Alignment="0" LeftIndent="0.0" RightIndent="0.0"><content startOffset="${current_offset}" length="${text.length}" /></paragraph>`);
      current_offset += text.length;
    }

    // Render page to PNG via pdftoppm
    const tmpPrefix = path.join(os.tmpdir(), `udf_page_${pageNum}`);
    try { execFileSync("pdftoppm", ["-png", "-r", "150", "-f", String(pageNum), "-l", String(pageNum), "-singlefile", inputPath, tmpPrefix]); } catch (e) {}
    const pngPath = tmpPrefix + ".png";
    let pngBuf;
    if (fs.existsSync(pngPath)) {
      pngBuf = fs.readFileSync(pngPath);
      try { fs.unlinkSync(pngPath); } catch (e) {}
    } else {
      // fallback: blank 1x1 png
      pngBuf = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
    }
    const img_str = pngBuf.toString("base64");

    const placeholder = "\uFFFC";
    content.push(placeholder);
    elements.push(`<image family="Times New Roman" size="10" imageData="${img_str}" startOffset="${current_offset}" length="1" width="595" height="842" />`);
    current_offset += 1;

    // newline between pages
    content.push("\n");
    elements.push(`<paragraph Alignment="0" LeftIndent="0.0" RightIndent="0.0"><content startOffset="${current_offset}" length="1" /></paragraph>`);
    current_offset += 1;
  }

  const udf_content = udf_template(content.join(""), elements.join("\n"));
  const outZip = new JSZip();
  outZip.file("content.xml", udf_content);
  const buf = await outZip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  fs.writeFileSync(outputPath, buf);
  console.log(`UDF file created successfully: ${outputPath}`);
}

function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.log("Usage: node scanned_pdf_to_udf.js input.pdf [output.udf]");
    process.exit(1);
  }
  const input = args[0];
  if (!fs.existsSync(input)) {
    console.log(`Input file not found: ${input}`);
    process.exit(1);
  }
  const output = args[1] || input.replace(/\.pdf$/i, ".udf");
  scannedPdfToUdf(input, output).catch(e => { console.error(e); process.exit(1); });
}

if (import.meta.url === `file://${process.argv[1]}`) main();
