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

// Use memory storage for direct DB storage (Base64)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

router.post('/register', upload.fields([{ name: 'profilePic', maxCount: 1 }]), register);
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
