/**
 * chunkMerger.js — Merges dashboard results from parallel AI processing sections.
 *
 * When a large document is split into N sections and each section is processed
 * independently by the AI, this service merges all N results into one coherent
 * dashboard JSON.
 */

/**
 * Normalize a string for deduplication comparison.
 * @param {string} str
 * @returns {string}
 */
const normalize = (str) =>
  String(str || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();

/**
 * Merge KPI arrays from multiple section results, deduplicating by label.
 * @param {Array[]} kpiArrays - Array of kpi arrays from each section
 * @returns {Array}
 */
const mergeKPIs = (kpiArrays) => {
  const seen = new Map();

  for (const kpis of kpiArrays) {
    if (!Array.isArray(kpis)) continue;
    for (const kpi of kpis) {
      if (!kpi || !kpi.label) continue;
      const key = normalize(kpi.label);
      if (!seen.has(key)) {
        seen.set(key, kpi);
      }
      // If we've seen this KPI before, prefer the one with a non-neutral trend
      else if (seen.get(key).trend === 'neutral' && kpi.trend !== 'neutral') {
        seen.set(key, kpi);
      }
    }
  }

  return Array.from(seen.values());
};

/**
 * Merge chart arrays from multiple section results.
 * Deduplicates by title similarity and re-indexes chart IDs.
 * @param {Array[]} chartArrays
 * @returns {Array}
 */
const mergeCharts = (chartArrays) => {
  const seen = new Map();
  let counter = 1;

  for (const charts of chartArrays) {
    if (!Array.isArray(charts)) continue;
    for (const chart of charts) {
      if (!chart || !chart.title) continue;
      const key = normalize(chart.title);
      if (!seen.has(key)) {
        // Re-assign a unique ID
        seen.set(key, { ...chart, id: `chart_${counter++}` });
      } else {
        // Merge data arrays if same chart title appears in multiple sections
        const existing = seen.get(key);
        if (Array.isArray(chart.data) && Array.isArray(existing.data)) {
          const existingLabels = new Set(existing.data.map(d => normalize(d.label || '')));
          const newPoints = chart.data.filter(d => !existingLabels.has(normalize(d.label || '')));
          existing.data = [...existing.data, ...newPoints];
        }
      }
    }
  }

  return Array.from(seen.values());
};

/**
 * Merge table arrays from multiple section results.
 * Deduplicates by title, appends rows from duplicate tables.
 * @param {Array[]} tableArrays
 * @returns {Array}
 */
const mergeTables = (tableArrays) => {
  const seen = new Map();

  for (const tables of tableArrays) {
    if (!Array.isArray(tables)) continue;
    for (const table of tables) {
      if (!table || !table.title) continue;
      const key = normalize(table.title);
      if (!seen.has(key)) {
        seen.set(key, { ...table, rows: [...(table.rows || [])] });
      } else {
        // Append new rows to existing table (simple row merge)
        const existing = seen.get(key);
        const existingRowSigs = new Set(
          existing.rows.map(row => row.join('|'))
        );
        const newRows = (table.rows || []).filter(
          row => !existingRowSigs.has(row.join('|'))
        );
        existing.rows = [...existing.rows, ...newRows];
      }
    }
  }

  return Array.from(seen.values());
};

/**
 * Pick the best document_type from an array of results.
 * Prefers anything more specific than "Other".
 * @param {string[]} types
 * @returns {string}
 */
const pickDocumentType = (types) => {
  const specific = types.filter(t => t && t !== 'Other');
  if (specific.length > 0) return specific[0];
  return 'Other';
};

/**
 * Merge multiple section summaries into one coherent summary.
 * @param {string[]} summaries
 * @returns {string}
 */
const mergeSummaries = (summaries) => {
  const unique = [...new Set(summaries.filter(Boolean))];
  if (unique.length === 0) return '';
  if (unique.length === 1) return unique[0];
  // Take first summary + append unique insights from others
  return unique[0];
};

/**
 * Top-level merge function.
 * Takes an array of Promise.allSettled() results and merges all fulfilled dashboard objects.
 *
 * @param {PromiseSettledResult[]} settledResults - Results from Promise.allSettled()
 * @param {string} fileName
 * @returns {{ dashboard: Object, failedSections: number, totalSections: number }}
 */
const mergeDashboards = (settledResults, fileName = '') => {
  const fulfilled = [];
  let failedSections = 0;

  for (const result of settledResults) {
    if (result.status === 'fulfilled' && result.value) {
      fulfilled.push(result.value);
    } else {
      failedSections++;
      if (result.reason) {
        console.error(`[Merger] Section failed: ${result.reason?.message || result.reason}`);
      }
    }
  }

  if (fulfilled.length === 0) {
    throw new Error('All document sections failed to process. Please try again.');
  }

  const kpiArrays = fulfilled.map(d => d.kpis || []);
  const chartArrays = fulfilled.map(d => d.charts || []);
  const tableArrays = fulfilled.map(d => d.tables || []);
  const docTypes = fulfilled.map(d => d.document_type).filter(Boolean);
  const summaries = fulfilled.map(d => d.summary).filter(Boolean);
  const titles = fulfilled.map(d => d.title).filter(Boolean);

  const merged = {
    document_type: pickDocumentType(docTypes),
    title: titles[0] || `Analysis of ${fileName}`,
    summary: mergeSummaries(summaries),
    kpis: mergeKPIs(kpiArrays),
    charts: mergeCharts(chartArrays),
    tables: mergeTables(tableArrays),
  };

  if (failedSections > 0) {
    merged._warnings = [`${failedSections} of ${settledResults.length} document sections could not be processed.`];
  }

  console.log(`[Merger] Merged ${fulfilled.length} sections → ${merged.kpis.length} KPIs, ${merged.charts.length} charts, ${merged.tables.length} tables`);

  return { dashboard: merged, failedSections, totalSections: settledResults.length };
};

module.exports = {
  mergeKPIs,
  mergeCharts,
  mergeTables,
  mergeDashboards
};
