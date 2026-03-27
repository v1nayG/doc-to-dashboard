const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/upload', require('./routes/upload'));
app.use('/api/history', require('./routes/history'));

// Health check
app.get('/', (req, res) => {
    res.json({ status: 'Doc-to-Dashboard API is running 🚀' });
});

// MongoDB connection + server start
const startServer = async () => {
    try {
        // If MONGODB_URI is set and valid, connect to MongoDB
        // Otherwise, run without DB (history won't persist but everything else works)
        if (process.env.MONGODB_URI && !process.env.MONGODB_URI.includes('<username>')) {
            await mongoose.connect(process.env.MONGODB_URI);
            console.log('✅ MongoDB connected');
        } else {
            console.log('⚠️  No MongoDB URI — running without database (history disabled)');
        }

        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('Server error:', err);
        process.exit(1);
    }
};

startServer();

// Global error handlers — prevent silent crashes
process.on('uncaughtException', (err) => {
    console.error('💥 Uncaught Exception:', err.message);
    console.error(err.stack);
});

process.on('unhandledRejection', (reason) => {
    console.error('💥 Unhandled Rejection:', reason);
});
