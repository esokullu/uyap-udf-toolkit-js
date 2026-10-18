#!/usr/bin/env node
import { docxToUdf } from "../src/docxToUdf.js";
import fs from "fs";
import path from "path";

const args = process.argv.slice(2);
if (args.length < 1) {
  console.log("Usage: node docx_to_udf.js input.docx [output.udf]");
  process.exit(1);
}
const input = args[0];
if (!fs.existsSync(input)) {
  console.log(`Input file not found: ${input}`);
  process.exit(1);
}
const ext = path.extname(input).toLowerCase();
if (ext !== ".docx") {
  console.log("Please provide a .docx file.");
  process.exit(1);
}
const output = args[1] || input.replace(/\.docx$/i, ".udf");
docxToUdf(input, output).catch(e => { console.error(e); process.exit(1); });
