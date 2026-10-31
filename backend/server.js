const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');
const dns = require('dns');
const { startKeepAlive } = require('./services/keepAliveService');
const { requestContext } = require('./middleware/requestContext');

// Force Node.js to use Google DNS to bypass ISP blocking of MongoDB SRV records
dns.setServers(['8.8.8.8', '8.8.4.4']);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
app.set('trust proxy', Number.parseInt(process.env.TRUST_PROXY_HOPS, 10) || 0);
app.disable('x-powered-by');
app.use(requestContext);

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
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id'],
}));

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.get('/ready', (req, res) => {
    const databaseConnected = mongoose.connection.readyState === 1;
    res.status(databaseConnected ? 200 : 503).json({
        status: databaseConnected ? 'ready' : 'not_ready',
        database: databaseConnected ? 'connected' : 'disconnected'
    });
});

const { authLimiter, uploadLimiter, generalLimiter } = require('./middleware/rateLimiter');

app.use(generalLimiter);

// ─── BODY PARSING ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ─── ROUTES ────────────────────────────────────────────────────────────────────
app.use('/api/auth',    authLimiter,   require('./routes/auth'));
app.use('/api/upload',  uploadLimiter, require('./routes/upload'));
app.use('/api/history',                require('./routes/history'));
app.use('/api/chat',                   require('./routes/chat'));
app.use('/api/insights',               require('./routes/insights'));

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
    startKeepAlive();

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
