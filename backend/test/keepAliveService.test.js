const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeInterval, startKeepAlive } = require('../services/keepAliveService');

test('keep-alive interval uses a bounded configurable range', () => {
    assert.equal(normalizeInterval('600000'), 600000);
    assert.equal(normalizeInterval('1000'), 300000);
    assert.equal(normalizeInterval('999999999'), 86400000);
});

test('keep-alive is disabled when no target is configured', () => {
    let scheduled = false;
    startKeepAlive({ setIntervalImpl: () => { scheduled = true; } });
    assert.equal(scheduled, false);
});

test('keep-alive catches failed health requests and remains stoppable', async () => {
    let scheduledPing;
    let cleared = false;
    const warnings = [];
    const stop = startKeepAlive({
        url: 'https://service.example/health',
        intervalMs: 300000,
        fetchImpl: async () => { throw new TypeError('network failure'); },
        setIntervalImpl: callback => { scheduledPing = callback; return 7; },
        clearIntervalImpl: timer => { cleared = timer === 7; },
        warn: message => warnings.push(message)
    });

    await scheduledPing();
    stop();
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /Keep-alive request failed/);
    assert.equal(cleared, true);
});