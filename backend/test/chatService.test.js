const test = require('node:test');
const assert = require('node:assert/strict');
const { buildDocumentContext, buildHistoryContext, parseChatResponse } = require('../services/chatService');

test('document context is capped across selected sources and names each source', () => {
    const context = buildDocumentContext([
        { fileName: 'one.txt', extractedText: 'a'.repeat(30000) },
        { fileName: 'two.csv', extractedText: 'b'.repeat(30000) },
        { fileName: 'three.pdf', extractedText: 'c'.repeat(1000) }
    ]);

    assert.ok(context.length <= 50000);
    assert.match(context, /SOURCE: one\.txt/);
    assert.match(context, /SOURCE: two\.csv/);
    assert.match(context, /SOURCE: three\.pdf/);
});

test('context identifies previously truncated source text', () => {
    const context = buildDocumentContext([
        { fileName: 'report.pdf', extractedText: 'some text', textTruncated: true }
    ]);

    assert.match(context, /Source context is truncated/);
});

test('chat response keeps only supported charts and finite numeric points', () => {
    const response = parseChatResponse(JSON.stringify({
        answer: 'Revenue increased.',
        charts: [
            { type: 'bar', title: 'Revenue', data: [{ label: 'Q1', value: 12 }, { label: 'Q2', value: 'bad' }] },
            { type: 'unknown', title: 'Unsupported', data: [{ label: 'Q1', value: 5 }] },
            null
        ]
    }));

    assert.equal(response.answer, 'Revenue increased.');
    assert.equal(response.charts.length, 1);
    assert.deepEqual(response.charts[0].data, [{ label: 'Q1', value: 12 }]);
});

test('chat response requires an answer string', () => {
    assert.throws(() => parseChatResponse('{"charts":[]}'), /did not contain an answer/);
});

test('conversation history is capped by count and total characters, favoring recent turns', () => {
    const history = Array.from({ length: 14 }, (_, index) => ({
        role: index % 2 === 0 ? 'user' : 'assistant',
        content: `${index}:` + String(index).repeat(3000)
    }));
    const messages = buildHistoryContext(history);

    assert.ok(messages.length <= 10);
    assert.ok(messages.reduce((total, message) => total + message.content.length, 0) <= 12000);
    assert.match(messages.at(-1).content, /^13:/);
    assert.doesNotMatch(messages.map(message => message.content).join(' '), /^0:/);
});