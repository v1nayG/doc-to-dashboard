const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

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
  1. Monthly Spending (bar chart — group debits by month)
  2. Top 10 Merchants by spend (bar chart)
  3. Credit vs Debit (pie chart — 2 slices only)
  4. Monthly Income vs Spending (area or line chart)
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
 * Extract dashboard data from document text using Gemini AI.
 * Sends the FULL document text — no truncation, no chunking.
 * Gemini 2.0 Flash supports up to 1M tokens context.
 */
const extractDashboardData = async (text, fileName) => {
  console.log(`📄 Processing "${fileName}" — ${text.length} characters → Gemini 2.0 Flash`);

  const prompt = `${DASHBOARD_PROMPT}\n\nFile: ${fileName}\n\nDocument content:\n${text}`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  let raw = response.text().trim();

  if (!raw) {
    throw new Error('Gemini returned an empty response. Please try again.');
  }

  // Strip markdown fences if model wraps response in them
  raw = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

  return JSON.parse(raw);
};

module.exports = { extractDashboardData };
