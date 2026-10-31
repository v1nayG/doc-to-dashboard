const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { extractText } = require('../services/ocrService');

test('text and JSON files are extracted locally', async () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'docdash-extract-'));
    try {
        const textPath = path.join(directory, 'notes.txt');
        const jsonPath = path.join(directory, 'rows.json');
        fs.writeFileSync(textPath, 'A sufficiently long plain text document for analysis.');
        fs.writeFileSync(jsonPath, JSON.stringify([{ month: 'Jan', total: 42 }]));

        assert.match((await extractText(textPath, 'notes.txt')).text, /plain text document/);
        assert.match((await extractText(jsonPath, 'rows.json')).text, /"total": 42/);
    } finally {
        fs.rmSync(directory, { recursive: true, force: true });
    }
});

test('unsupported image types are rejected rather than sent as text', async () => {
    await assert.rejects(extractText('missing.jpg', 'missing.jpg'), /Image file analysis is not supported/);
});