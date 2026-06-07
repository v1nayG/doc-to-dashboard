// Using standard native fetch built into Node.js

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

/**
 * Extract dashboard data from document text using OpenAI gpt-oss-120b via OpenRouter.
 * Context limit is set to 150k characters (approx 110k tokens/30k words).
 */
const extractDashboardData = async (text, fileName) => {
  const MAX_CHARS = 150000;
  const truncated = text.length > MAX_CHARS ? text.substring(0, MAX_CHARS) : text;

  console.log(`📄 Processing "${fileName}" — ${text.length} chars → sending ${truncated.length} to gpt-oss-120b on OpenRouter`);

  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not configured in backend .env file');
  }

  try {
    const response = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/v1nayG/doc-to-dashboard',
          'X-Title': 'DocDash'
        },
        body: JSON.stringify({
          model: 'openai/gpt-oss-120b:free',
          messages: [
            { role: 'system', content: DASHBOARD_PROMPT },
            {
              role: 'user',
              content: `Analyze this document and extract dashboard data.\n\nFile: ${fileName}\n\nDocument content:\n${truncated}`
            }
          ],
          temperature: 0.1,
          response_format: { type: 'json_object' }
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenRouter returned status ${response.status}: ${errText}`);
    }

    const data = await response.json();
    let raw = data?.choices[0]?.message?.content?.trim();

    if (!raw) {
      throw new Error('AI returned an empty response. Please try again.');
    }

    // Clean up potential markdown formatting if returned
    raw = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

    return JSON.parse(raw);
  } catch (error) {
    console.error('❌ OpenRouter API Error:', error.message);
    throw new Error(`AI processing failed: ${error.message}`);
  }
};

module.exports = { extractDashboardData };
