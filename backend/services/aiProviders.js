const PROVIDERS = {
    openrouter: {
        url: 'https://openrouter.ai/api/v1/chat/completions',
        key: 'OPENROUTER_API_KEY',
        model: 'OPENROUTER_MODEL',
        defaultModel: 'nvidia/nemotron-3-ultra-550b-a55b:free'
    },
    openai: {
        url: 'https://api.openai.com/v1/chat/completions',
        key: 'OPENAI_API_KEY',
        model: 'OPENAI_MODEL',
        defaultModel: 'gpt-4o-mini'
    },
    groq: {
        url: 'https://api.groq.com/openai/v1/chat/completions',
        key: 'GROQ_API_KEY',
        model: 'GROQ_MODEL',
        defaultModel: 'llama-3.3-70b-versatile'
    },
    gemini: {
        url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
        key: 'GEMINI_API_KEY',
        model: 'GEMINI_MODEL',
        defaultModel: 'gemini-2.5-flash'
    }
};

const clampInteger = (value, fallback, min, max) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
};

const resolveProvider = (name, env = process.env) => {
    const providerName = String(name || '').trim().toLowerCase();
    const definition = PROVIDERS[providerName];
    if (!definition || !env[definition.key]) return null;

    return {
        name: providerName,
        url: definition.url,
        apiKey: env[definition.key],
        model: env[definition.model] || definition.defaultModel
    };
};

const buildProviderChain = (env = process.env) => {
    const primary = String(env.AI_PRIMARY_PROVIDER || 'openrouter').toLowerCase();
    const fallback = String(env.AI_FALLBACK_PROVIDER || '').toLowerCase();
    return [...new Set([primary, fallback])]
        .filter(Boolean)
        .map(name => resolveProvider(name, env))
        .filter(Boolean);
};

const isRetryableStatus = status => status === 408 || status === 429 || status >= 500;
const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

const requestProvider = async (provider, messages, options = {}) => {
    const fetchImpl = options.fetchImpl || fetch;
    const timeoutMs = clampInteger(options.timeoutMs ?? process.env.AI_REQUEST_TIMEOUT_MS, 45000, 1000, 120000);
    const retries = clampInteger(options.retries ?? process.env.AI_RETRIES, 1, 0, 2);
    const retryDelayMs = options.retryDelayMs ?? 250;
    let lastError;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const headers = {
                Authorization: `Bearer ${provider.apiKey}`,
                'Content-Type': 'application/json'
            };
            if (provider.name === 'openrouter') {
                headers['HTTP-Referer'] = 'https://github.com/v1nayG/doc-to-dashboard';
                headers['X-Title'] = 'DocDash';
            }

            const response = await fetchImpl(provider.url, {
                method: 'POST',
                headers,
                signal: controller.signal,
                body: JSON.stringify({
                    model: provider.model,
                    max_tokens: options.maxTokens || 4096,
                    temperature: options.temperature ?? 0.2,
                    messages,
                    response_format: options.jsonMode === false ? undefined : { type: 'json_object' }
                })
            });

            if (!response.ok) {
                const error = new Error(`${provider.name} returned HTTP ${response.status}`);
                error.retryable = isRetryableStatus(response.status);
                throw error;
            }

            const payload = await response.json();
            const content = payload?.choices?.[0]?.message?.content?.trim();
            if (!content) throw new Error(`${provider.name} returned an empty response`);
            const usage = payload?.usage
                ? {
                    promptTokens: Number(payload.usage.prompt_tokens) || 0,
                    completionTokens: Number(payload.usage.completion_tokens) || 0,
                    totalTokens: Number(payload.usage.total_tokens) || 0
                }
                : null;
            return { content, provider: provider.name, model: provider.model, usage };
        } catch (error) {
            lastError = error.name === 'AbortError'
                ? new Error(`${provider.name} timed out after ${timeoutMs}ms`)
                : error;
            const retryable = error.name === 'AbortError' || error.retryable || !error.status;
            if (!retryable || attempt >= retries) break;
            if (retryDelayMs > 0) await wait(retryDelayMs * (attempt + 1));
        } finally {
            clearTimeout(timeout);
        }
    }

    throw lastError;
};

const generateWithFallback = async (messages, options = {}) => {
    const chain = options.chain || buildProviderChain(options.env || process.env);
    if (chain.length === 0) {
        throw new Error('No AI provider is configured. Set a provider API key in backend/.env.');
    }

    const errors = [];
    for (const provider of chain) {
        try {
            const result = await requestProvider(provider, messages, options);
            if (options.validate) await options.validate(result.content);
            return result;
        } catch (error) {
            errors.push(`${provider.name}: ${error.message}`);
            console.warn(`AI provider ${provider.name} failed: ${error.message}`);
        }
    }

    throw new Error(`All configured AI providers failed. ${errors.join('; ')}`);
};

const EMBEDDING_DEFAULTS = {
    openai: 'text-embedding-3-small',
    openrouter: 'openai/text-embedding-3-small',
    gemini: 'gemini-embedding-001'
};

const resolveEmbeddingProvider = (env = process.env) => {
    const name = String(env.AI_EMBEDDINGS_PROVIDER || '').trim().toLowerCase();
    if (!EMBEDDING_DEFAULTS[name]) return null;
    const provider = resolveProvider(name, env);
    if (!provider) return null;
    return {
        ...provider,
        url: provider.url.replace(/\/chat\/completions$/, '/embeddings'),
        model: env.AI_EMBEDDINGS_MODEL || EMBEDDING_DEFAULTS[name]
    };
};

const embeddingsEnabled = (env = process.env) => resolveEmbeddingProvider(env) !== null;

// Returns null when embeddings are not configured so callers fall back to lexical retrieval.
const embedTexts = async (texts, options = {}) => {
    const provider = options.provider || resolveEmbeddingProvider(options.env || process.env);
    if (!provider || !texts.length) return null;
    const fetchImpl = options.fetchImpl || fetch;
    const timeoutMs = clampInteger(options.timeoutMs ?? process.env.AI_REQUEST_TIMEOUT_MS, 45000, 1000, 120000);
    const batchSize = 64;
    const vectors = [];

    for (let start = 0; start < texts.length; start += batchSize) {
        const batch = texts.slice(start, start + batchSize).map(text => text.slice(0, 8000));
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const response = await fetchImpl(provider.url, {
                method: 'POST',
                headers: { Authorization: `Bearer ${provider.apiKey}`, 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({ model: provider.model, input: batch })
            });
            if (!response.ok) throw new Error(`${provider.name} embeddings returned HTTP ${response.status}`);
            const payload = await response.json();
            const data = Array.isArray(payload?.data) ? payload.data : [];
            if (data.length !== batch.length) throw new Error(`${provider.name} embeddings returned ${data.length} vectors for ${batch.length} inputs`);
            data.sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
            for (const item of data) vectors.push(item.embedding.map(Number));
        } finally {
            clearTimeout(timeout);
        }
    }

    return vectors;
};

module.exports = {
    buildProviderChain,
    embedTexts,
    embeddingsEnabled,
    generateWithFallback,
    requestProvider,
    resolveEmbeddingProvider,
    resolveProvider
};