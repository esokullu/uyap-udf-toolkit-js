# UDF Toolkit (JavaScript)

Node.js rewrite of [UDF-Toolkit](https://github.com/ataetgi/UDF-Toolkit). Converts between UYAP UDF, DOCX and PDF.

## Requirements
- Node.js 18+
- `pdftoppm` (poppler-utils) for scanned PDF conversion

## Install
```bash
npm install
```

## Usage
```bash
# DOCX -> UDF
node bin/docx_to_udf.js input.docx [output.udf]

# UDF -> DOCX
node bin/udf_to_docx.js input.udf [output.docx]

# UDF -> PDF
node bin/udf_to_pdf.js input.udf [output.pdf]

# Scanned PDF -> UDF
node bin/scanned_pdf_to_udf.js input.pdf [output.udf]
```

Or via npm scripts:
```bash
npm run docx-to-udf -- input.docx
```
