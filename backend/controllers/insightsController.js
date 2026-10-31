const mongoose = require('mongoose');
const Document = require('../models/Document');
const { extractDocumentGraph, mergeGraphs } = require('../services/knowledgeGraph');
const { analyzeDocuments, compareDocuments } = require('../services/analysisEngine');
const { retrieveChunks } = require('../services/retrieval');
const { recordUsage, summarizeUsage } = require('../services/usageService');
const { uploadJobs } = require('../services/jobQueue');

const MAX_DOCUMENTS = 5;
const GRAPH_CACHE_MS = 7 * 24 * 60 * 60 * 1000;

const loadOwnedDocuments = async (req, select) => {
    const ids = Array.isArray(req.body.documentIds) ? [...new Set(req.body.documentIds.map(String))] : [];
    if (!ids.length || ids.length > MAX_DOCUMENTS || ids.some(id => !mongoose.Types.ObjectId.isValid(id))) {
        return { error: 'Select between 1 and 5 valid documents.' };
    }
    const found = await Document.find({ user: req.user._id, _id: { $in: ids } }).select(select);
    if (found.length !== ids.length) return { error: 'One or more selected documents were not found.' };
    const byId = new Map(found.map(document => [document._id.toString(), document]));
    return { documents: ids.map(id => byId.get(id)) };
};

// Builds the relationship map; per-document entity graphs are cached on the document for a week.
const buildGraph = async (req, res) => {
    try {
        const loaded = await loadOwnedDocuments(req, 'fileName dashboardData chunks extractedText graph');
        if (loaded.error) return res.status(400).json({ error: loaded.error });
        const startedAt = Date.now();
        const refresh = req.body.refresh === true;

        const graphs = await Promise.all(loaded.documents.map(async document => {
            const cached = document.graph;
            if (!refresh && cached?.generatedAt && Date.now() - new Date(cached.generatedAt).getTime() < GRAPH_CACHE_MS) return cached;
            try {
                const graph = await extractDocumentGraph(document);
                document.graph = { entities: graph.entities, relations: graph.relations, generatedAt: graph.generatedAt };
                await Document.updateOne({ _id: document._id }, { $set: { graph: document.graph } });
                await recordUsage({ userId: req.user._id, kind: 'graph', provider: graph.provider, usage: graph.usage, requestId: req.id });
                return document.graph;
            } catch (error) {
                console.warn(`Graph extraction skipped for ${document.fileName}: ${error.message}`);
                return null;
            }
        }));

        const merged = mergeGraphs(loaded.documents, graphs);
        res.json({
            ...merged,
            documents: loaded.documents.map((document, index) => ({
                documentId: document._id,
                fileName: document.fileName,
                extracted: Boolean(graphs[index]),
                generatedAt: graphs[index]?.generatedAt || null
            })),
            durationMs: Date.now() - startedAt
        });
    } catch (error) {
        console.error('Graph build failed:', error.message);
        res.status(500).json({ error: 'Could not build the relationship map.' });
    }
};

const analyze = async (req, res) => {
    try {
        const loaded = await loadOwnedDocuments(req, 'fileName dashboardData');
        if (loaded.error) return res.status(400).json({ error: loaded.error });
        res.json({
            insights: analyzeDocuments(loaded.documents),
            comparison: loaded.documents.length > 1 ? compareDocuments(loaded.documents) : null
        });
    } catch (error) {
        res.status(500).json({ error: 'Could not analyze the selected documents.' });
    }
};

// Semantic/lexical search across the user's most recent documents.
const search = async (req, res) => {
    const query = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 300) : '';
    if (!query) return res.status(400).json({ error: 'Query parameter q is required.' });
    const limit = Math.min(20, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));
    try {
        const documents = await Document.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(40).select('fileName chunks tags');
        const results = await retrieveChunks({ documents, query, limit, perDocumentMax: 3 });
        res.json({ query, results: results.map(({ text, ...rest }) => rest) });
    } catch (error) {
        res.status(500).json({ error: 'Search failed.' });
    }
};

const usage = async (req, res) => {
    try {
        const days = Math.min(90, Math.max(1, Number.parseInt(req.query.days, 10) || 30));
        const summary = await summarizeUsage(req.user._id, days);
        res.json({ ...summary, jobs: uploadJobs.stats() });
    } catch (error) {
        res.status(500).json({ error: 'Could not load usage.' });
    }
};

module.exports = { analyze, buildGraph, search, usage };
