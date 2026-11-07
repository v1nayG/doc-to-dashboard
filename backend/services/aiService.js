/**
 * aiService.js — AI Brain for DocDash
 *
 * Upgraded with:
 *   1. RAG (Retrieval-Augmented Generation) — only the most relevant chunks go to the LLM
 *   2. Fallback Model Chain — silent failover across 5 free OpenRouter models
 *   3. Parallel Document Processing — large docs split into sections, processed concurrently
 */

const { buildRagContext } = require('./ragService');
const { mergeDashboards } = require('./chunkMerger');

// ─── FALLBACK MODEL CHAIN ──────────────────────────────────────────────────
// Ordered by quality. If model N fails (rate limit / 503 / timeout), model N+1 is tried.
const MODEL_CHAIN = [
  'nvidia/nemotron-3-ultra-550b-a55b:free',   // Primary — best quality
  'google/gemma-3-27b-it:free',               // Fallback 1
  'mistralai/mistral-7b-instruct:free',        // Fallback 2
  'meta-llama/llama-3.1-8b-instruct:free',    // Fallback 3
  'qwen/qwen-2.5-7b-instruct:free',           // Emergency fallback
];

// Thresholds
const PARALLEL_THRESHOLD = 8000;   // chars — docs above this get parallel processing
const MAX_SECTION_CHARS  = 8000;   // chars per parallel section
const MAX_PARALLEL_SECTIONS = 4;   // cap concurrent AI calls to avoid rate limits
const MODEL_TIMEOUT_MS   = 35000;  // 35s per model attempt before moving to next

// ─── DASHBOARD PROMPT ──────────────────────────────────────────────────────
const DASHBOARD_PROMPT = `
You are a data extraction and dashboard generation expert.

Analyze this document carefully and extract ALL meaningful numerical data.
Return a valid JSON object with EXACTLY this structure:

{
  "document_type": "Invoice | Financial Report | Bank Statement | Survey | Sales Report | Research Paper | Other",
  "title": "A short descriptive title for this document",
  "summary": "2-3 sentence summary of what this document contains and key insights",
  "kpis": [
    { "label": "KPI Name", "value": "123", "unit": "₹ or % or units or empty string", "trend": "up | down | neutral" }
  ],
  "charts": [
    {
      "id": "chart_1",
      "type": "bar | line | pie | area",
      "title": "Chart Title",
      "description": "What this chart shows",
      "data": [
        { "label": "Label", "value": 123 }
      ]
    }
  ],
  "tables": [
    {
      "title": "Table Title",
      "headers": ["Column1", "Column2", "Column3"],
      "rows": [["value1", "value2", "value3"]]
    }
  ]
}

For Bank Statements specifically, include:
- KPIs: Total Spent, Total Received, Net Balance, Largest Transaction, Total Transactions, Avg Transaction Value
- Charts:
  1. Monthly Spending — bar chart grouped by month
  2. Top 10 Merchants by spend — bar chart
  3. Credit vs Debit — pie chart with 2 slices only
  4. Monthly Income vs Spending — area or line chart
- Tables:
  1. Top 20 largest transactions (Date, Description, Amount, Type)
  2. Monthly Summary (Month, Total Spent, Total Received, Net)

Rules:
- Extract ALL transactions visible in the text
- Use ₹ as currency unit for Indian documents
- All "value" fields in chart data arrays MUST be numbers, not strings
- Include at least 4 charts and 2 tables for bank statements
- Return ONLY valid JSON — no markdown, no backticks, no explanation
`;

// ─── LOW-LEVEL: CALL ONE MODEL ─────────────────────────────────────────────

/**
 * Call a single OpenRouter model with a timeout.
 * Throws on HTTP error, timeout, or empty response.
 * @param {string} model
 * @param {string} userContent
 * @returns {Promise<Object>} Parsed dashboard JSON
 */
const callSingleModel = async (model, userContent) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), MODEL_TIMEOUT_MS);

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/v1nayG/doc-to-dashboard',
        'X-Title': 'DocDash'
      },
      body: JSON.stringify({
        model,
        max_tokens: 8192,
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: DASHBOARD_PROMPT },
          { role: 'user', content: userContent }
        ]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errText.substring(0, 200)}`);
    }

    const data = await response.json();
    let raw = data?.choices?.[0]?.message?.content?.trim();
    if (!raw) throw new Error('Empty response from model');

    // Strip accidental markdown code fences
    raw = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
    return JSON.parse(raw);

  } finally {
    clearTimeout(timeoutId);
  }
};

// ─── FALLBACK CHAIN ────────────────────────────────────────────────────────

/**
 * Try each model in MODEL_CHAIN in order. Returns on the first success.
 * Logs which model was used (or failed) for observability.
 *
 * @param {string} userContent - The user message content (filename + document text)
 * @param {string} [label=''] - Optional label for logging (e.g., "Section 2/3")
 * @returns {Promise<Object>} Parsed dashboard JSON
 */
const callWithFallback = async (userContent, label = '') => {
  const prefix = label ? `[${label}]` : '';
  let lastError;

  for (let i = 0; i < MODEL_CHAIN.length; i++) {
    const model = MODEL_CHAIN[i];
    const shortModel = model.split('/').pop();

    try {
      console.log(`${prefix} [AI] Trying model ${i + 1}/${MODEL_CHAIN.length}: ${shortModel}`);
      const result = await callSingleModel(model, userContent);
      console.log(`${prefix} [AI] ✓ Success with model ${i + 1}: ${shortModel}`);
      return result;
    } catch (err) {
      lastError = err;
      const isRetryable = err.message.includes('429') ||
                          err.message.includes('503') ||
                          err.message.includes('502') ||
                          err.message.includes('abort') ||
                          err.message.includes('timeout') ||
                          err.message.includes('Empty response');

      console.warn(`${prefix} [AI] ✗ Model ${i + 1} (${shortModel}) failed: ${err.message.substring(0, 120)}`);

      if (!isRetryable) {
        // Non-retryable error (e.g., bad API key, JSON parse) — fail fast
        console.error(`${prefix} [AI] Non-retryable error — stopping fallback chain`);
        break;
      }

      if (i < MODEL_CHAIN.length - 1) {
        console.log(`${prefix} [AI] Falling back to model ${i + 2}...`);
      }
    }
  }

  throw new Error(`All models failed. Last error: ${lastError?.message}`);
};

// ─── SECTION SPLITTER ──────────────────────────────────────────────────────

/**
 * Split a large text into sections for parallel processing.
 * Tries to split at natural paragraph/newline boundaries.
 *
 * @param {string} text
 * @param {number} maxChars - Max chars per section
 * @param {number} maxSections - Cap on number of sections
 * @returns {string[]}
 */
const splitIntoSections = (text, maxChars = MAX_SECTION_CHARS, maxSections = MAX_PARALLEL_SECTIONS) => {
  if (text.length <= maxChars) return [text];

  const sections = [];
  let start = 0;

  while (start < text.length && sections.length < maxSections) {
    let end = start + maxChars;

    if (end < text.length) {
      // Try to split at a paragraph boundary
      const paraBreak = text.lastIndexOf('\n\n', end);
      const lineBreak  = text.lastIndexOf('\n', end);
      const breakAt = paraBreak > start + maxChars * 0.5 ? paraBreak :
                      lineBreak  > start + maxChars * 0.5 ? lineBreak : end;
      end = breakAt;
    }

    const section = text.substring(start, Math.min(end, text.length)).trim();
    if (section.length > 50) sections.push(section);
    start = end;
  }

  // If there's remaining text and we've hit the section cap, append it to the last section
  if (start < text.length && sections.length > 0) {
    sections[sections.length - 1] += '\n\n' + text.substring(start).trim();
  }

  return sections;
};

// ─── MAIN ENTRY POINT ─────────────────────────────────────────────────────

/**
 * Full document processing pipeline:
 *   1. RAG: chunk the text, retrieve top relevant sections
 *   2. Decide: single-call (small docs) or parallel-call (large docs)
 *   3. Fallback: each AI call tries MODEL_CHAIN in order
 *   4. Merge: parallel results are merged into one dashboard
 *
 * @param {string} text - Full extracted document text
 * @param {string} fileName - Original file name (for logging + prompt context)
 * @returns {Promise<Object>} Final merged dashboard JSON
 */
const processDocument = async (text, fileName) => {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not configured in backend .env file');
  }

  const startTime = Date.now();
  console.log(`\n📄 [DocDash] Processing "${fileName}" (${text.length} chars)`);

  // ── STEP 1: Decide processing path ──────────────────────────────────────
  if (text.length <= PARALLEL_THRESHOLD) {
    // ── SMALL DOC: Single RAG + single AI call ───────────────────────────
    console.log(`[Route] Small document → single-call path`);
    const { context, stats } = buildRagContext(text, fileName);
    const userContent = `Analyze this document and extract dashboard data.\n\nFile: ${fileName}\n\nDocument content:\n${context}`;

    const result = await callWithFallback(userContent, 'Single');
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ Done in ${elapsed}s | RAG: ${stats.ragUsed ? `${stats.retrievedChunks}/${stats.totalChunks} chunks` : 'full text'}`);
    return result;

  } else {
    // ── LARGE DOC: Split → parallel RAG + parallel AI calls → merge ──────
    const sections = splitIntoSections(text);
    console.log(`[Route] Large document → parallel path (${sections.length} sections)`);

    // Run all section AI calls concurrently
    const sectionPromises = sections.map(async (section, i) => {
      const label = `Section ${i + 1}/${sections.length}`;
      const { context } = buildRagContext(section, fileName, { chunkSize: 1200, topK: 5 });
      const userContent = `Analyze this document section and extract ALL data for a dashboard.\n\nFile: ${fileName} (Part ${i + 1} of ${sections.length})\n\nContent:\n${context}`;
      return callWithFallback(userContent, label);
    });

    const settledResults = await Promise.allSettled(sectionPromises);
    const { dashboard, failedSections, totalSections } = mergeDashboards(settledResults, fileName);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ Done in ${elapsed}s | ${totalSections - failedSections}/${totalSections} sections succeeded`);

    return dashboard;
  }
};

// Keep backward-compatible export (uploadController uses extractDashboardData)
const extractDashboardData = processDocument;

module.exports = { extractDashboardData, processDocument };
