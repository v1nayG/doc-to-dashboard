const express = require('express');
const router = express.Router();
const Document = require('../models/Document');
const mongoose = require('mongoose');

const isConnected = () => mongoose.connection.readyState === 1;

// GET /api/history — get all documents (most recent first)
router.get('/', async (req, res) => {
    if (!isConnected()) return res.json({ data: [], message: 'Database not connected' });

    try {
        const docs = await Document.find()
            .sort({ createdAt: -1 })
            .limit(20)
            .select('fileName fileType fileSize createdAt dashboardData.title dashboardData.document_type dashboardData.summary');
        res.json({ data: docs });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/history/:id — get a specific document's full dashboard data
router.get('/:id', async (req, res) => {
    if (!isConnected()) return res.status(503).json({ error: 'Database not connected' });

    try {
        const doc = await Document.findById(req.params.id);
        if (!doc) return res.status(404).json({ error: 'Document not found' });
        res.json({ data: doc.dashboardData });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/history/:id — delete a document from history
router.delete('/:id', async (req, res) => {
    if (!isConnected()) return res.status(503).json({ error: 'Database not connected' });

    try {
        await Document.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
