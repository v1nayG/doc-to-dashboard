/**
 * ragService.js — Retrieval-Augmented Generation (RAG) for DocDash
 *
 * Uses TF-IDF cosine similarity for chunk retrieval.
 * Zero external dependencies — pure JS, no API calls, no cost.
 *
 * Pipeline:
 *   raw text → chunkDocument() → scoreChunkRelevance() → retrieveTopChunks() → buildRagPrompt()
 */

// Financial & analytics keywords used as the retrieval query
const FINANCIAL_QUERY_TERMS = [
  'revenue', 'profit', 'loss', 'income', 'expense', 'sales', 'cost', 'balance',
  'amount', 'total', 'net', 'gross', 'tax', 'invoice', 'transaction', 'payment',
  'debit', 'credit', 'budget', 'forecast', 'margin', 'growth', 'kpi', 'metric',
  'quarter', 'annual', 'monthly', 'summary', 'report', 'financial', 'statement',
  'asset', 'liability', 'equity', 'cash', 'flow', 'yield', 'rate', 'percent',
  'chart', 'table', 'data', 'value', 'figure', 'number', 'statistic'
];

/**
 * Split text into overlapping chunks.
 * @param {string} text - Full document text
 * @param {number} chunkSize - Target characters per chunk (default: 1500)
 * @param {number} overlap - Overlap between chunks (default: 200)
 * @returns {string[]} Array of text chunks
 */
const chunkDocument = (text, chunkSize = 1500, overlap = 200) => {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    let end = start + chunkSize;

    // Try to end at a natural sentence or newline boundary
    if (end < text.length) {
      const naturalBreak = text.lastIndexOf('\n', end);
      const sentenceBreak = text.lastIndexOf('. ', end);
      const breakPoint = Math.max(naturalBreak, sentenceBreak);
      if (breakPoint > start + chunkSize * 0.6) {
        end = breakPoint + 1;
      }
    }

    const chunk = text.substring(start, Math.min(end, text.length)).trim();
    if (chunk.length > 50) { // Skip tiny fragments
      chunks.push(chunk);
    }

    start = end - overlap;
    if (start >= text.length) break;
  }

  return chunks;
};

/**
 * Build a simple term-frequency map for a string.
 * @param {string} text
 * @returns {Map<string, number>}
 */
const buildTermFrequency = (text) => {
  const tf = new Map();
  const words = text.toLowerCase().match(/\b[a-z]{2,}\b/g) || [];
  for (const word of words) {
    tf.set(word, (tf.get(word) || 0) + 1);
  }
  return tf;
};

/**
 * Compute cosine similarity between a chunk and the query term list.
 * Returns a score 0–1 indicating relevance.
 * @param {string} chunk
 * @param {string[]} queryTerms
 * @returns {number}
 */
const scoreChunkRelevance = (chunk, queryTerms = FINANCIAL_QUERY_TERMS) => {
  const chunkTf = buildTermFrequency(chunk);
  let score = 0;
  let queryMagnitude = 0;
  let chunkMagnitude = 0;

  for (const term of queryTerms) {
    const chunkFreq = chunkTf.get(term) || 0;
    score += chunkFreq * 1; // query weight is 1 for each term
    chunkMagnitude += chunkFreq * chunkFreq;
    queryMagnitude += 1;
  }

  // Normalize — penalise very short chunks
  const lengthBonus = Math.min(chunk.length / 1500, 1);
  const rawScore = queryMagnitude > 0 && chunkMagnitude > 0
    ? score / (Math.sqrt(queryMagnitude) * Math.sqrt(chunkMagnitude))
    : 0;

  // Bonus for chunks that contain numbers (more likely to be data-rich)
  const numberDensity = (chunk.match(/\d+(\.\d+)?/g) || []).length / (chunk.length / 100);
  const numberBonus = Math.min(numberDensity / 5, 0.3);

  return rawScore * lengthBonus + numberBonus;
};

/**
 * Retrieve the top-K most relevant chunks for dashboard generation.
 * @param {string[]} chunks - All document chunks
 * @param {number} topK - Number of chunks to return (default: 6)
 * @returns {{ chunk: string, score: number, index: number }[]}
 */
const retrieveTopChunks = (chunks, topK = 6) => {
  const scored = chunks.map((chunk, index) => ({
    chunk,
    index,
    score: scoreChunkRelevance(chunk)
  }));

  // Sort by score descending, then preserve document order for top-K
  scored.sort((a, b) => b.score - a.score);
  const topScored = scored.slice(0, topK);

  // Re-sort selected chunks by their original document order
  topScored.sort((a, b) => a.index - b.index);

  return topScored;
};

/**
 * Build the RAG-enhanced document context for the LLM prompt.
 * @param {string} fullText - Full document text
 * @param {string} fileName - Original file name
 * @param {Object} options
 * @param {number} options.chunkSize - Chunk size in chars (default: 1500)
 * @param {number} options.topK - Number of chunks to retrieve (default: 6)
 * @returns {{ context: string, stats: Object }}
 */
const buildRagContext = (fullText, fileName, options = {}) => {
  const { chunkSize = 1500, topK = 6 } = options;

  // For short documents, skip RAG and return the full text directly
  if (fullText.length <= chunkSize * 2) {
    console.log(`[RAG] "${fileName}" is short (${fullText.length} chars) — using full text directly`);
    return {
      context: fullText,
      stats: { totalChunks: 1, retrievedChunks: 1, originalLength: fullText.length, ragUsed: false }
    };
  }

  const allChunks = chunkDocument(fullText, chunkSize);
  const topChunks = retrieveTopChunks(allChunks, topK);

  const context = topChunks
    .map((c, i) => `[Section ${i + 1} of document — relevance score: ${c.score.toFixed(3)}]\n${c.chunk}`)
    .join('\n\n---\n\n');

  console.log(`[RAG] "${fileName}" → ${allChunks.length} chunks → retrieved top ${topChunks.length} (scores: ${topChunks.map(c => c.score.toFixed(2)).join(', ')})`);

  return {
    context,
    stats: {
      totalChunks: allChunks.length,
      retrievedChunks: topChunks.length,
      originalLength: fullText.length,
      contextLength: context.length,
      ragUsed: true,
      topScores: topChunks.map(c => c.score)
    }
  };
};

module.exports = {
  chunkDocument,
  scoreChunkRelevance,
  retrieveTopChunks,
  buildRagContext
};
