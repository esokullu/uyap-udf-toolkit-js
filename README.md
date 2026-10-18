# UYAP UDF Toolkit (JavaScript)

UYAP UDF dosya formatı ile ilgili çalışmalar (JavaScript/Node.js sürümü)

## UDF dosyasını DOCX formatına çevirmek için
```bash
node udf_to_docx.js input.udf
```

## UDF dosyasını PDF formatına çevirmek için
```bash
node udf_to_pdf.js input.udf
```

## DOCX dosyasını UDF formatına çevirmek için
```bash
node docx_to_udf.js input.docx
```
Not: En iyi sonucu almak için Node.js 18+ kurulu olmalıdır. Bazı DOCX özellikleri dönüştürülürken farklı işletim sistemlerinde sonuçlar değişebilir.

## PDF dosyasını (imaj olarak) UDF formatına çevirmek için
```bash
node scanned_pdf_to_udf.js input.pdf
```
Not: Taranmış PDF dönüştürme için `pdftoppm` (poppler-utils) kurulu olmalıdır.

# Teknik Bilgiye Sahip Olmayanlar İçin Kullanım Talimatları

Bu scriptlerin düzgün çalışabilmesi için Node.js'in sisteminizde kurulu olması gerekmektedir. Aşağıdaki adımları takip ederek Node.js'i yükleyebilirsiniz:

1. [Node.js'in resmi web sitesine](https://nodejs.org/) gidin.
2. Sisteminizin işletim sistemine uygun Node.js sürümünü indirin (LTS sürümü önerilir).
3. Kurulumu tamamlayın.

## Kodu İndirmek
Sağ üstteki yeşil renkli `Code` butonuna tıklayın. `Download ZIP`'e tıklayın. İnen sıkıştırılmış ZIP dosyasını bir klasöre çıkartın.

## Kurulum
Proje klasöründe bağımlılıkları yükleyin:
```bash
npm install
```

## Kullanım
Scriptleri proje klasöründen çalıştırın:

### `docx_to_udf.js`
- **Amaç**: DOCX dosyasını UDF formatına dönüştürür.
- **Nasıl Kullanılır**: `node bin/docx_to_udf.js input.docx` komutunu çalıştırın. Girdi ile aynı dizinde bir `.udf` dosyası oluşturacaktır.

### `udf_to_docx.js`
- **Amaç**: UDF dosyasını DOCX formatına dönüştürür.
- **Nasıl Kullanılır**: `node bin/udf_to_docx.js input.udf` komutunu çalıştırın. Girdi ile aynı dizinde bir `.docx` dosyası oluşturacaktır.

### `udf_to_pdf.js`
- **Amaç**: UDF dosyasını PDF formatına dönüştürür.
- **Nasıl Kullanılır**: `node bin/udf_to_pdf.js input.udf` komutunu çalıştırın. Girdi ile aynı dizinde bir `.pdf` dosyası oluşturacaktır.

### `scanned_pdf_to_udf.js`
- **Amaç**: Tarama yapılmış bir PDF dosyasını UDF formatına dönüştürür.
- **Nasıl Kullanılır**: `node bin/scanned_pdf_to_udf.js input.pdf` komutunu çalıştırın. Girdi ile aynı dizinde bir `.udf` dosyası oluşturacaktır.

## Kütüphane olarak kullanım
```js
import { docxToUdf, udfToDocx, udfToPdf, scannedPdfToUdf } from "./src/docxToUdf.js";
```

## UDF Formatı Dokümantasyonu
UDF formatı, belirli bir iç yapıya sahip bir ZIP arşividir. Ana dosya `content.xml` olarak adlandırılır ve belge içeriği ile biçimlendirme bilgilerini içerir. Ayrıntılı format bilgisi için orijinal [Docs.md](https://github.com/ataetgi/UDF-Toolkit/blob/main/Docs.md) dosyasına bakınız.

## Lisans
MIT
