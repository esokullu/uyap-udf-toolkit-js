import sharp from "sharp";

export async function processImage(drawing, ctx) {
  try {
    let extent = null;
    const inline = drawing.getElementsByTagNameNS("http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing", "inline")[0];
    const anchor = drawing.getElementsByTagNameNS("http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing", "anchor")[0];
    const container = inline || anchor;
    if (container) {
      extent = container.getElementsByTagNameNS("http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing", "extent")[0];
    }
    let width = 100, height = 100;
    if (extent) {
      const cx = extent.getAttribute("cx");
      const cy = extent.getAttribute("cy");
      if (cx) width = Math.round(parseInt(cx, 10) / 9525);
      if (cy) height = Math.round(parseInt(cy, 10) / 9525);
    }

    const blip = drawing.getElementsByTagNameNS("http://schemas.openxmlformats.org/drawingml/2006/main", "blip")[0];
    if (!blip) return [null, null, null];
    const rId = blip.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "embed")
      || blip.getAttribute("r:embed");
    if (!rId || !ctx.rels.has(rId)) return [null, null, null];

    const target = ctx.rels.get(rId);
    const path = target.startsWith("/") ? target.slice(1) : `word/${target}`;
    const file = ctx.zip.file(path);
    if (!file) return [null, null, null];
    const buf = await file.async("nodebuffer");

    let image_data;
    try {
      const pngBuf = await sharp(buf).png().toBuffer();
      image_data = pngBuf.toString("base64");
    } catch (e) {
      image_data = buf.toString("base64");
    }
    return [image_data, width, height];
  } catch (e) {
    return [null, null, null];
  }
}
