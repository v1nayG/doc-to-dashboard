const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { chatLimiter } = require('../middleware/rateLimiter');
const {
    deleteConversation,
    exportConversation,
    getConversation,
    listConversations,
    renameConversation,
    requireDatabase,
    sendMessage,
    streamMessage
} = require('../controllers/chatController');

router.use(requireDatabase, protect);
router.get('/', listConversations);
router.get('/:id', getConversation);
router.get('/:id/export', exportConversation);
router.patch('/:id', renameConversation);
router.delete('/:id', deleteConversation);
router.post('/', chatLimiter, sendMessage);
router.post('/stream', chatLimiter, streamMessage);

module.exports = router;