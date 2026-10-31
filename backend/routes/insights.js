const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { chatLimiter } = require('../middleware/rateLimiter');
const { requireDatabase } = require('../controllers/chatController');
const { analyze, buildGraph, search, usage } = require('../controllers/insightsController');
const { getJob } = require('../controllers/uploadController');

router.use(requireDatabase, protect);
router.post('/graph', chatLimiter, buildGraph);
router.post('/analysis', analyze);
router.get('/search', search);
router.get('/usage/me', usage);
router.get('/jobs/:id', getJob);

module.exports = router;
