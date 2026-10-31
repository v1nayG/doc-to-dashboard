const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { registerUser, loginUser, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const requireDatabase = (req, res, next) => {
	if (mongoose.connection.readyState !== 1) {
		return res.status(503).json({
			error: 'Authentication is unavailable because the database is not connected.'
		});
	}
	next();
};

router.post('/register', requireDatabase, registerUser);
router.post('/login', requireDatabase, loginUser);
router.get('/me', requireDatabase, protect, getMe);

module.exports = router;
