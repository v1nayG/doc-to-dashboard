const mongoose = require('mongoose');

const chunkSchema = new mongoose.Schema({
    index: { type: Number, required: true },
    text: { type: String, required: true },
    start: Number,
    end: Number,
    page: Number,
    sheet: String,
    embedding: { type: [Number], default: undefined }
}, { _id: false });

const documentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fileName: { type: String, required: true },
    fileType: { type: String, required: true },
    fileSize: { type: Number },
    extractedText: { type: String, default: '' },
    textTruncated: { type: Boolean, default: false },
    chunks: { type: [chunkSchema], default: [] },
    tags: { type: [String], default: [] },
    graph: { type: mongoose.Schema.Types.Mixed, default: null },
    dashboardData: { type: Object, required: true },
    createdAt: { type: Date, default: Date.now }
});

documentSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Document', documentSchema);
