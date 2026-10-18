export const DOCX_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
export const DRAWING_NS = "http://schemas.openxmlformats.org/drawingml/2006/main";
export const WP_NS = "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing";
export const R_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";

export function getAlignment(paragraph) {
  const jc = paragraph.getElementsByTagNameNS(DOCX_NS, "jc")[0];
  if (jc) {
    const val = jc.getAttributeNS(DOCX_NS, "val") || jc.getAttribute("w:val");
    if (val === "center") return "1";
    if (val === "right") return "2";
    if (val === "both" || val === "justify") return "3";
  }
  return "0";
}

export function getIndentAttrs(paragraph) {
  const ind = paragraph.getElementsByTagNameNS(DOCX_NS, "ind")[0];
  let left = null, right = null, firstLine = null;
  if (ind) {
    left = ind.getAttributeNS(DOCX_NS, "left") || ind.getAttribute("w:left");
    right = ind.getAttributeNS(DOCX_NS, "right") || ind.getAttribute("w:right");
    firstLine = ind.getAttributeNS(DOCX_NS, "firstLine") || ind.getAttribute("w:firstLine");
  }
  let attrs = `LeftIndent="${left ? (parseFloat(left) / 20).toFixed(1) : "0.0"}" RightIndent="${right ? (parseFloat(right) / 20).toFixed(1) : "0.0"}"`;
  if (firstLine) attrs += ` FirstLineIndent="${(parseFloat(firstLine) / 20).toFixed(1)}"`;
  return attrs;
}

export function getBulletType(numId) {
  const bullet_types = {
    "1": "BULLET_TYPE_ELLIPSE",
    "2": "BULLET_TYPE_RECTANGLE",
    "3": "BULLET_TYPE_RECTANGLE_D",
    "4": "BULLET_TYPE_ARROW",
    "5": "BULLET_TYPE_DIAMOND",
    "6": "BULLET_TYPE_TRIANGLE",
  };
  return bullet_types[numId] || "BULLET_TYPE_ELLIPSE";
}

export function getNumberType(listId) {
  const number_types = {
    "1": "NUMBER_TYPE_CHAR_SMALL_DOT",
    "2": "BULLET_TYPE_ARROW",
    "3": "NUMBER_TYPE_ROMAN_BIG_DOT",
    "4": "NUMBER_TYPE_CHAR_BIG_DOT",
    "5": "NUMBER_TYPE_CHAR_SMALL_PARANTHESE",
    "6": "NUMBER_TYPE_NUMBER_TRE",
    "7": "NUMBER_TYPE_ROMAN_SMALL_DOT",
    "8": "BULLET_TYPE_ELLIPSE",
    "9": "BULLET_TYPE_RECTANGLE",
    "10": "BULLET_TYPE_RECTANGLE_D",
    "11": "NUMBER_TYPE_NUMBER_PARANTHESE",
    "12": "BULLET_TYPE_DIAMOND",
    "13": "BULLET_TYPE_TRIANGLE",
  };
  return number_types[listId] || "NUMBER_TYPE_NUMBER_TRE";
}

export function getLineSpacing(paragraph) {
  const spacing = paragraph.getElementsByTagNameNS(DOCX_NS, "spacing")[0];
  if (spacing) {
    const line = spacing.getAttributeNS(DOCX_NS, "line") || spacing.getAttribute("w:line");
    const lineRule = spacing.getAttributeNS(DOCX_NS, "lineRule") || spacing.getAttribute("w:lineRule");
    if (line && lineRule) {
      if (lineRule === "auto") {
        return Math.max(0, parseFloat(line) / 240 - 1);
      } else if (lineRule === "exact" || lineRule === "atLeast") {
        return Math.max(0, parseFloat(line) / 20 - 12);
      }
    }
  }
  return 0.0;
}

export function escapeXml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
