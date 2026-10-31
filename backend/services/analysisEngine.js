const MAX_INSIGHTS = 40;
const MAX_ROWS = 5000;

const parseNumber = value => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    if (typeof value !== 'string') return null;
    const cleaned = value.replace(/[,\s]/g, '').replace(/^[^\d.-]+|[^\d.%]+$/g, '');
    if (!cleaned || !/^-?\d*\.?\d+%?$/.test(cleaned)) return null;
    const number = Number.parseFloat(cleaned);
    return Number.isFinite(number) ? number : null;
};

const mean = values => values.reduce((total, value) => total + value, 0) / values.length;
const standardDeviation = (values, average) => Math.sqrt(values.reduce((total, value) => total + (value - average) ** 2, 0) / values.length);

const linearSlope = values => {
    const n = values.length;
    const xMean = (n - 1) / 2;
    const yMean = mean(values);
    let numerator = 0;
    let denominator = 0;
    values.forEach((value, index) => {
        numerator += (index - xMean) * (value - yMean);
        denominator += (index - xMean) ** 2;
    });
    return denominator ? numerator / denominator : 0;
};

const pearson = (left, right) => {
    const leftMean = mean(left);
    const rightMean = mean(right);
    let numerator = 0;
    let leftSum = 0;
    let rightSum = 0;
    for (let index = 0; index < left.length; index += 1) {
        numerator += (left[index] - leftMean) * (right[index] - rightMean);
        leftSum += (left[index] - leftMean) ** 2;
        rightSum += (right[index] - rightMean) ** 2;
    }
    return leftSum && rightSum ? numerator / Math.sqrt(leftSum * rightSum) : 0;
};

const formatNumber = value => Math.abs(value) >= 1000
    ? value.toLocaleString('en-US', { maximumFractionDigits: 0 })
    : value.toLocaleString('en-US', { maximumFractionDigits: 2 });

// Collects analyzable tables from stored dashboard data; chart series become single-column tables.
const collectTables = document => {
    const data = document.dashboardData || {};
    const tables = [];
    for (const table of data.tables || []) {
        if (!Array.isArray(table?.headers) || !Array.isArray(table?.rows) || !table.rows.length) continue;
        tables.push({ title: table.title || 'Table', headers: table.headers.map(String), rows: table.rows.slice(0, MAX_ROWS) });
    }
    for (const chart of data.charts || []) {
        if (!Array.isArray(chart?.data) || chart.data.length < 3) continue;
        tables.push({
            title: chart.title || 'Chart data',
            headers: ['label', 'value'],
            rows: chart.data.map(point => [point.label, point.value])
        });
    }
    return tables;
};

const analyzeTable = (table, context) => {
    const insights = [];
    const labelColumn = table.headers.findIndex((_, column) => table.rows.every(row => parseNumber(row[column]) === null));
    const numericColumns = [];

    table.headers.forEach((header, column) => {
        const pairs = table.rows
            .map(row => ({ label: labelColumn >= 0 ? String(row[labelColumn] ?? '') : '', value: parseNumber(row[column]) }))
            .filter(pair => pair.value !== null);
        if (pairs.length < Math.max(3, table.rows.length * 0.6)) return;
        const values = pairs.map(pair => pair.value);
        const average = mean(values);
        const deviation = standardDeviation(values, average);
        const total = values.reduce((sum, value) => sum + value, 0);
        const max = pairs.reduce((best, pair) => (pair.value > best.value ? pair : best));
        const min = pairs.reduce((best, pair) => (pair.value < best.value ? pair : best));
        numericColumns.push({ header, values });

        insights.push({
            ...context, table: table.title, column: header, kind: 'summary',
            text: `${header}: total ${formatNumber(total)}, average ${formatNumber(average)}, min ${formatNumber(min.value)}${min.label ? ` (${min.label})` : ''}, max ${formatNumber(max.value)}${max.label ? ` (${max.label})` : ''} across ${values.length} rows.`,
            stats: { total, average, min: min.value, max: max.value, count: values.length, stdev: deviation }
        });

        if (values.length >= 4 && average !== 0) {
            const slope = linearSlope(values);
            const relative = (slope * (values.length - 1)) / Math.abs(average);
            if (Math.abs(relative) >= 0.15) {
                insights.push({
                    ...context, table: table.title, column: header, kind: 'trend',
                    text: `${header} trends ${slope > 0 ? 'upward' : 'downward'} by roughly ${Math.round(Math.abs(relative) * 100)}% of its average over ${values.length} rows (first ${formatNumber(values[0])}, last ${formatNumber(values.at(-1))}).`,
                    stats: { slope, relativeChange: relative }
                });
            }
        }

        if (values.length >= 5) {
            const sorted = [...values].sort((left, right) => left - right);
            const median = sorted[Math.floor(sorted.length / 2)];
            const deviations = values.map(value => Math.abs(value - median)).sort((left, right) => left - right);
            const mad = deviations[Math.floor(deviations.length / 2)];
            for (const pair of pairs) {
                // Modified z-score (Iglewicz-Hoaglin) stays meaningful for small tables.
                const z = mad > 0 ? (0.6745 * (pair.value - median)) / mad : (deviation > 0 ? (pair.value - average) / deviation : 0);
                if (Math.abs(z) >= 3.5) {
                    insights.push({
                        ...context, table: table.title, column: header, kind: 'anomaly',
                        text: `${pair.label || 'A row'} has an unusual ${header} of ${formatNumber(pair.value)} (${pair.value > median ? 'far above' : 'far below'} the typical ${formatNumber(median)}).`,
                        stats: { value: pair.value, median, robustZ: z }
                    });
                }
            }
        }
    });

    for (let left = 0; left < numericColumns.length; left += 1) {
        for (let right = left + 1; right < numericColumns.length; right += 1) {
            const size = Math.min(numericColumns[left].values.length, numericColumns[right].values.length);
            if (size < 5) continue;
            const r = pearson(numericColumns[left].values.slice(0, size), numericColumns[right].values.slice(0, size));
            if (Math.abs(r) >= 0.7) {
                insights.push({
                    ...context, table: table.title, column: `${numericColumns[left].header} / ${numericColumns[right].header}`, kind: 'correlation',
                    text: `${numericColumns[left].header} and ${numericColumns[right].header} are ${r > 0 ? 'positively' : 'negatively'} correlated (r = ${r.toFixed(2)}) across ${size} rows.`,
                    stats: { r, count: size }
                });
            }
        }
    }
    return insights;
};

const analyzeDocuments = documents => {
    const insights = [];
    for (const document of documents) {
        const context = { documentId: String(document._id || ''), fileName: document.fileName };
        for (const table of collectTables(document)) insights.push(...analyzeTable(table, context));
        if (insights.length >= MAX_INSIGHTS) break;
    }
    const priority = { anomaly: 0, correlation: 1, trend: 2, summary: 3 };
    return insights.sort((left, right) => priority[left.kind] - priority[right.kind]).slice(0, MAX_INSIGHTS);
};

const normalizeLabel = label => String(label || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

// Aligns KPIs that share a label across documents and reports the spread between them.
const compareDocuments = documents => {
    const kpiMap = new Map();
    documents.forEach((document, position) => {
        for (const kpi of document.dashboardData?.kpis || []) {
            const key = normalizeLabel(kpi.label);
            if (!key) continue;
            if (!kpiMap.has(key)) kpiMap.set(key, { label: kpi.label, unit: kpi.unit || '', values: new Array(documents.length).fill(null) });
            kpiMap.get(key).values[position] = { raw: kpi.value, number: parseNumber(kpi.value), trend: kpi.trend };
        }
    });

    const rows = [...kpiMap.values()]
        .filter(row => row.values.filter(Boolean).length >= 2)
        .map(row => {
            const numbers = row.values.map(value => value?.number).filter(value => value !== null && value !== undefined);
            const delta = numbers.length >= 2 ? numbers.at(-1) - numbers[0] : null;
            return {
                ...row,
                delta,
                deltaPercent: delta !== null && numbers[0] ? (delta / Math.abs(numbers[0])) * 100 : null
            };
        });

    return {
        documents: documents.map(document => ({ documentId: String(document._id || ''), fileName: document.fileName })),
        rows
    };
};

const summarizeInsights = insights => insights.map((insight, index) => `[A${index + 1}] (${insight.fileName}) ${insight.text}`).join('\n');

module.exports = { analyzeDocuments, collectTables, compareDocuments, parseNumber, summarizeInsights };
