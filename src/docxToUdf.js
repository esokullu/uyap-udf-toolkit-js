import fs from "fs";
import JSZip from "jszip";
import { DOMParser } from "@xmldom/xmldom";
import { DOCX_NS } from "./utils.js";
import { processParagraph } from "./paragraphProcessor.js";
import { processTable } from "./tableProcessor.js";

export async function docxToUdf(inputPath, outputPath) {
  const data = fs.readFileSync(inputPath);
  const zip = await JSZip.loadAsync(data);
  const docXml = await zip.file("word/document.xml").async("string");
  const relsXml = await zip.file("word/_rels/document.xml.rels").async("string");
  const parser = new DOMParser();
  const doc = parser.parseFromString(docXml, "application/xml");
  const relsDoc = parser.parseFromString(relsXml, "application/xml");
  const rels = new Map();
  const relNodes = relsDoc.getElementsByTagName("Relationship");
  for (let i = 0; i < relNodes.length; i++) {
    const r = relNodes[i];
    rels.set(r.getAttribute("Id"), r.getAttribute("Target"));
  }
  const ctx = { zip, rels };

  const body = doc.getElementsByTagNameNS(DOCX_NS, "body")[0];
  const content = [];
  const elements = [];
  let current_offset = 0;
  const EMPTY = "\u200B";

  for (let i = 0; i < body.childNodes.length; i++) {
    const child = body.childNodes[i];
    if (child.nodeType !== 1) continue;
    if (child.namespaceURI !== DOCX_NS) continue;
    const tag = child.localName;
    if (tag === "p") {
      const [text, el] = await processParagraph(child, ctx, current_offset);
      elements.push(el);
      content.push(text);
      current_offset += text.length;
    } else if (tag === "tbl") {
      const [text, el] = await processTable(child, ctx, current_offset);
      elements.push(el);
      content.push(text);
      current_offset += text.length;
    }
  }

  if (content.length === 0) {
    content.push(EMPTY);
    elements.push(`<paragraph Alignment="0" LeftIndent="0.0" RightIndent="0.0"><content startOffset="${current_offset}" length="1" /></paragraph>`);
  }

  const udfContent = `<?xml version="1.0" encoding="UTF-8" ?>
<template format_id="1.8">
<content><![CDATA[${content.join("")}]]></content>
<properties><pageFormat mediaSizeName="1" leftMargin="42.51968479156494" rightMargin="28.34645652770996" topMargin="14.17322826385498" bottomMargin="14.17322826385498" paperOrientation="1" headerFOffset="20.0" footerFOffset="20.0" /></properties>
<elements resolver="hvl-default">
${elements.join("\n")}
</elements>
<styles><style name="default" description="Geçerli" family="Dialog" size="12" bold="false" italic="false" foreground="-13421773" FONT_ATTRIBUTE_KEY="javax.swing.plaf.FontUIResource[family=Dialog,name=Dialog,style=plain,size=12]" /><style name="hvl-default" family="Times New Roman" size="12" description="Gövde" /></styles>
</template>`;

  const outZip = new JSZip();
  outZip.file("content.xml", udfContent);
  const buf = await outZip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  fs.writeFileSync(outputPath, buf);
  console.log(`UDF file created successfully: ${outputPath}`);
}
