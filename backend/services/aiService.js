const { generateWithFallback } = require('./aiProviders');

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

const parseDashboardResponse = content => {
  const raw = content
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  const result = JSON.parse(raw);
  if (!result || typeof result !== 'object' || Array.isArray(result)) {
    throw new Error('AI response must be a dashboard object');
  }
  if (!Array.isArray(result.kpis) || !Array.isArray(result.charts) || !Array.isArray(result.tables)) {
    throw new Error('AI response is missing dashboard sections');
  }
  return result;
};

const extractDashboardData = async (text, fileName) => {
  const truncated = text.substring(0, 30000);
    console.log(`Processing "${fileName}" (${text.length} chars) with configured AI provider`);

    try {
        const result = await generateWithFallback([
            { role: 'system', content: DASHBOARD_PROMPT },
            {
                role: 'user',
                content: `Analyze this document and extract dashboard data.\n\nFile: ${fileName}\n\nDocument content:\n${truncated}`
            }
        ], {
          maxTokens: 8192,
          temperature: 0.1,
          validate: parseDashboardResponse
        });
        return { ...parseDashboardResponse(result.content), aiProvider: result.provider, aiModel: result.model };
    } catch (error) {
        console.error('AI dashboard extraction failed:', error.message);
        throw new Error(`AI processing failed: ${error.message}`);
    }
};

module.exports = { extractDashboardData, parseDashboardResponse };
