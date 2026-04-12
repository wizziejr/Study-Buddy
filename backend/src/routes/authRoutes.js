const express = require('express');
const multer = require('multer');
const fs = require('fs');

const {
  register,
  login,
  validateUsername,
  getMe,
  getAllUsers,
  deleteUser,
  forgotPassword,
  verifyOtpAndReset,
  changePassword,
  updateProfile,
} = require('../controllers/authController');
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

router.post('/register', register);
router.post('/login', login);
router.post('/validate-username', validateUsername);
router.get('/me', protect, getMe);
router.get('/users', protect, admin, getAllUsers);
router.delete('/users/:id', protect, admin, deleteUser);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtpAndReset);
router.put('/change-password', protect, changePassword);
router.put('/update-profile', protect, upload.fields([{ name: 'profilePic', maxCount: 1 }, { name: 'backgroundPic', maxCount: 1 }]), updateProfile);

module.exports = router;
