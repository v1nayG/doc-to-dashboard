const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');
const dns = require('dns');

// Force Node.js to use Google DNS to bypass ISP blocking of MongoDB SRV records
dns.setServers(['8.8.8.8', '8.8.4.4']);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ─── CORS ──────────────────────────────────────────────────────────────────────
// Only allow requests from the configured frontend origin
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map(o => o.trim());

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (curl, Postman, mobile apps)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`CORS: origin '${origin}' is not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── RATE LIMITING ─────────────────────────────────────────────────────────────
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

app.use(generalLimiter);

// ─── BODY PARSING ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ─── ROUTES ────────────────────────────────────────────────────────────────────
app.use('/api/auth',    authLimiter,   require('./routes/auth'));
app.use('/api/upload',  uploadLimiter, require('./routes/upload'));
app.use('/api/history',                require('./routes/history'));

// Health check
app.get('/', (req, res) => {
    res.json({ status: 'Doc-to-Dashboard API is running 🚀' });
});

// ─── MONGODB + SERVER START ────────────────────────────────────────────────────
const startServer = async () => {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`🔒 CORS allowed origins: ${allowedOrigins.join(', ')}`);
    });

    if (process.env.MONGODB_URI && !process.env.MONGODB_URI.includes('<username>')) {
        try {
            await mongoose.connect(process.env.MONGODB_URI, {
                serverSelectionTimeoutMS: 5000,
                connectTimeoutMS: 5000,
            });
            console.log('✅ MongoDB connected');
        } catch (err) {
            console.warn('⚠️  MongoDB connection failed — running without database (history & auth disabled)');
            console.warn('   Reason:', err.message);
        }
    } else {
        console.log('⚠️  No MongoDB URI — running without database (history disabled)');
    }
};

startServer();

// ─── GLOBAL ERROR HANDLERS ─────────────────────────────────────────────────────
process.on('uncaughtException', (err) => {
    console.error('💥 Uncaught Exception:', err.message);
    console.error(err.stack);
});

process.on('unhandledRejection', (reason) => {
    console.error('💥 Unhandled Rejection:', reason);
});
