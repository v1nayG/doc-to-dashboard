const crypto = require('crypto');

const DEFAULT_CONCURRENCY = 2;
const JOB_TTL_MS = 60 * 60 * 1000;
const MAX_JOBS = 500;

// In-process job queue; swap `createJobQueue` for a persistent backend when running multiple instances.
const createJobQueue = ({ concurrency = DEFAULT_CONCURRENCY, ttlMs = JOB_TTL_MS, now = Date.now } = {}) => {
    const jobs = new Map();
    const pending = [];
    let active = 0;

    const prune = () => {
        const cutoff = now() - ttlMs;
        for (const [id, job] of jobs) {
            if (job.finishedAt && job.finishedAt < cutoff) jobs.delete(id);
        }
        while (jobs.size > MAX_JOBS) {
            const oldest = [...jobs.values()].filter(job => job.finishedAt).sort((left, right) => left.finishedAt - right.finishedAt)[0];
            if (!oldest) break;
            jobs.delete(oldest.id);
        }
    };

    const pump = () => {
        while (active < concurrency && pending.length) {
            const job = pending.shift();
            active += 1;
            job.status = 'running';
            job.startedAt = now();
            Promise.resolve()
                .then(() => job.run(progress => {
                    job.progress = { ...job.progress, ...progress, updatedAt: now() };
                }))
                .then(result => {
                    job.status = 'completed';
                    job.result = result;
                })
                .catch(error => {
                    job.status = 'failed';
                    job.error = error.message || 'Job failed';
                })
                .finally(() => {
                    job.finishedAt = now();
                    active -= 1;
                    prune();
                    pump();
                });
        }
    };

    const enqueue = ({ ownerId, type, run, total = 0 }) => {
        prune();
        const job = {
            id: crypto.randomUUID(),
            ownerId: String(ownerId),
            type,
            status: 'queued',
            progress: { completed: 0, total },
            createdAt: now(),
            startedAt: null,
            finishedAt: null,
            result: null,
            error: null,
            run
        };
        jobs.set(job.id, job);
        pending.push(job);
        pump();
        return publicView(job);
    };

    const publicView = job => job && ({
        id: job.id,
        type: job.type,
        status: job.status,
        progress: job.progress,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        finishedAt: job.finishedAt,
        result: job.status === 'completed' ? job.result : null,
        error: job.error
    });

    const get = (id, ownerId) => {
        const job = jobs.get(id);
        if (!job || job.ownerId !== String(ownerId)) return null;
        return publicView(job);
    };

    const stats = () => ({ queued: pending.length, active, tracked: jobs.size, concurrency });

    return { enqueue, get, stats };
};

module.exports = { createJobQueue, uploadJobs: createJobQueue({ concurrency: Number.parseInt(process.env.UPLOAD_JOB_CONCURRENCY, 10) || DEFAULT_CONCURRENCY }) };
