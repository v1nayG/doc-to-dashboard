const mongoose = require('mongoose');
const Usage = require('../models/Usage');

const isConnected = () => mongoose.connection.readyState === 1;

// Best-effort metering; failures never block the user-facing request.
const recordUsage = async ({ userId, kind, provider, model, usage, durationMs, requestId }) => {
    if (!isConnected() || !userId) return;
    try {
        await Usage.create({
            user: userId,
            kind,
            provider,
            model,
            promptTokens: usage?.promptTokens || 0,
            completionTokens: usage?.completionTokens || 0,
            totalTokens: usage?.totalTokens || 0,
            durationMs: durationMs || 0,
            requestId
        });
    } catch (error) {
        console.warn(`Usage metering skipped: ${error.message}`);
    }
};

const summarizeUsage = async (userId, days = 30) => {
    if (!isConnected()) return null;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const rows = await Usage.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(String(userId)), createdAt: { $gte: since } } },
        { $group: {
            _id: '$kind',
            requests: { $sum: 1 },
            promptTokens: { $sum: '$promptTokens' },
            completionTokens: { $sum: '$completionTokens' },
            totalTokens: { $sum: '$totalTokens' },
            averageDurationMs: { $avg: '$durationMs' }
        } }
    ]);
    const byKind = Object.fromEntries(rows.map(row => [row._id, {
        requests: row.requests,
        promptTokens: row.promptTokens,
        completionTokens: row.completionTokens,
        totalTokens: row.totalTokens,
        averageDurationMs: Math.round(row.averageDurationMs || 0)
    }]));
    const totals = rows.reduce((total, row) => ({
        requests: total.requests + row.requests,
        totalTokens: total.totalTokens + row.totalTokens
    }), { requests: 0, totalTokens: 0 });
    return { since, days, byKind, totals };
};

// Checks the user's rolling token budget when AI_USER_DAILY_TOKEN_BUDGET is configured.
const checkTokenBudget = async (userId, env = process.env) => {
    const budget = Number.parseInt(env.AI_USER_DAILY_TOKEN_BUDGET, 10);
    if (!Number.isFinite(budget) || budget <= 0 || !isConnected()) return { allowed: true, budget: null, used: 0 };
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [row] = await Usage.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(String(userId)), createdAt: { $gte: since } } },
        { $group: { _id: null, totalTokens: { $sum: '$totalTokens' } } }
    ]);
    const used = row?.totalTokens || 0;
    return { allowed: used < budget, budget, used };
};

module.exports = { checkTokenBudget, recordUsage, summarizeUsage };
