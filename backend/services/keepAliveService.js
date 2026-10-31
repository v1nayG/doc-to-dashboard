const DEFAULT_INTERVAL_MS = 10 * 60 * 1000;
const MIN_INTERVAL_MS = 5 * 60 * 1000;
const MAX_INTERVAL_MS = 24 * 60 * 60 * 1000;

const normalizeInterval = value => {
    const parsed = Number.parseInt(value, 10);
    const interval = Number.isFinite(parsed) ? parsed : DEFAULT_INTERVAL_MS;
    return Math.min(MAX_INTERVAL_MS, Math.max(MIN_INTERVAL_MS, interval));
};

const startKeepAlive = ({
    url = process.env.KEEP_ALIVE_URL,
    intervalMs = process.env.KEEP_ALIVE_INTERVAL_MS,
    fetchImpl = fetch,
    setIntervalImpl = setInterval,
    clearIntervalImpl = clearInterval,
    warn = console.warn
} = {}) => {
    if (!url) return () => {};

    try {
        const target = new URL(url);
        if (!['http:', 'https:'].includes(target.protocol)) throw new Error('Unsupported protocol');
    } catch {
        warn('Keep-alive disabled: KEEP_ALIVE_URL must be an HTTP(S) URL.');
        return () => {};
    }

    let active = true;
    let inFlight = false;
    const ping = async () => {
        if (!active || inFlight) return;
        inFlight = true;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        try {
            const response = await fetchImpl(url, { signal: controller.signal });
            if (!response.ok) warn(`Keep-alive endpoint returned HTTP ${response.status}.`);
        } catch (error) {
            warn(`Keep-alive request failed (${error.name || 'network error'}).`);
        } finally {
            clearTimeout(timeout);
            inFlight = false;
        }
    };

    const timer = setIntervalImpl(ping, normalizeInterval(intervalMs));
    timer?.unref?.();
    return () => {
        active = false;
        clearIntervalImpl(timer);
    };
};

module.exports = { normalizeInterval, startKeepAlive };