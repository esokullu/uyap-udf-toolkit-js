import { DOCX_NS } from "./utils.js";
import { processImage } from "./imageProcessor.js";
import { getAlignment, getIndentAttrs, getNumberType } from "./utils.js";

const EMPTY_PARAGRAPH_PLACEHOLDER = "\u200B";
const TAB_CHARACTER = "\t";

export async function processParagraph(paragraph, ctx, currentOffset) {
  let para_text = "";
  let para_elements = [];
  let offset = currentOffset;

  // numbering
  const numPr = paragraph.getElementsByTagNameNS(DOCX_NS, "numPr")[0];
  let numbered = false;
  let list_id = "";
  let list_level = "";
  let number_type = "";
  if (numPr) {
    const ilvl = numPr.getElementsByTagNameNS(DOCX_NS, "ilvl")[0];
    const numId = numPr.getElementsByTagNameNS(DOCX_NS, "numId")[0];
    if (ilvl && numId) {
      numbered = true;
      list_id = numId.getAttributeNS(DOCX_NS, "val") || numId.getAttribute("w:val");
      list_level = String(parseInt(ilvl.getAttributeNS(DOCX_NS, "val") || ilvl.getAttribute("w:val"), 10) + 1);
      number_type = getNumberType(list_id);
    }
  }

  const runs = paragraph.getElementsByTagNameNS(DOCX_NS, "r");
  for (let i = 0; i < runs.length; i++) {
    const run = runs[i];
    // images
    const drawings = run.getElementsByTagNameNS(DOCX_NS, "drawing");
    for (let d = 0; d < drawings.length; d++) {
      const drawing = drawings[d];
      const [image_data, width, height] = await processImage(drawing, ctx);
      if (image_data) {
        const placeholder = "\uFFFC";
        para_text += placeholder;
        para_elements.push(
          `<image imageData="${image_data}" startOffset="${offset}" length="1" width="${width}" height="${height}" />`
        );
        offset += 1;
      }
    }

    // text and tabs
    const hasText = run.getElementsByTagNameNS(DOCX_NS, "t").length > 0;
    const hasTab = run.getElementsByTagNameNS(DOCX_NS, "tab").length > 0;
    if (hasText || hasTab) {
      // font properties
      const rFonts = run.getElementsByTagNameNS(DOCX_NS, "rFonts")[0];
      let font_family = "Times New Roman";
      if (rFonts) {
        font_family = rFonts.getAttributeNS(DOCX_NS, "ascii") || rFonts.getAttribute("w:ascii") || font_family;
      }
      const sz = run.getElementsByTagNameNS(DOCX_NS, "sz")[0];
      let font_size = "20";
      if (sz) font_size = sz.getAttributeNS(DOCX_NS, "val") || sz.getAttribute("w:val") || font_size;
      font_size = String(Math.floor(parseInt(font_size, 10) / 2));

      const style_attrs = [`family="${font_family}"`, `size="${font_size}"`];
      if (run.getElementsByTagNameNS(DOCX_NS, "b").length > 0) style_attrs.push('bold="true"');
      if (run.getElementsByTagNameNS(DOCX_NS, "i").length > 0) style_attrs.push('italic="true"');
      const style_attr_str = style_attrs.join(" ");

      // iterate child nodes in order
      for (let c = 0; c < run.childNodes.length; c++) {
        const child = run.childNodes[c];
        if (child.nodeType !== 1) continue;
        const ln = child.localName;
        const ns = child.namespaceURI;
        if (ns !== DOCX_NS) continue;
        if (ln === "t") {
          const text = child.textContent || "";
          para_elements.push(`<content startOffset="${offset}" length="${text.length}" ${style_attr_str} />`);
          para_text += text;
          offset += text.length;
        } else if (ln === "tab") {
          para_elements.push(`<tab ${style_attr_str} startOffset="${offset}" length="1" />`);
          para_text += TAB_CHARACTER;
          offset += 1;
        }
      }
    }
  }

  if (!para_text) {
    para_text = EMPTY_PARAGRAPH_PLACEHOLDER;
    para_elements.push(`<content startOffset="${offset}" length="1" family="Times New Roman" size="10" />`);
    offset += 1;
  }

  let paragraph_attrs = `Alignment="${getAlignment(paragraph)}" ${getIndentAttrs(paragraph)}`;
  if (numbered) {
    if (number_type.startsWith("NUMBER_TYPE_")) {
      paragraph_attrs += ` Numbered="true" ListId="${list_id}" ListLevel="${list_level}" NumberType="${number_type}"`;
    } else {
      paragraph_attrs += ` Bulleted="true" ListId="${list_id}" ListLevel="${list_level}" BulletType="${number_type}"`;
    }
  }

  const paragraph_element = `<paragraph ${paragraph_attrs}>${para_elements.join("")}</paragraph>`;
  return [para_text, paragraph_element];
}
