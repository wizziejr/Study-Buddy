const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const { getNotifications, markAllRead } = require('../controllers/notificationController');

const router = express.Router();

router.get('/', protect, getNotifications);
router.post('/mark-read', protect, markAllRead);

module.exports = router;
