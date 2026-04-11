const express = require('express');
const {
  createGroup,
  getGroups,
  deleteGroup,
  sendMessage,
  getMessages,
} = require('../controllers/groupController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', protect, getGroups);
router.post('/', protect, createGroup);
router.delete('/:id', protect, deleteGroup);
router.get('/:id/messages', protect, getMessages);
router.post('/:id/messages', protect, sendMessage);

module.exports = router;
