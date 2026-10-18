#!/usr/bin/env node
import { scannedPdfToUdf } from "../src/scannedPdfToUdf.js";
import fs from "fs";
import path from "path";

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
const ext = path.extname(input).toLowerCase();
if (ext !== ".pdf") {
  console.log("Please provide a .pdf file.");
  process.exit(1);
}
const output = args[1] || input.replace(/\.pdf$/i, ".udf");
scannedPdfToUdf(input, output).catch(e => { console.error(e); process.exit(1); });
