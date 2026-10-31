const mongoose = require('mongoose');

const usageSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    kind: { type: String, enum: ['dashboard', 'chat', 'graph', 'embedding'], required: true },
    provider: String,
    model: String,
    promptTokens: { type: Number, default: 0 },
    completionTokens: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },
    durationMs: { type: Number, default: 0 },
    requestId: String,
    createdAt: { type: Date, default: Date.now, index: true }
});

module.exports = mongoose.model('Usage', usageSchema);
