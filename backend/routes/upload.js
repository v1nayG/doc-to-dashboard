const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { extractText } = require('../services/ocrService');
const { extractDashboardData } = require('../services/aiService');
const Document = require('../models/Document');
const mongoose = require('mongoose');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname))
    }
});

const fileFilter = (req, file, cb) => {
    const allowed = ['.pdf', '.xlsx', '.xls', '.csv'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Unsupported file type. Please upload PDF, Excel, or CSV files.'));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 20 * 1024 * 1024 }
});

// POST /api/upload
router.post('/', upload.single('document'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const originalName = req.file.originalname;
    const fileSize = req.file.size;

    try {
        // Extract text from document (PDF, Excel, CSV)
        const { text } = await extractText(filePath, originalName);

        if (!text || text.trim().length < 20) {
            return res.status(422).json({
                error: 'Could not extract readable text from this document. Try a different file.'
            });
        }

        // Send extracted text to Groq AI for analysis
        const dashboardData = await extractDashboardData(text, originalName);

        // Add metadata
        dashboardData.fileName = originalName;
        dashboardData.fileSize = fileSize;
        dashboardData.processedAt = new Date().toISOString();

        // Save to MongoDB if connected
        if (mongoose.connection.readyState === 1) {
            const doc = new Document({
                fileName: originalName,
                fileType: path.extname(originalName).toLowerCase(),
                fileSize,
                dashboardData
            });
            const saved = await doc.save();
            dashboardData._id = saved._id;
        }

        // Clean up uploaded file
        fs.unlinkSync(filePath);

        res.json({ success: true, data: dashboardData });
    } catch (err) {
        // Clean up file on error
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        console.error('Upload error:', err.message);

        if (err.message.includes('JSON')) {
            return res.status(500).json({
                error: 'AI could not parse this document. Try a different file with clearer data.'
            });
        }

        res.status(500).json({ error: err.message || 'Processing failed' });
    }
});

module.exports = router;
