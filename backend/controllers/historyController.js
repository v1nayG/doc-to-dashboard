const Document = require('../models/Document');
const mongoose = require('mongoose');

const isConnected = () => mongoose.connection.readyState === 1;

// GET /api/history — get all documents for the logged in user (most recent first)
const getHistory = async (req, res) => {
    if (!isConnected()) return res.json({ data: [], message: 'Database not connected' });

    try {
        const docs = await Document.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .limit(20)
            .select('fileName fileType fileSize createdAt dashboardData.title dashboardData.document_type dashboardData.summary');
        res.json({ data: docs });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET /api/history/:id — get a specific document's full dashboard data
const getDocument = async (req, res) => {
    if (!isConnected()) return res.status(503).json({ error: 'Database not connected' });

    try {
        const doc = await Document.findOne({ _id: req.params.id, user: req.user._id });
        if (!doc) return res.status(404).json({ error: 'Document not found or unauthorized' });
        res.json({ data: doc.dashboardData });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// DELETE /api/history/:id — delete a document from history
const deleteDocument = async (req, res) => {
    if (!isConnected()) return res.status(503).json({ error: 'Database not connected' });

    try {
        const doc = await Document.findOneAndDelete({ _id: req.params.id, user: req.user._id });
        if (!doc) return res.status(404).json({ error: 'Document not found or unauthorized' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getHistory,
    getDocument,
    deleteDocument
};
