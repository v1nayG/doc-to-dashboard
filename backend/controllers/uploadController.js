const path = require('path');
const fs = require('fs');
const { extractText } = require('../services/ocrService');
const { extractDashboardData } = require('../services/aiService');
const { chunkText } = require('../services/chunker');
const { embedTexts, embeddingsEnabled } = require('../services/aiProviders');
const { recordUsage } = require('../services/usageService');
const { uploadJobs } = require('../services/jobQueue');
const Document = require('../models/Document');
const mongoose = require('mongoose');

const MAX_STORED_TEXT_CHARS = 80000;
const MAX_TAGS = 8;

const deriveTags = (dashboardData, fileType) => {
    const tags = new Set([fileType.replace('.', '')]);
    if (dashboardData.document_type) tags.add(String(dashboardData.document_type).toLowerCase());
    for (const kpi of (dashboardData.kpis || []).slice(0, 4)) {
        const label = String(kpi.label || '').toLowerCase().trim();
        if (label) tags.add(label.slice(0, 40));
    }
    return [...tags].slice(0, MAX_TAGS);
};

const embedChunks = async chunks => {
    if (!embeddingsEnabled() || !chunks.length) return chunks;
    try {
        const vectors = await embedTexts(chunks.map(chunk => chunk.text));
        return vectors ? chunks.map((chunk, index) => ({ ...chunk, embedding: vectors[index] })) : chunks;
    } catch (error) {
        console.warn(`Chunk embeddings skipped: ${error.message}`);
        return chunks;
    }
};

// `context` carries only what processing needs so queued jobs do not retain request objects.
const processUploadedFile = async (context, file) => {
    const filePath = file.path;
    const startedAt = Date.now();
    try {
        const { text } = await extractText(filePath, file.originalname, context.password);

        if (!text || text.trim().length < 20) {
            const error = new Error('Could not extract readable text from this document. Try a different file.');
            error.statusCode = 422;
            throw error;
        }

        const dashboardData = await extractDashboardData(text, file.originalname);
        dashboardData.fileName = file.originalname;
        dashboardData.fileSize = file.size;
        dashboardData.processedAt = new Date().toISOString();
        const fileType = path.extname(file.originalname).toLowerCase();
        const tags = deriveTags(dashboardData, fileType);

        if (mongoose.connection.readyState === 1) {
            const chunks = await embedChunks(chunkText(text));
            const doc = new Document({
                user: context.user._id,
                fileName: file.originalname,
                fileType,
                fileSize: file.size,
                extractedText: text.slice(0, MAX_STORED_TEXT_CHARS),
                textTruncated: text.length > MAX_STORED_TEXT_CHARS,
                chunks,
                tags,
                dashboardData
            });
            const saved = await doc.save();
            dashboardData._id = saved._id;
            dashboardData.chunkCount = chunks.length;
            await recordUsage({
                userId: context.user._id,
                kind: 'dashboard',
                provider: dashboardData.aiProvider,
                model: dashboardData.aiModel,
                durationMs: Date.now() - startedAt,
                requestId: context.requestId
            });
        }
        dashboardData.tags = tags;

        return { success: true, data: dashboardData };
    } catch (err) {
        console.error('Upload error:', file.originalname, err.message, err.name);
        if (err.name === 'PasswordException' || /password/i.test(err.message)) {
            const isIncorrect = Boolean(context.password);
            return {
                success: false,
                fileName: file.originalname,
                statusCode: 401,
                requiresPassword: true,
                error: isIncorrect ? 'Incorrect password. Please try again.' : 'This PDF is password-protected.'
            };
        }

        return {
            success: false,
            fileName: file.originalname,
            statusCode: err.statusCode || 500,
            error: err.message.includes('JSON')
                ? 'AI could not parse this document. Try a different file with clearer data.'
                : err.message || 'Processing failed'
        };
    } finally {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
};

const contextFrom = req => ({ user: req.user, password: req.body.password, requestId: req.id });

const processBatch = async (context, files, onProgress = () => {}) => {
    const results = new Array(files.length);
    let nextIndex = 0;
    let completed = 0;
    const workers = Array.from({ length: Math.min(2, files.length) }, async () => {
        while (nextIndex < files.length) {
            const index = nextIndex;
            nextIndex += 1;
            results[index] = await processUploadedFile(context, files[index]);
            completed += 1;
            onProgress({ completed, total: files.length, current: files[index].originalname });
        }
    });
    await Promise.all(workers);
    const documents = results.filter(result => result.success).map(result => result.data);
    const errors = results.filter(result => !result.success).map(({ statusCode, ...error }) => error);
    return { documents, errors };
};

const uploadDocument = async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const result = await processUploadedFile(contextFrom(req), req.file);
    if (!result.success) {
        const { statusCode, ...body } = result;
        return res.status(statusCode).json(body);
    }
    res.json(result);
};

const uploadDocuments = async (req, res) => {
    if (!req.files?.length) return res.status(400).json({ error: 'No files uploaded' });

    const { documents, errors } = await processBatch(contextFrom(req), req.files);
    if (documents.length === 0) {
        return res.status(422).json({ success: false, documents, errors });
    }
    res.status(201).json({ success: true, documents, errors });
};

// Queues the batch and returns immediately; clients poll /api/jobs/:id for progress and results.
const uploadDocumentsAsync = async (req, res) => {
    if (!req.files?.length) return res.status(400).json({ error: 'No files uploaded' });
    const context = contextFrom(req);
    const files = req.files;
    const job = uploadJobs.enqueue({
        ownerId: req.user._id,
        type: 'upload',
        total: files.length,
        run: progress => processBatch(context, files, progress)
    });
    res.status(202).json({ jobId: job.id, status: job.status, progress: job.progress });
};

const getJob = (req, res) => {
    const job = uploadJobs.get(req.params.id, req.user._id);
    if (!job) return res.status(404).json({ error: 'Job not found.' });
    res.json(job);
};

module.exports = {
    getJob,
    processUploadedFile,
    uploadDocument,
    uploadDocuments,
    uploadDocumentsAsync
};
