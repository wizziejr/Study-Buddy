const express = require('express');
const multer = require('multer');
const { protect } = require('../middlewares/authMiddleware');
const { askTutor } = require('../controllers/aiController');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/ask', protect, upload.single('document'), askTutor);

module.exports = router;
