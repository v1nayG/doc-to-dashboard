const xlsx = require('xlsx');
const csvtojson = require('csvtojson');
const fs = require('fs');
const path = require('path');

/**
 * Extract text from a PDF using pdfjs-dist (already installed)
 */
const extractPdfText = async (filePath, password) => {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const data = new Uint8Array(fs.readFileSync(filePath));
    const doc = await pdfjsLib.getDocument({ 
        data,
        password: password || undefined
    }).promise;

    let fullText = '';
    for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map(item => item.str).join(' ');
        fullText += pageText + '\n';
    }
    return fullText;
};

/**
 * Determine file type and extract text accordingly.
 * ALL file types are parsed to text locally, then sent to Groq.
 * Returns { text }
 */
const extractText = async (filePath, originalName, password) => {
    const ext = path.extname(originalName).toLowerCase();

    // PDFs → parse text locally using pdfjs-dist
    if (ext === '.pdf') {
        const text = await extractPdfText(filePath, password);

        if (!text || text.trim().length < 20) {
            throw new Error(
                'This PDF appears to be scanned/image-based and contains no extractable text. ' +
                'Please upload a text-based PDF, or try converting it to a text format first.'
            );
        }
        return { text };
    }

    // Images → not supported with text-only AI
    if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
        throw new Error(
            'Image file analysis is not supported with the current AI provider. ' +
            'Please upload a PDF, Excel, or CSV file instead.'
        );
    }

    // Excel → parse to CSV text
    if (ext === '.xlsx' || ext === '.xls') {
        const workbook = xlsx.readFile(filePath);
        let fullText = '';
        workbook.SheetNames.forEach((sheetName) => {
            const sheet = workbook.Sheets[sheetName];
            const csvData = xlsx.utils.sheet_to_csv(sheet);
            fullText += `Sheet: ${sheetName}\n${csvData}\n\n`;
        });
        return { text: fullText };
    }

    // CSV → parse to JSON text
    if (ext === '.csv') {
        const jsonArray = await csvtojson().fromFile(filePath);
        return { text: JSON.stringify(jsonArray, null, 2) };
    }

    throw new Error(`Unsupported file type: ${ext}. Supported: PDF, XLSX, CSV`);
};

module.exports = { extractText };
