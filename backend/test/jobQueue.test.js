const test = require('node:test');
const assert = require('node:assert/strict');
const { createJobQueue } = require('../services/jobQueue');
const { safePath } = require('../middleware/requestContext');

const flush = () => new Promise(resolve => setImmediate(resolve));

test('job queue runs jobs with bounded concurrency, tracks progress, and scopes results to owners', async () => {
    const queue = createJobQueue({ concurrency: 1 });
    let release;
    const gate = new Promise(resolve => { release = resolve; });

    const first = queue.enqueue({ ownerId: 'u1', type: 'upload', total: 2, run: async progress => { progress({ completed: 1 }); await gate; return { ok: 1 }; } });
    const second = queue.enqueue({ ownerId: 'u1', type: 'upload', run: async () => { throw new Error('boom'); } });
    await flush();

    assert.equal(queue.get(first.id, 'u1').status, 'running');
    assert.equal(queue.get(first.id, 'u1').progress.completed, 1);
    assert.equal(queue.get(second.id, 'u1').status, 'queued');
    assert.equal(queue.get(first.id, 'someone-else'), null);
    assert.deepEqual(queue.stats(), { queued: 1, active: 1, tracked: 2, concurrency: 1 });

    release();
    await flush();
    await flush();

    assert.equal(queue.get(first.id, 'u1').status, 'completed');
    assert.deepEqual(queue.get(first.id, 'u1').result, { ok: 1 });
    assert.equal(queue.get(second.id, 'u1').status, 'failed');
    assert.equal(queue.get(second.id, 'u1').error, 'boom');
});

test('job queue prunes finished jobs after their TTL', async () => {
    let clock = 1000;
    const queue = createJobQueue({ concurrency: 1, ttlMs: 10, now: () => clock });
    const job = queue.enqueue({ ownerId: 'u1', type: 'upload', run: async () => 'done' });
    await flush();
    await flush();
    assert.equal(queue.get(job.id, 'u1').status, 'completed');

    clock += 50;
    queue.enqueue({ ownerId: 'u1', type: 'upload', run: async () => 'later' });
    assert.equal(queue.get(job.id, 'u1'), null);
});

test('request logging redacts sensitive query parameters', () => {
    assert.equal(safePath('/api/search?q=revenue&token=abc'), '/api/search?q=revenue&token=%5Bredacted%5D');
    assert.equal(safePath('/api/chat'), '/api/chat');
});
