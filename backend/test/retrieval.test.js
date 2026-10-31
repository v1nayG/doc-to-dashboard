const test = require('node:test');
const assert = require('node:assert/strict');
const { chunkText, describeLocator } = require('../services/chunker');
const { retrieveChunks, tokenize, cosineSimilarity } = require('../services/retrieval');

test('PDF page markers become page locators and chunks overlap within the size limit', () => {
    const text = `[[PAGE 1]]\n${'Revenue grew in the first quarter. '.repeat(60)}[[PAGE 2]]\nCosts fell sharply in the second quarter.`;
    const chunks = chunkText(text, { chunkChars: 500, overlapChars: 50 });

    assert.ok(chunks.length >= 4);
    assert.ok(chunks.every(chunk => chunk.text.length <= 500));
    assert.equal(chunks[0].page, 1);
    assert.equal(chunks.at(-1).page, 2);
    assert.match(chunks.at(-1).text, /Costs fell sharply/);
    assert.equal(describeLocator(chunks[0]), 'page 1');
});

test('spreadsheet sheet labels become sheet locators', () => {
    const chunks = chunkText('Sheet: Sales\nregion,total\nnorth,10\nSheet: Costs\ncategory,total\nrent,5');
    assert.equal(chunks[0].sheet, 'Sales');
    assert.equal(chunks.at(-1).sheet, 'Costs');
});

test('retrieval ranks the passage matching the question first and caps per-document results', async () => {
    const documents = [
        { _id: 'a', fileName: 'finance.pdf', chunks: [
            { index: 0, text: 'Total revenue for 2024 was 4.2 million with gross margin of 61 percent.', page: 3 },
            { index: 1, text: 'The office relocated to a new building in March.', page: 4 },
            { index: 2, text: 'Revenue by region: north 2.1 million, south 2.1 million.', page: 5 },
            { index: 3, text: 'Revenue recognition policy follows ASC 606.', page: 9 }
        ] },
        { _id: 'b', fileName: 'hr.csv', chunks: [{ index: 0, text: 'Headcount rose from 40 to 55 employees.' }] }
    ];

    const results = await retrieveChunks({ documents, query: 'What was total revenue and margin?', limit: 3, perDocumentMax: 2, env: {} });

    assert.equal(results[0].documentId, 'a');
    assert.equal(results[0].page, 3);
    assert.equal(results[0].locator, 'page 3');
    assert.ok(results.filter(result => result.documentId === 'a').length <= 2);
});

test('hybrid scoring blends embeddings when both query and chunk vectors exist', async () => {
    const documents = [{ _id: 'a', fileName: 'notes.txt', chunks: [
        { index: 0, text: 'alpha beta', embedding: [1, 0] },
        { index: 1, text: 'alpha gamma', embedding: [0, 1] }
    ] }];

    const results = await retrieveChunks({ documents, query: 'alpha', queryEmbedding: [0, 1], env: {} });

    assert.equal(results[0].chunkIndex, 1);
    assert.equal(cosineSimilarity([1, 0], [1, 0]), 1);
    assert.deepEqual(tokenize('The Revenue, was $4.2m!'), ['revenue', '$4.2m']);
});
