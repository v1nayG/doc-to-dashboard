const DEFAULT_CHUNK_CHARS = 1200;
const DEFAULT_OVERLAP_CHARS = 150;
const MAX_CHUNKS = 400;
const MAX_SOURCE_CHARS = 600000;
const PAGE_MARKER = /\[\[PAGE (\d+)\]\]\n?/g;
const SHEET_MARKER = /^Sheet: (.+)$/gm;

// Splits text into locator-aware segments so each chunk keeps its page or sheet reference.
const splitIntoSegments = text => {
    const markers = [];
    for (const match of text.matchAll(PAGE_MARKER)) {
        markers.push({ index: match.index, length: match[0].length, locator: { page: Number(match[1]) } });
    }
    if (!markers.length) {
        for (const match of text.matchAll(SHEET_MARKER)) {
            markers.push({ index: match.index, length: 0, locator: { sheet: match[1].trim().slice(0, 80) } });
        }
    }
    if (!markers.length) return [{ text, offset: 0, locator: {} }];

    const segments = [];
    if (markers[0].index > 0) segments.push({ text: text.slice(0, markers[0].index), offset: 0, locator: {} });
    markers.forEach((marker, position) => {
        const start = marker.index + marker.length;
        const end = position + 1 < markers.length ? markers[position + 1].index : text.length;
        segments.push({ text: text.slice(start, end), offset: start, locator: marker.locator });
    });
    return segments.filter(segment => segment.text.trim().length > 0);
};

const splitUnits = text => text.split(/(?<=[.!?])\s+|\n+/).filter(unit => unit.trim().length > 0);

const chunkText = (text, options = {}) => {
    const chunkChars = options.chunkChars || DEFAULT_CHUNK_CHARS;
    const overlapChars = options.overlapChars ?? DEFAULT_OVERLAP_CHARS;
    const maxChunks = options.maxChunks || MAX_CHUNKS;
    const source = String(text || '').slice(0, MAX_SOURCE_CHARS);
    const chunks = [];

    const pushChunk = (content, start, locator) => {
        const trimmed = content.trim();
        if (!trimmed) return;
        chunks.push({ index: chunks.length, text: trimmed, start, end: start + content.length, ...locator });
    };

    for (const segment of splitIntoSegments(source)) {
        let buffer = '';
        let bufferStart = segment.offset;
        let cursor = 0;
        for (const unit of splitUnits(segment.text)) {
            const unitStart = segment.text.indexOf(unit, cursor);
            cursor = unitStart + unit.length;
            if (unit.length > chunkChars) {
                if (buffer) pushChunk(buffer, bufferStart, segment.locator);
                for (let offset = 0; offset < unit.length; offset += chunkChars - overlapChars) {
                    pushChunk(unit.slice(offset, offset + chunkChars), segment.offset + unitStart + offset, segment.locator);
                    if (chunks.length >= maxChunks) return chunks;
                }
                buffer = '';
                continue;
            }
            if (buffer.length + unit.length + 1 > chunkChars) {
                pushChunk(buffer, bufferStart, segment.locator);
                if (chunks.length >= maxChunks) return chunks;
                const overlap = buffer.slice(-overlapChars);
                bufferStart = segment.offset + unitStart - overlap.length;
                buffer = overlap ? `${overlap} ${unit}` : unit;
            } else {
                if (!buffer) bufferStart = segment.offset + unitStart;
                buffer = buffer ? `${buffer} ${unit}` : unit;
            }
        }
        if (buffer) pushChunk(buffer, bufferStart, segment.locator);
        if (chunks.length >= maxChunks) break;
    }

    return chunks.slice(0, maxChunks);
};

const describeLocator = chunk => {
    if (chunk.page) return `page ${chunk.page}`;
    if (chunk.sheet) return `sheet ${chunk.sheet}`;
    return `section ${chunk.index + 1}`;
};

module.exports = { chunkText, describeLocator, MAX_CHUNKS };
