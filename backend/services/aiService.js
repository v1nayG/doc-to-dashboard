const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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
- Extract ALL transactions — do not skip any
- Use ₹ as currency unit for Indian documents
- All "value" fields in chart data arrays MUST be numbers, not strings
- Include at least 4 charts and 2 tables for bank statements
- Return ONLY valid JSON — no markdown, no backticks, no explanation
`;

/**
 * Extract dashboard data from document text using Groq/LLaMA.
 * Sends up to 50,000 characters — covers most large PDFs in one shot.
 * LLaMA 3.3-70b-versatile supports 128k token context window.
 */
const extractDashboardData = async (text, fileName) => {
  const MAX_CHARS = 20000; // ~5,000 tokens — fits within Groq free tier 12k TPM limit
  const truncated = text.length > MAX_CHARS ? text.substring(0, MAX_CHARS) : text;

  console.log(`📄 Processing "${fileName}" — ${text.length} chars → sending ${truncated.length} chars to Groq`);

  const chatCompletion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: DASHBOARD_PROMPT
      },
      {
        role: 'user',
        content: `Analyze this document and extract dashboard data.\n\nFile: ${fileName}\n\nDocument content:\n${truncated}`
      }
    ],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.2,
    max_completion_tokens: 2000,
    top_p: 1,
    stream: false,
    stop: null
  });

  let raw = chatCompletion.choices[0]?.message?.content?.trim();

  if (!raw) {
    throw new Error('AI returned an empty response. Please try again or use a smaller document.');
  }

  // Strip markdown code blocks if the model wraps response in them
  raw = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

  return JSON.parse(raw);
};

module.exports = { extractDashboardData };
