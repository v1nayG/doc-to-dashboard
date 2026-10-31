const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Document = require('../models/Document');
const { runDocumentAgents } = require('../services/agentOrchestrator');
const { checkTokenBudget, recordUsage } = require('../services/usageService');

const MAX_DOCUMENTS = 5;
const MAX_MESSAGES = 40;
const isDatabaseConnected = () => mongoose.connection.readyState === 1;
const isValidId = id => mongoose.Types.ObjectId.isValid(id);

const requireDatabase = (req, res, next) => {
    if (!isDatabaseConnected()) {
        return res.status(503).json({ error: 'Document chat is unavailable because the database is not connected.' });
    }
    next();
};

const listConversations = async (req, res) => {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
    try {
        const filter = { user: req.user._id };
        if (typeof req.query.q === 'string' && req.query.q.trim()) {
            filter.title = { $regex: req.query.q.trim().slice(0, 80).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
        }
        const [conversations, total] = await Promise.all([
            Conversation.find(filter).sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit).select('title documents createdAt updatedAt'),
            Conversation.countDocuments(filter)
        ]);
        res.json({ data: conversations, page, limit, total, hasMore: page * limit < total });
    } catch (error) {
        res.status(500).json({ error: 'Could not load conversations.' });
    }
};

const getConversation = async (req, res) => {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid conversation ID.' });
    try {
        const conversation = await Conversation.findOne({ _id: req.params.id, user: req.user._id })
            .select('title documents messages createdAt updatedAt');
        if (!conversation) return res.status(404).json({ error: 'Conversation not found.' });
        res.json({ data: conversation });
    } catch (error) {
        res.status(500).json({ error: 'Could not load conversation.' });
    }
};

const renameConversation = async (req, res) => {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid conversation ID.' });
    const title = typeof req.body.title === 'string' ? req.body.title.trim().slice(0, 120) : '';
    if (!title) return res.status(400).json({ error: 'Title is required.' });
    try {
        const conversation = await Conversation.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            { $set: { title } },
            { new: true }
        ).select('title documents createdAt updatedAt');
        if (!conversation) return res.status(404).json({ error: 'Conversation not found.' });
        res.json({ data: conversation });
    } catch (error) {
        res.status(500).json({ error: 'Could not rename conversation.' });
    }
};

const deleteConversation = async (req, res) => {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid conversation ID.' });
    try {
        const conversation = await Conversation.findOneAndDelete({ _id: req.params.id, user: req.user._id });
        if (!conversation) return res.status(404).json({ error: 'Conversation not found.' });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Could not delete conversation.' });
    }
};

const toMarkdown = conversation => {
    const lines = [`# ${conversation.title}`, '', `Exported ${new Date().toISOString()}`, ''];
    for (const message of conversation.messages) {
        lines.push(`## ${message.role === 'assistant' ? 'DocDash' : 'You'}`, '', message.content, '');
        if (message.citations?.length) {
            lines.push('Sources:');
            for (const citation of message.citations) lines.push(`- [${citation.id}] ${citation.fileName} (${citation.locator})`);
            lines.push('');
        }
        if (message.charts?.length) {
            for (const chart of message.charts) {
                lines.push(`### Chart: ${chart.title}`, '', '| Label | Value |', '| --- | --- |');
                for (const point of chart.data) lines.push(`| ${point.label} | ${point.value} |`);
                lines.push('');
            }
        }
    }
    return lines.join('\n');
};

const exportConversation = async (req, res) => {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid conversation ID.' });
    try {
        const conversation = await Conversation.findOne({ _id: req.params.id, user: req.user._id });
        if (!conversation) return res.status(404).json({ error: 'Conversation not found.' });
        const safeName = conversation.title.replace(/[^\w.-]+/g, '-').slice(0, 60) || 'conversation';
        if (req.query.format === 'json') {
            res.setHeader('Content-Disposition', `attachment; filename="${safeName}.json"`);
            return res.json({ title: conversation.title, documents: conversation.documents, messages: conversation.messages });
        }
        res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${safeName}.md"`);
        res.send(toMarkdown(conversation));
    } catch (error) {
        res.status(500).json({ error: 'Could not export conversation.' });
    }
};

const validateTurn = body => {
    const question = typeof body.message === 'string' ? body.message.trim() : '';
    const documentIds = Array.isArray(body.documentIds) ? [...new Set(body.documentIds.map(String))] : [];
    if (!question || question.length > 4000) return { error: 'Message must contain 1 to 4000 characters.' };
    if (documentIds.length > MAX_DOCUMENTS || documentIds.some(id => !isValidId(id))) return { error: 'Select between 1 and 5 valid documents.' };
    if (!documentIds.length && !body.conversationId) return { error: 'Select at least one document.' };
    if (body.conversationId && !isValidId(body.conversationId)) return { error: 'Invalid conversation ID.' };
    return { question, documentIds, conversationId: body.conversationId };
};

// Shared by the JSON and SSE endpoints; `onEvent` receives agent progress events.
const runChatTurn = async (req, onEvent) => {
    const turn = validateTurn(req.body);
    if (turn.error) return { status: 400, body: { error: turn.error } };

    const budget = await checkTokenBudget(req.user._id);
    if (!budget.allowed) {
        return { status: 429, body: { error: `Daily AI token budget of ${budget.budget} reached. Try again later.`, used: budget.used } };
    }

    let conversation = null;
    if (turn.conversationId) {
        conversation = await Conversation.findOne({ _id: turn.conversationId, user: req.user._id });
        if (!conversation) return { status: 404, body: { error: 'Conversation not found.' } };
    }
    const selectedIds = turn.documentIds.length ? turn.documentIds : (conversation?.documents || []).map(id => id.toString());
    if (!selectedIds.length) return { status: 400, body: { error: 'Select at least one document.' } };

    const foundDocuments = await Document.find({ user: req.user._id, _id: { $in: selectedIds } })
        .select('fileName extractedText textTruncated dashboardData chunks');
    if (foundDocuments.length !== selectedIds.length) {
        return { status: 404, body: { error: 'One or more selected documents were not found.' } };
    }
    const documentsById = new Map(foundDocuments.map(document => [document._id.toString(), document]));
    const documents = selectedIds.map(id => documentsById.get(id));

    const result = await runDocumentAgents({
        documents,
        history: conversation?.messages || [],
        question: turn.question,
        onEvent
    });

    if (!conversation) {
        conversation = new Conversation({ user: req.user._id, title: turn.question.slice(0, 120), documents: selectedIds });
    } else {
        conversation.documents = selectedIds;
    }
    const sources = documents.map(document => ({ documentId: document._id, fileName: document.fileName }));
    conversation.messages.push({ role: 'user', content: turn.question });
    conversation.messages.push({
        role: 'assistant',
        content: result.answer,
        charts: result.charts,
        sources,
        citations: result.citations,
        insights: result.insights.slice(0, 8),
        verification: result.verification,
        trace: result.trace
    });
    if (conversation.messages.length > MAX_MESSAGES) conversation.messages = conversation.messages.slice(-MAX_MESSAGES);
    await conversation.save();
    await recordUsage({
        userId: req.user._id,
        kind: 'chat',
        provider: result.provider,
        model: result.model,
        usage: result.usage,
        durationMs: result.durationMs,
        requestId: req.id
    });

    return {
        status: 200,
        body: {
            conversationId: conversation._id,
            answer: result.answer,
            charts: result.charts,
            citations: result.citations,
            insights: result.insights.slice(0, 8),
            comparison: result.comparison,
            verification: result.verification,
            plan: result.plan,
            trace: result.trace,
            sources,
            provider: result.provider,
            model: result.model,
            usage: result.usage
        }
    };
};

const sendMessage = async (req, res) => {
    try {
        const outcome = await runChatTurn(req, () => {});
        res.status(outcome.status).json(outcome.body);
    } catch (error) {
        console.error('Document chat failed:', error.message);
        res.status(502).json({ error: 'Could not answer from the selected documents. Please try again.' });
    }
};

// Server-sent events: `step` events while agents run, then one `result` or `error` event.
const streamMessage = async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();
    const send = (event, data) => {
        if (!res.writableEnded) res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };
    const heartbeat = setInterval(() => { if (!res.writableEnded) res.write(': keep-alive\n\n'); }, 15000);
    req.on('close', () => clearInterval(heartbeat));

    try {
        const outcome = await runChatTurn(req, event => send('step', event));
        send(outcome.status === 200 ? 'result' : 'error', outcome.body);
    } catch (error) {
        console.error('Document chat stream failed:', error.message);
        send('error', { error: 'Could not answer from the selected documents. Please try again.' });
    } finally {
        clearInterval(heartbeat);
        res.end();
    }
};

module.exports = {
    deleteConversation,
    exportConversation,
    getConversation,
    listConversations,
    renameConversation,
    requireDatabase,
    sendMessage,
    streamMessage
};
