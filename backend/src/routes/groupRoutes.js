const express = require('express');
const multer = require('multer');
const fs = require('fs');

const { 
  getGroups, 
  createGroup, 
  deleteGroup, 
  updateGroupSettings,
  joinGroup,
  leaveGroup,
  getMembers,
  manageMember,
  getMessages, 
  sendMessage,
  editMessage,
  deleteMessage
} = require('../controllers/groupController');
const { protect, admin } = require('../middlewares/authMiddleware');

const router = express.Router();

const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'));
  }
});
const upload = multer({ storage: storage });

router.get('/', protect, getGroups);
router.post('/', protect, createGroup);
router.delete('/:id', protect, deleteGroup);
router.put('/:id/settings', protect, upload.fields([{ name: 'groupIcon', maxCount: 1 }, { name: 'groupBg', maxCount: 1 }]), updateGroupSettings);

// Member routes
router.post('/:id/join', protect, joinGroup);
router.post('/:id/leave', protect, leaveGroup);
router.get('/:id/members', protect, getMembers);
router.put('/:id/members/:memberId/manage', protect, manageMember);

// Message routes
router.get('/:id/messages', protect, getMessages);
router.post('/:id/messages', protect, sendMessage);
router.put('/:id/messages/:messageId', protect, editMessage);
router.delete('/:id/messages/:messageId', protect, deleteMessage);

module.exports = router;
