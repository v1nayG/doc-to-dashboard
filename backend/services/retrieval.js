const { embedTexts, embeddingsEnabled } = require('./aiProviders');
const { describeLocator } = require('./chunker');

const STOPWORDS = new Set(('a an and are as at be by for from has have in is it its of on or that the this to was were will with what which who how when where why does do did not no yes than then there their them they you your our we i me my about into over under between across per vs'.split(' ')));
const SNIPPET_CHARS = 420;

const tokenize = text => String(text || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}%$.,-]+/gu, ' ')
    .split(/\s+/)
    .map(token => token.replace(/^[.,-]+|[.,-]+$/g, ''))
    .filter(token => token.length > 1 && !STOPWORDS.has(token));

const termFrequencies = tokens => {
    const frequencies = new Map();
    for (const token of tokens) frequencies.set(token, (frequencies.get(token) || 0) + 1);
    return frequencies;
};

const buildIndex = entries => {
    const documents = entries.map(entry => {
        const tokens = tokenize(entry.text);
        return { entry, tokens, frequencies: termFrequencies(tokens), length: tokens.length };
    });
    const documentFrequency = new Map();
    for (const document of documents) {
        for (const term of document.frequencies.keys()) {
            documentFrequency.set(term, (documentFrequency.get(term) || 0) + 1);
        }
    }
    const averageLength = documents.reduce((total, document) => total + document.length, 0) / (documents.length || 1);
    return { documents, documentFrequency, averageLength };
};

const scoreBm25 = (index, query, { k1 = 1.5, b = 0.75 } = {}) => {
    const queryTerms = [...new Set(tokenize(query))];
    const total = index.documents.length;
    return index.documents.map(document => {
        let score = 0;
        for (const term of queryTerms) {
            const frequency = document.frequencies.get(term);
            if (!frequency) continue;
            const idf = Math.log(1 + (total - index.documentFrequency.get(term) + 0.5) / (index.documentFrequency.get(term) + 0.5));
            const normalized = (frequency * (k1 + 1)) / (frequency + k1 * (1 - b + (b * document.length) / (index.averageLength || 1)));
            score += idf * normalized;
        }
        return score;
    });
};

const cosineSimilarity = (left, right) => {
    if (!left?.length || left.length !== right?.length) return 0;
    let dot = 0;
    let leftNorm = 0;
    let rightNorm = 0;
    for (let index = 0; index < left.length; index += 1) {
        dot += left[index] * right[index];
        leftNorm += left[index] * left[index];
        rightNorm += right[index] * right[index];
    }
    return leftNorm && rightNorm ? dot / Math.sqrt(leftNorm * rightNorm) : 0;
};

const normalizeScores = scores => {
    const max = Math.max(...scores, 0);
    return max > 0 ? scores.map(score => score / max) : scores.map(() => 0);
};

const flattenChunks = documents => documents.flatMap(document =>
    (document.chunks || []).map(chunk => ({
        ...chunk,
        documentId: String(document._id || document.id || ''),
        fileName: document.fileName
    }))
);

// Hybrid lexical + optional embedding retrieval with per-document fairness caps.
const retrieveChunks = async ({ documents, query, limit = 8, perDocumentMax = 4, queryEmbedding, embedQuery, env }) => {
    const entries = flattenChunks(documents);
    if (!entries.length) return [];

    const lexical = normalizeScores(scoreBm25(buildIndex(entries), query));
    let semantic = null;
    const hasEmbeddings = entries.some(entry => Array.isArray(entry.embedding) && entry.embedding.length);
    if (hasEmbeddings) {
        let vector = queryEmbedding;
        if (!vector && (embedQuery || embeddingsEnabled(env))) {
            try {
                const vectors = await (embedQuery || embedTexts)([query], { env });
                vector = vectors?.[0];
            } catch (error) {
                console.warn(`Query embedding failed; using lexical retrieval only: ${error.message}`);
            }
        }
        if (vector) semantic = normalizeScores(entries.map(entry => Math.max(0, cosineSimilarity(entry.embedding, vector))));
    }

    const ranked = entries
        .map((entry, position) => ({
            entry,
            score: semantic ? 0.5 * lexical[position] + 0.5 * semantic[position] : lexical[position]
        }))
        .filter(item => item.score > 0)
        .sort((left, right) => right.score - left.score);

    const perDocument = new Map();
    const selected = [];
    for (const item of ranked) {
        const used = perDocument.get(item.entry.documentId) || 0;
        if (used >= perDocumentMax) continue;
        perDocument.set(item.entry.documentId, used + 1);
        selected.push({
            documentId: item.entry.documentId,
            fileName: item.entry.fileName,
            chunkIndex: item.entry.index,
            page: item.entry.page,
            sheet: item.entry.sheet,
            locator: describeLocator(item.entry),
            score: Number(item.score.toFixed(4)),
            text: item.entry.text,
            snippet: item.entry.text.slice(0, SNIPPET_CHARS)
        });
        if (selected.length >= limit) break;
    }
    return selected;
};

module.exports = { buildIndex, cosineSimilarity, retrieveChunks, scoreBm25, tokenize };
