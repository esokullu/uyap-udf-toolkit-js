# UYAP UDF Toolkit (JavaScript)

[UDF-Toolkit](https://github.com/ataetgi/UDF-Toolkit) projesinin Node.js ile yeniden yazılmış sürümü. UYAP UDF, DOCX ve PDF formatları arasında dönüştürme yapar.

## Gereksinimler
- Node.js 18+
- Taranmış PDF dönüştürme için `pdftoppm` (poppler-utils)

## Kurulum
```bash
npm install
```

## Kullanım
```bash
# DOCX -> UDF
node bin/docx_to_udf.js input.docx [output.udf]

# UDF -> DOCX
node bin/udf_to_docx.js input.udf [output.docx]

# UDF -> PDF
node bin/udf_to_pdf.js input.udf [output.pdf]

# Taranmış PDF -> UDF
node bin/scanned_pdf_to_udf.js input.pdf [output.udf]
```

npm script'leri ile:
```bash
npm run docx-to-udf -- input.docx
```

## Kütüphane olarak kullanım
```js
import { docxToUdf, udfToDocx, udfToPdf, scannedPdfToUdf } from "./src/docxToUdf.js";
```

## Lisans
MIT
