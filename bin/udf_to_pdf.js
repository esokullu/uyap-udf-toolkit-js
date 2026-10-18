#!/usr/bin/env node
import { udfToPdf } from "../src/udfToPdf.js";
import fs from "fs";
import path from "path";

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
const ext = path.extname(input).toLowerCase();
if (ext !== ".udf") {
  console.log("Please provide a .udf file.");
  process.exit(1);
}
const output = args[1] || input.replace(/\.udf$/i, ".pdf");
udfToPdf(input, output).catch(e => { console.error(e); process.exit(1); });
