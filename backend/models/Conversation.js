const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true, maxlength: 12000 },
    charts: { type: [mongoose.Schema.Types.Mixed], default: [] },
    sources: { type: [mongoose.Schema.Types.Mixed], default: [] },
    citations: { type: [mongoose.Schema.Types.Mixed], default: [] },
    insights: { type: [mongoose.Schema.Types.Mixed], default: [] },
    verification: { type: mongoose.Schema.Types.Mixed, default: null },
    trace: { type: [mongoose.Schema.Types.Mixed], default: [] },
    createdAt: { type: Date, default: Date.now }
}, { _id: false });

const conversationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, maxlength: 120 },
    documents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
    messages: { type: [messageSchema], default: [] }
}, { timestamps: true });

conversationSchema.index({ user: 1, updatedAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);