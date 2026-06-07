const path = require('path');
const fs = require('fs');
const { extractText } = require('../services/ocrService');
const { extractDashboardData } = require('../services/aiService');
const Document = require('../models/Document');
const mongoose = require('mongoose');

// POST /api/upload
const uploadDocument = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const originalName = req.file.originalname;
    const fileSize = req.file.size;

    try {
        // Extract text from document (PDF, Excel, CSV)
        const { text } = await extractText(filePath, originalName, req.body.password);

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
                user: req.user._id,
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
        console.error('Upload error:', err.message, err.name);

        // Check if the error is due to password protection
        if (
            err.name === 'PasswordException' || 
            err.message.includes('Password') || 
            err.message.includes('password') ||
            err.message.includes('PasswordException')
        ) {
            const isIncorrect = !!req.body.password;
            return res.status(401).json({
                requiresPassword: true,
                error: isIncorrect ? 'Incorrect password. Please try again.' : 'This PDF is password-protected.'
            });
        }

        if (err.message.includes('JSON')) {
            return res.status(500).json({
                error: 'AI could not parse this document. Try a different file with clearer data.'
            });
        }

        res.status(500).json({ error: err.message || 'Processing failed' });
    }
};

module.exports = {
    uploadDocument
};
