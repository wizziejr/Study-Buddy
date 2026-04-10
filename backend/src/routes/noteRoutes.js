const express = require('express');
const multer = require('multer');
const { protect } = require('../middlewares/authMiddleware');
const { getNotes, uploadNote } = require('../controllers/noteController');

const router = express.Router();

// Setup disk storage instead of memory so we can host downloads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

router.get('/', protect, getNotes);
router.post('/upload', protect, upload.single('file'), uploadNote);

module.exports = router;
