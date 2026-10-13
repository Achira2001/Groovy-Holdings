const router = require('express').Router();
const c = require('../controllers/chatController');
const { protect, restrictTo } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);
router.get('/unread', c.unreadCount);
router.get('/my-conversation', restrictTo('customer'), c.myConversation);
router.get('/conversations', restrictTo('admin'), c.listConversations);
router.post('/start/:customerId', restrictTo('admin'), c.startWithCustomer);
router.get('/conversations/:id/messages', c.getMessages);
router.post('/conversations/:id/messages', upload.designFiles, c.sendMessage);
router.post('/conversations/:id/read', c.markRead);
router.get('/conversations/:id/files', c.listFiles);
router.delete('/messages/:messageId', c.deleteMessage);

module.exports = router;
