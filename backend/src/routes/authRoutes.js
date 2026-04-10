const express = require('express');
const {
  register,
  login,
  validateUsername,
  getMe,
  getAllUsers,
  deleteUser,
  forgotPassword,
  verifyOtpAndReset,
} = require('../controllers/authController');
const { protect, admin } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/validate-username', validateUsername);
router.get('/me', protect, getMe);
router.get('/users', protect, admin, getAllUsers);
router.delete('/users/:id', protect, admin, deleteUser);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtpAndReset);

module.exports = router;
