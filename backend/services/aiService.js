const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const DASHBOARD_PROMPT = `
You are a data extraction and dashboard generation expert.

Analyze this document carefully and extract ALL meaningful numerical data.
Return a valid JSON object with EXACTLY this structure:

{
  "document_type": "Invoice | Financial Report | Survey | Sales Report | Research Paper | Other",
  "title": "A short descriptive title for this document",
  "summary": "2-3 sentence summary of what this document contains",
  "kpis": [
    { "label": "KPI Name", "value": "123", "unit": "$ or % or units or empty string", "trend": "up | down | neutral" }
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
      "headers": ["Column1", "Column2"],
      "rows": [["value1", "value2"]]
    }
  ]
}

Rules:
- Extract ALL numerical data and create charts from them
- KPIs = the most important 4-6 numbers (totals, averages, counts)
- bar chart: for comparing categories
- line/area chart: for data over time
- pie chart: for proportions that add to 100%
- All "value" fields in data arrays MUST be numbers, not strings
- Include at least 2 charts and 3 KPIs if data allows
- Return ONLY valid JSON — no markdown, no backticks, no explanation
`;

/**
 * Extract dashboard data from document text using Groq AI
 * All documents (PDF, CSV, Excel, images) are parsed to text first,
 * then sent to Groq for analysis.
 */
const extractDashboardData = async (text, fileName) => {
  const chatCompletion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: DASHBOARD_PROMPT
      },
      {
        role: 'user',
        content: `Analyze this document and extract dashboard data.\n\nFile: ${fileName}\n\nDocument content:\n${text.substring(0, 30000)}`
      }
    ],
    model: 'openai/gpt-oss-120b',
    temperature: 0.3,
    max_completion_tokens: 8192,
    top_p: 1,
    stream: false,
    stop: null
  });

  let raw = chatCompletion.choices[0]?.message?.content?.trim();

  if (!raw) {
    throw new Error('AI returned an empty response. Try a different document.');
  }

  // Strip markdown code blocks if the model wraps response in them
  raw = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

  return JSON.parse(raw);
};

module.exports = { extractDashboardData };
