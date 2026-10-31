const crypto = require('crypto');

const SENSITIVE_QUERY_KEYS = new Set(['token', 'password', 'key', 'secret', 'authorization']);

const safePath = url => {
    const [pathname, query = ''] = String(url).split('?');
    if (!query) return pathname;
    const params = new URLSearchParams(query);
    for (const key of [...params.keys()]) {
        if (SENSITIVE_QUERY_KEYS.has(key.toLowerCase())) params.set(key, '[redacted]');
    }
    return `${pathname}?${params.toString()}`;
};

// Attaches a correlation ID and writes one structured JSON log line per request without bodies or tokens.
const requestContext = (req, res, next) => {
    const incoming = req.get('x-request-id');
    req.id = incoming && /^[\w.-]{8,128}$/.test(incoming) ? incoming : crypto.randomUUID();
    res.setHeader('X-Request-Id', req.id);
    const startedAt = process.hrtime.bigint();

    res.on('finish', () => {
        if (process.env.REQUEST_LOGGING === 'off') return;
        const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
        console.log(JSON.stringify({
            level: res.statusCode >= 500 ? 'error' : 'info',
            time: new Date().toISOString(),
            requestId: req.id,
            method: req.method,
            path: safePath(req.originalUrl),
            status: res.statusCode,
            durationMs: Math.round(durationMs),
            userId: req.user?._id ? String(req.user._id) : undefined
        }));
    });
    next();
};

module.exports = { requestContext, safePath };
