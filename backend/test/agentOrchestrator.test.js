const test = require('node:test');
const assert = require('node:assert/strict');
const { heuristicPlan, parsePlan, runDocumentAgents } = require('../services/agentOrchestrator');

const documents = [{
    _id: 'doc1',
    fileName: 'sales.xlsx',
    dashboardData: {
        kpis: [{ label: 'Revenue', value: '1200' }],
        tables: [{ title: 'Monthly', headers: ['Month', 'Revenue'], rows: [['Jan', '100'], ['Feb', '120'], ['Mar', '140'], ['Apr', '160'], ['May', '180']] }]
    },
    chunks: [
        { index: 0, text: 'Revenue in May reached 180 thousand, the highest month of the year.', sheet: 'Monthly' },
        { index: 1, text: 'The office cafeteria menu changed in May.', sheet: 'Notes' }
    ]
}];

// Fake provider: routes by the system prompt so each agent gets a plausible response.
const fakeGenerate = calls => async (messages) => {
    const system = messages[0].content;
    calls.push(system.slice(0, 20));
    if (system.startsWith('You are a planning agent')) {
        return { content: JSON.stringify({ intent: 'analysis', needsRetrieval: true, needsAnalysis: true, wantsChart: true, searchQueries: ['revenue trend'] }), usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 }, provider: 'test', model: 'planner' };
    }
    if (system.startsWith('You are the answering agent')) {
        assert.match(messages.at(-1).content, /\[C1\] sales\.xlsx \(sheet Monthly\)/);
        assert.match(messages.at(-1).content, /\[A1\]/);
        return { content: JSON.stringify({ answer: 'Revenue rose every month to 180 in May [C1][A1].', citations: ['C1', 'A1', 'Z9'], charts: [{ type: 'line', title: 'Revenue', data: [{ label: 'Jan', value: 100 }, { label: 'May', value: 180 }] }] }), usage: { promptTokens: 100, completionTokens: 40, totalTokens: 140 }, provider: 'test', model: 'writer' };
    }
    if (system.startsWith('You are a verification agent')) {
        return { content: JSON.stringify({ verdict: 'partially_supported', issues: ['The "every month" claim is not in the evidence.'] }), usage: { promptTokens: 50, completionTokens: 10, totalTokens: 60 }, provider: 'test', model: 'verifier' };
    }
    throw new Error('unexpected prompt');
};

test('heuristic planner classifies comparison and chart intents without a model', () => {
    assert.equal(heuristicPlan('Compare revenue across the documents').intent, 'compare');
    assert.equal(heuristicPlan('Plot the monthly trend').intent, 'chart');
    assert.equal(heuristicPlan('Who signed the contract?').intent, 'qa');
    const plan = parsePlan('{"intent":"nonsense","searchQueries":["a","a","b"]}', 'What is the total?');
    assert.equal(plan.intent, 'analysis');
    assert.deepEqual(plan.searchQueries, ['What is the total?', 'a', 'b']);
});

test('orchestrator runs plan, parallel retrieval and analysis, synthesis, and verification', async () => {
    const calls = [];
    const events = [];
    const result = await runDocumentAgents({
        documents,
        question: 'Show the revenue trend as a chart',
        generate: fakeGenerate(calls),
        onEvent: event => events.push(event),
        env: {}
    });

    assert.equal(calls.length, 3);
    assert.equal(result.plan.intent, 'analysis');
    assert.equal(result.citations.length, 2);
    assert.equal(result.citations[0].locator, 'sheet Monthly');
    assert.equal(result.citations[1].kind, 'computed');
    assert.equal(result.charts.length, 1);
    assert.match(result.answer, /Verification note: The "every month" claim/);
    assert.equal(result.usage.totalTokens, 215);
    assert.deepEqual(result.trace.map(entry => entry.step).sort(), ['analyze', 'plan', 'retrieve', 'synthesize', 'verify']);
    assert.equal(result.trace[0].step, 'plan');
    assert.equal(result.trace.at(-1).step, 'verify');
    assert.ok(events.some(event => event.step === 'retrieve' && event.detail === '1 passages' || event.detail === '2 passages'));
});

test('orchestrator falls back to heuristics and full text when planner fails and no chunks exist', async () => {
    const result = await runDocumentAgents({
        documents: [{ _id: 'legacy', fileName: 'old.pdf', extractedText: 'Net profit was 50.', dashboardData: {} }],
        question: 'What was net profit?',
        env: { AI_VERIFIER: 'off' },
        generate: async messages => {
            if (messages[0].content.startsWith('You are a planning agent')) throw new Error('planner down');
            assert.match(messages.at(-1).content, /SOURCE: old\.pdf/);
            return { content: JSON.stringify({ answer: 'Net profit was 50.', citations: [], charts: [] }), provider: 'test', model: 'writer' };
        }
    });

    assert.equal(result.answer, 'Net profit was 50.');
    assert.equal(result.verification.verdict, 'skipped');
    assert.equal(result.trace.find(entry => entry.step === 'plan').detail, 'heuristic');
});
