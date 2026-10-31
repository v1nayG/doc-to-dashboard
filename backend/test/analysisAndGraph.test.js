const test = require('node:test');
const assert = require('node:assert/strict');
const { analyzeDocuments, compareDocuments, parseNumber } = require('../services/analysisEngine');
const { mergeGraphs, parseGraphResponse } = require('../services/knowledgeGraph');

const salesDocument = {
    _id: 'doc1',
    fileName: 'sales.xlsx',
    dashboardData: {
        kpis: [{ label: 'Total Revenue', value: '1,200', unit: '₹' }, { label: 'Orders', value: '40' }],
        tables: [{
            title: 'Monthly',
            headers: ['Month', 'Revenue', 'Cost'],
            rows: [['Jan', '100', '50'], ['Feb', '120', '60'], ['Mar', '140', '70'], ['Apr', '160', '80'], ['May', '180', '90'], ['Jun', '900', '95']]
        }]
    }
};

test('numeric parsing handles currency, separators, and percentages', () => {
    assert.equal(parseNumber('₹1,200'), 1200);
    assert.equal(parseNumber('61%'), 61);
    assert.equal(parseNumber('n/a'), null);
});

test('analysis engine finds summaries, trends, anomalies, and correlations deterministically', () => {
    const insights = analyzeDocuments([salesDocument]);
    const kinds = new Set(insights.map(insight => insight.kind));

    assert.ok(kinds.has('summary'));
    assert.ok(kinds.has('trend'));
    assert.ok(kinds.has('anomaly'));
    assert.ok(insights.find(insight => insight.kind === 'anomaly').text.includes('Jun'));
    assert.equal(insights[0].kind, 'anomaly');

    const correlated = analyzeDocuments([{ _id: 'doc3', fileName: 'ads.csv', dashboardData: { tables: [{
        title: 'Spend', headers: ['Week', 'Spend', 'Clicks'],
        rows: [['1', '10', '100'], ['2', '20', '210'], ['3', '30', '290'], ['4', '40', '410'], ['5', '50', '500']]
    }] } }]);
    assert.ok(correlated.some(insight => insight.kind === 'correlation' && insight.text.includes('positively')));
});

test('document comparison aligns KPIs by label and reports deltas', () => {
    const comparison = compareDocuments([
        salesDocument,
        { _id: 'doc2', fileName: 'sales-q2.xlsx', dashboardData: { kpis: [{ label: 'total revenue', value: '1,500' }] } }
    ]);

    assert.equal(comparison.rows.length, 1);
    assert.equal(comparison.rows[0].delta, 300);
    assert.equal(Math.round(comparison.rows[0].deltaPercent), 25);
});

test('graph parsing validates entity types and drops relations to unknown entities', () => {
    const graph = parseGraphResponse(JSON.stringify({
        entities: [{ name: 'Acme Corp', type: 'organization' }, { name: 'Q1 Revenue', type: 'weird' }],
        relations: [
            { source: 'Acme Corp', target: 'Q1 Revenue', relation: 'reported' },
            { source: 'Acme Corp', target: 'Ghost', relation: 'owns' }
        ]
    }));

    assert.equal(graph.entities[1].type, 'other');
    assert.equal(graph.relations.length, 1);
    assert.throws(() => parseGraphResponse('{"entities":[]}'), /no entities/);
});

test('merged graphs connect documents through shared entities and KPI nodes', () => {
    const merged = mergeGraphs(
        [salesDocument, { _id: 'doc2', fileName: 'memo.pdf', dashboardData: { kpis: [] } }],
        [
            { entities: [{ name: 'Acme Corp', type: 'organization' }], relations: [] },
            { entities: [{ name: 'Acme Corp', type: 'organization' }, { name: 'Berlin', type: 'location' }], relations: [{ source: 'Acme Corp', target: 'Berlin', relation: 'based in' }] }
        ]
    );

    const acme = merged.nodes.find(node => node.id === 'entity:acme corp');
    assert.deepEqual(acme.documentIds, ['doc1', 'doc2']);
    assert.deepEqual(merged.sharedEntities, ['Acme Corp']);
    assert.ok(merged.nodes.some(node => node.id === 'metric:total revenue'));
    assert.ok(merged.edges.some(edge => edge.label === 'based in'));
});
