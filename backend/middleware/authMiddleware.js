const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

const protect = async (req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ error: 'Authentication is unavailable because the database is not connected.' });
    }

    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');

            // Get user from the token
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ error: 'Not authorized, user not found' });
            }

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ error: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ error: 'Not authorized, no token' });
    }
};

module.exports = { protect };
