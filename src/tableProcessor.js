import { DOCX_NS } from "./utils.js";
import { processParagraph } from "./paragraphProcessor.js";

export async function processTable(table, ctx, currentOffset) {
  let table_text = "";
  const rows = [];
  const gridCols = table.getElementsByTagNameNS(DOCX_NS, "gridCol");
  const column_count = gridCols.length;
  let total_width = 0;
  const column_widths = [];
  for (let i = 0; i < gridCols.length; i++) {
    const w = parseInt(gridCols[i].getAttributeNS(DOCX_NS, "w") || gridCols[i].getAttribute("w:w") || "0", 10);
    column_widths.push(w);
    total_width += w;
  }
  const column_spans = column_widths.map(w => Math.round((w / (total_width || 1)) * 300)).join(",");

  // borders
  const tblBorders = table.getElementsByTagNameNS(DOCX_NS, "tblBorders")[0];
  let border_type = "borderCell";
  if (tblBorders) {
    const border_elements = ["top", "left", "bottom", "right", "insideH", "insideV"];
    let all_none = true;
    for (const b of border_elements) {
      const el = tblBorders.getElementsByTagNameNS(DOCX_NS, b)[0];
      if (el) {
        const val = el.getAttributeNS(DOCX_NS, "val") || el.getAttribute("w:val");
        if (!(val === "none" || val === "nil" || val === "0" || val === null)) {
          all_none = false;
          break;
        }
      }
    }
    if (all_none) border_type = "borderNone";
  } else {
    border_type = "borderNone";
  }

  let offset = currentOffset;
  const trs = table.getElementsByTagNameNS(DOCX_NS, "tr");
  for (let ri = 0; ri < trs.length; ri++) {
    const row = trs[ri];
    const cells = [];
    const tcs = row.getElementsByTagNameNS(DOCX_NS, "tc");
    for (let ci = 0; ci < tcs.length; ci++) {
      const cell = tcs[ci];
      const [cell_text, cell_elements] = await processCell(cell, ctx, offset);
      cells.push(`<cell>${cell_elements.join("")}</cell>`);
      table_text += cell_text;
      offset += cell_text.length;
    }
    rows.push(`<row rowName="row${ri + 1}" rowType="dataRow">${cells.join("")}</row>`);
  }

  const table_element = `<table tableName="Sabit" columnCount="${column_count}" columnSpans="${column_spans}" border="${border_type}">${rows.join("")}</table>`;
  return [table_text, table_element];
}

async function processCell(cell, ctx, currentOffset) {
  let cell_text = "";
  const cell_elements = [];
  let offset = currentOffset;
  const paragraphs = cell.getElementsByTagNameNS(DOCX_NS, "p");
  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i];
    const [para_text, para_elements] = await processParagraph(paragraph, ctx, offset);
    cell_text += para_text;
    cell_elements.push(para_elements);
    offset += para_text.length;
    if (i < paragraphs.length - 1 && para_text.trim()) {
      cell_text += "\n";
      cell_elements.push(`<content startOffset="${offset}" length="1" family="Times New Roman" size="10" />`);
      offset += 1;
    }
  }
  if (!cell_text) {
    cell_text = " ";
    cell_elements.push(`<content startOffset="${offset}" length="1" family="Times New Roman" size="10" />`);
    offset += 1;
  }
  return [cell_text, cell_elements];
}
