# DocDash AI 📊

> **An AI-powered B2B SaaS application that converts any unstructured document into a premium, interactive React dashboard in seconds.**

[![Node.js](https://img.shields.io/badge/Node.js-Express-green)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-Vite-blue)](https://vitejs.dev)
[![LLaMA 3](https://img.shields.io/badge/AI-LLaMA%203.3%2070B-orange)](https://groq.com)
[![MongoDB](https://img.shields.io/badge/DB-MongoDB%20Atlas-green)](https://mongodb.com)

---

## 🎯 The Problem Solved

Businesses waste thousands of hours manually reading PDFs, financial invoices, and messy spreadsheets to extract insights. **DocDash AI** eliminates this by acting as an autonomous data pipeline. Users can upload any unstructured document, and the AI instantly generates a highly-structured, interactive Recharts dashboard — no manual data entry, no complex prompt engineering, and no coding required.

## ✨ Core Features

- **📄 Universal Document Parsing** — Native support for PDF, Excel, CSV, JPG, and PNG formats.
- **🤖 Autonomous AI Extraction** — Powered by Groq's lightning-fast LLaMA 3.3 70B model. Forces strict JSON outputs to safely render React components without crashing the DOM.
- **📊 Dynamic Dashboards** — Auto-generates Bar, Line, Pie, and Area charts (via Recharts) alongside critical KPI summary cards based entirely on the AI's contextual understanding of the document.
- **📝 Tabbed Data Editor** — Because AI isn't flawless, users have access to a built-in, tabbed Data Editor to manually correct AI hallucinations, edit KPIs, or tweak the raw JSON array before exporting.
- **💎 Premium UI/UX** — Modern, dark-mode aesthetic featuring deep glassmorphism (`backdrop-filter`), glowing SVG pipelines, and buttery-smooth `framer-motion` page transitions.
- **🔐 Secure Authentication** — Full JWT-based auth flow (Login/Signup) with secure session management.
- **👤 User Profiles & Preferences** — Dedicated settings page for account security and mock data privacy toggles.
- **💾 Cloud Document History** — A collapsible sidebar that saves all past documents and extracted dashboards securely in MongoDB.
- **⬇️ Comprehensive Exports** — Unified export dropdown to download the final dashboard as a **PDF Report**, **PNG Image**, **CSV Tables**, or raw **JSON Data**.
  
## 🛠️ Architecture & Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend UI** | React, Vite, Framer Motion, Lucide React, vanilla CSS variables |
| **Data Visualization** | Recharts, html2canvas, jspdf |
| **Backend API** | Node.js, Express, JWT Auth, Multer (File Handling) |
| **AI Processing Pipeline**| Groq SDK (LLaMA-3.3-70b-versatile) |
| **Database** | MongoDB Atlas, Mongoose |
| **Data Parsers** | `pdf-parse`, `xlsx`, `csvtojson`, `tesseract.js` |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Groq API key ([get free key here](https://console.groq.com/))
- MongoDB URI 

### 1. Backend Setup
```bash
cd backend
npm install
# Create a .env file based on the Environment Variables section below
npm start
```

### 2. Frontend Setup
```bash
cd frontend2
npm install
npm run dev
```

Open **http://localhost:5173** 🎉

## 📁 Project Structure
```text
doc-to-dashboard/
├── backend/
│   ├── server.js              # Express entry point
│   ├── routes/upload.js       # File upload + AI pipeline logic
│   ├── routes/history.js      # Document history CRUD
│   ├── services/aiService.js  # AI prompt engineering for structured JSON
│   ├── services/ocrService.js # Text extraction
│   └── models/Document.js     # MongoDB schema
└── frontend2/src/
    ├── App.jsx                 # Routing (Landing, Auth, App)
    ├── components/Dashboard.jsx# Core visualization engine
    ├── components/DataEditor.jsx# Tabbed data correction UI
    ├── components/ChartCard.jsx
    ├── components/KPICard.jsx
    ├── pages/LandingPage.jsx   # Animated Hero marketing page
    └── pages/UserProfile.jsx   # Settings and preferences
```

## 🔑 Environment Variables
```env
# backend/.env
GROQ_API_KEY=your_groq_api_key_here
MONGODB_URI=your_mongodb_atlas_uri_here
JWT_SECRET=your_secure_random_string
PORT=5000
```

---

*Built as an AI Application subject project — REVA University CSE*
