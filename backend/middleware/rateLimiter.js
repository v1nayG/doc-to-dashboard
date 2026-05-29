const rateLimit = require('express-rate-limit');

// Auth routes — strict: prevent brute-force login/register attempts
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 10,
    message: { error: 'Too many auth attempts. Please wait 15 minutes and try again.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Upload route — protect Groq API quota from abuse
const uploadLimiter = rateLimit({
    windowMs: 60 * 1000,        // 1 minute
    max: 5,
    message: { error: 'Too many uploads. You can upload at most 5 files per minute.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// General API — broad safety net for all other routes
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 100,
    message: { error: 'Too many requests. Please slow down and try again shortly.' },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    authLimiter,
    uploadLimiter,
    generalLimiter,
};
