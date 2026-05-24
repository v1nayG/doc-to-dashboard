# DocDash AI 📊

> **AI-powered app that converts any unstructured document into a beautiful, interactive dashboard in seconds.**

[![Node.js](https://img.shields.io/badge/Node.js-Express-green)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-Vite-blue)](https://vitejs.dev)
[![LLaMA 3](https://img.shields.io/badge/AI-LLaMA%203.3%2070B-orange)](https://groq.com)
[![MongoDB](https://img.shields.io/badge/DB-MongoDB%20Atlas-green)](https://mongodb.com)

---

## 🎯 Problem Solved

Businesses waste hours manually reading PDFs, invoices, and spreadsheets to extract insights. DocDash AI eliminates this by letting users upload any document and instantly generating a premium, interactive dashboard — no manual data entry, no complex prompt engineering, and no coding required.

## ✨ Features

- **📄 Universal Upload** — Supports PDF, Excel, CSV, JPG, and PNG formats.
- **🤖 High-Speed AI Analysis** — Powered by Groq's lightning-fast LLaMA 3.3 70B model for accurate data extraction.
- **📊 Dynamic Dashboards** — Auto-generates Bar, Line, Pie, and Area charts alongside critical KPI summary cards.
- **💎 Premium UI/UX** — Modern, dark-mode aesthetic with frosted glassmorphism elements and smooth framer-motion animations.
- **💾 Document History** — A collapsible sidebar that saves all your past documents securely in MongoDB.
- **⬇️ Export** — Download your AI-generated dashboard as a PNG report.
  

## 🛠️ Tech Stack

| Layer | Tech |
|-------|------|
| **Frontend** | React, Vite, Recharts, Framer Motion |
| **Backend** | Node.js, Express, Multer |
| **AI Processing** | Groq SDK (LLaMA-3.3-70b-versatile) |
| **Database** | MongoDB Atlas, Mongoose |
| **File Parsing** | pdf-parse, xlsx, csvtojson |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Groq API key ([get free key here](https://console.groq.com/))
- MongoDB URI (Optional, for saving document history)

### 1. Backend Setup
```bash
cd backend
npm install
# Rename .env.example to .env and add your GROQ_API_KEY
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
│   ├── services/aiService.js  # Groq AI prompt engineering
│   ├── services/ocrService.js # PDF/Excel/CSV/Image text extraction
│   └── models/Document.js     # MongoDB schema
└── frontend2/src/
    ├── App.jsx                 # Main app shell + state + routing
    ├── components/Dashboard.jsx
    ├── components/ChartCard.jsx
    ├── components/KPICard.jsx
    ├── components/Sidebar.jsx
    └── components/UploadZone.jsx
```

## 🔑 Environment Variables
```env
# backend/.env
GROQ_API_KEY=your_groq_api_key_here
MONGODB_URI=your_mongodb_atlas_uri_here
PORT=5000
```

---

*Built as an AI Application subject project — REVA University CSE*
