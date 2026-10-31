const test = require('node:test');
const assert = require('node:assert/strict');
const { buildProviderChain, generateWithFallback, requestProvider } = require('../services/aiProviders');

test('provider chain includes only configured primary and fallback keys', () => {
    const chain = buildProviderChain({
        AI_PRIMARY_PROVIDER: 'openrouter',
        AI_FALLBACK_PROVIDER: 'groq',
        OPENROUTER_API_KEY: 'primary-key'
    });

    assert.deepEqual(chain.map(provider => provider.name), ['openrouter']);
});

test('provider retries a rate limit and returns the successful response', async () => {
    let calls = 0;
    const result = await requestProvider(
        { name: 'openai', url: 'https://example.test', apiKey: 'key', model: 'test-model' },
        [{ role: 'user', content: 'hello' }],
        {
            fetchImpl: async () => {
                calls += 1;
                if (calls === 1) return { ok: false, status: 429 };
                return { ok: true, json: async () => ({ choices: [{ message: { content: 'ok' } }] }) };
            },
            retries: 1,
            retryDelayMs: 0,
            timeoutMs: 1000
        }
    );

    assert.equal(calls, 2);
    assert.equal(result.content, 'ok');
    assert.equal(result.provider, 'openai');
});

test('fallback provider is used after the primary exhausts its retries', async () => {
    const chain = [
        { name: 'openrouter', url: 'https://primary.test', apiKey: 'primary', model: 'p' },
        { name: 'groq', url: 'https://fallback.test', apiKey: 'fallback', model: 'f' }
    ];
    const calls = [];
    const result = await generateWithFallback([{ role: 'user', content: 'hello' }], {
        chain,
        retries: 0,
        retryDelayMs: 0,
        timeoutMs: 1000,
        fetchImpl: async url => {
            calls.push(url);
            if (url === 'https://primary.test') return { ok: false, status: 429 };
            return { ok: true, json: async () => ({ choices: [{ message: { content: 'fallback answer' } }] }) };
        }
    });

    assert.deepEqual(calls, ['https://primary.test', 'https://fallback.test']);
    assert.equal(result.provider, 'groq');
    assert.equal(result.content, 'fallback answer');
});

test('missing provider keys fail with configuration guidance', async () => {
    await assert.rejects(
        generateWithFallback([], { env: { AI_PRIMARY_PROVIDER: 'openrouter' } }),
        /No AI provider is configured/
    );
});

test('fallback provider is used when primary output fails schema validation', async () => {
    const chain = [
        { name: 'openrouter', url: 'https://primary.test', apiKey: 'primary', model: 'p' },
        { name: 'groq', url: 'https://fallback.test', apiKey: 'fallback', model: 'f' }
    ];
    const result = await generateWithFallback([{ role: 'user', content: 'hello' }], {
        chain,
        retries: 0,
        timeoutMs: 1000,
        fetchImpl: async url => ({
            ok: true,
            json: async () => ({ choices: [{ message: { content: url.includes('primary') ? 'not-json' : '{"answer":"ok"}' } }] })
        }),
        validate: content => {
            const parsed = JSON.parse(content);
            if (!parsed.answer) throw new Error('Invalid answer schema');
        }
    });

    assert.equal(result.provider, 'groq');
});