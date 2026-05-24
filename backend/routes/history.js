const express = require('express');
const router = express.Router();
const { getHistory, getDocument, deleteDocument } = require('../controllers/historyController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getHistory);
router.get('/:id', protect, getDocument);
router.delete('/:id', protect, deleteDocument);

module.exports = router;
