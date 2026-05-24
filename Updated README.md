# DocDash AI 📊

> **AI-powered app that converts any document into an interactive dashboard in seconds.**

[![Node.js](https://img.shields.io/badge/Node.js-Express-green)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-Vite-blue)](https://vitejs.dev)
[![Gemini](https://img.shields.io/badge/AI-Gemini%201.5%20Flash-purple)](https://aistudio.google.com)
[![MongoDB](https://img.shields.io/badge/DB-MongoDB%20Atlas-green)](https://mongodb.com)

---

## 🎯 Problem Solved

Businesses waste hours manually reading PDFs and spreadsheets to extract insights. DocDash AI eliminates this by letting users upload any document and instantly generating a beautiful, interactive dashboard — no manual work, no coding.

## ✨ Features

- **📄 Upload any document** — PDF, Excel, CSV, JPG, PNG (up to 20MB)
- **🤖 Gemini AI analysis** — Extracts key data, metrics, and trends
- **📊 Auto dashboard** — Bar, Line, Pie, Area charts + KPI cards
- **🔄 Chart type switcher** — Switch between chart types live
- **💾 Document history** — Sidebar with all past documents
- **⬇️ Export** — Download dashboard as PNG
  

## 🛠️ Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React + Vite + Recharts + Framer Motion |
| Backend | Node.js + Express |
| AI | Google Gemini 1.5 Flash |
| Database | MongoDB Atlas |
| File Parsing | pdf-parse, xlsx, csvtojson |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Google Gemini API key ([get free key](https://aistudio.google.com))

### 1. Backend Setup
```bash
cd backend
npm install
# Edit .env with your Gemini API key (already added)
node server.js
```

### 2. Frontend Setup
```bash
cd frontend2
npm install
npm run dev
```

Open **http://localhost:5173** 🎉

## 📁 Project Structure
```
doc-to-dashboard/
├── backend/
│   ├── server.js              
│   ├── routes/upload.js       # File upload + AI pipeline
│   ├── routes/history.js      # Document history CRUD
│   ├── services/aiService.js  # Gemini AI prompts
│   ├── services/ocrService.js # PDF/Excel/CSV/Image parsing
│   └── models/Document.js     # MongoDB schema
└── frontend2/src/
    ├── App.jsx                 # Main app + state
    ├── components/Dashboard.jsx
    ├── components/ChartCard.jsx
    ├── components/KPICard.jsx
    ├── components/Sidebar.jsx
    └── components/UploadZone.jsx
```

## 🔑 Environment Variables
```env
GEMINI_API_KEY=your_gemini_key_here
MONGODB_URI=your_mongodb_atlas_uri  # Optional
PORT=5000
```

## 🌐 Deployment
- **Frontend**: Vercel (free)
- **Backend**: Render.com (free)
- **Database**: MongoDB Atlas (free 512MB)

---

*Built as an AI Application subject project — REVA University CSE*
