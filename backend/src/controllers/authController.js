const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AfricasTalking = require('africastalking');

const prisma = new PrismaClient();

// ─── Africa's Talking SMS Client ──────────────────────────────────────────────
const at = AfricasTalking({
  username: process.env.AT_USERNAME || 'sandbox',
  apiKey: process.env.AT_API_KEY || '',
});
const sms = at.SMS;

// ─── OTP Store (in-memory, phone → { code, expiresAt }) ──────────────────────
const otpStore = {};

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// ─── Password Strength Validator ──────────────────────────────────────────────
const validatePassword = (password) => {
  if (password.length < 7) return 'Password must be at least 7 characters';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Password must contain at least one symbol (e.g. !, @, #, ?)';
  return null;
};

// ─── REGISTER ───────────────────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { username, phone, email, password, level } = req.body;

    if (!phone || !phone.startsWith('+265')) {
      return res.status(400).json({ message: 'Phone number must start with +265' });
    }

    const userByUsername = await prisma.user.findUnique({ where: { username } });
    if (userByUsername) return res.status(400).json({ message: 'Username already taken' });

    const userByPhone = await prisma.user.findUnique({ where: { phone } });
    if (userByPhone) return res.status(400).json({ message: 'Phone number already registered' });

    if (email) {
      const userByEmail = await prisma.user.findUnique({ where: { email } });
      if (userByEmail) return res.status(400).json({ message: 'Email already registered' });
    }

    // ── Password strength check ───────────────────────────────────────────
    const pwError = validatePassword(password);
    if (pwError) return res.status(400).json({ message: pwError });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        phone,
        email: email || null,
        password: hashedPassword,
        level: level || null,
      },
    });

    res.status(201).json({
      id: user.id,
      _id: user.id,
      username: user.username,
      phone: user.phone,
      email: user.email,
      role: user.role,
      level: user.level,
      profilePicUrl: null,
      backgroundImageUrl: null,
      currentStreak: 0,
      studyTimeDaily: 0,
      canViewAllSecondary: false,
      token: generateToken(user.id),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── LOGIN ───────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier = phone, email, or username
    let user = null;

    if (identifier.startsWith('+')) {
      user = await prisma.user.findUnique({ where: { phone: identifier } });
    } else if (identifier.includes('@')) {
      user = await prisma.user.findUnique({ where: { email: identifier } });
    } else {
      user = await prisma.user.findUnique({ where: { username: identifier } });
    }

    if (!user) return res.status(404).json({ message: 'Account not found. Please register.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Incorrect password' });

    res.json({
      id: user.id,
      _id: user.id,
      username: user.username,
      phone: user.phone,
      email: user.email,
      role: user.role,
      level: user.level,
      profilePicUrl: user.profilePicUrl,
      backgroundImageUrl: user.backgroundImageUrl,
      currentStreak: user.currentStreak,
      studyTimeDaily: user.studyTimeDaily,
      canViewAllSecondary: user.canViewAllSecondary,
      token: generateToken(user.id),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── VALIDATE USERNAME ───────────────────────────────────────────────────────
const validateUsername = async (req, res) => {
  try {
    const { username } = req.body;
    const user = await prisma.user.findUnique({ where: { username } });
    res.json({ available: !user, message: user ? 'Username taken' : 'Username available' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── GET ME ──────────────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, username: true, phone: true, email: true, role: true, level: true, points: true, createdAt: true, profilePicUrl: true, backgroundImageUrl: true, currentStreak: true, studyTimeDaily: true, canViewAllSecondary: true },
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── GET ALL USERS (Admin) ────────────────────────────────────────────────────
const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, phone: true, email: true, role: true, level: true, points: true, createdAt: true, profilePicUrl: true, backgroundImageUrl: true, currentStreak: true, studyTimeDaily: true, canViewAllSecondary: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── DELETE USER (Admin) ─────────────────────────────────────────────────────
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userToDel = await prisma.user.findUnique({ where: { id: Number(id) } });
    if (!userToDel) return res.status(404).json({ message: 'User not found' });
    if (userToDel.role === 'ADMIN') return res.status(403).json({ message: 'Cannot delete admin account' });
    await prisma.user.delete({ where: { id: Number(id) } });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── FORGOT PASSWORD (Send OTP via SMS) ──────────────────────────────────────
const forgotPassword = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: 'Phone number is required' });

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) return res.status(404).json({ message: 'No account found with this phone number' });

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    otpStore[phone] = { code, expiresAt };

    // ── Send real SMS via Africa's Talking ────────────────────────────────
    try {
      await sms.send({
        to: [phone],
        message: `Your StudyBuddy AI password reset OTP is: ${code}. It expires in 10 minutes. Do not share this code.`,
        from: 'StudyBuddy',
      });
      console.log(`✅ SMS OTP sent to ${phone}`);
    } catch (smsErr) {
      // If SMS fails (e.g. sandbox / no credits), fall back to console log
      console.warn(`⚠️  SMS send failed, OTP for ${phone}: ${code}`);
    }

    res.json({ message: `OTP sent to ${phone}` });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── VERIFY OTP + RESET PASSWORD ─────────────────────────────────────────────
const verifyOtpAndReset = async (req, res) => {
  try {
    const { phone, otp, newPassword } = req.body;

    const record = otpStore[phone];
    if (!record) return res.status(400).json({ message: 'No OTP request found. Please request one first.' });
    if (new Date() > record.expiresAt) {
      delete otpStore[phone];
      return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
    }
    if (record.code !== otp) return res.status(400).json({ message: 'Incorrect OTP code' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { phone }, data: { password: hashedPassword } });

    delete otpStore[phone];
    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── CHANGE PASSWORD (authenticated) ────────────────────────────────────────
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Both current and new password are required' });
    }
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(401).json({ message: 'Current password is incorrect' });
    const pwError = validatePassword(newPassword);
    if (pwError) return res.status(400).json({ message: pwError });
    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── UPDATE PROFILE (authenticated) ──────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const { username, email, level, canViewAllSecondary, currentStreak, studyTimeDaily } = req.body;
    const data = {};
    if (username) {
      const existing = await prisma.user.findUnique({ where: { username } });
      if (existing && existing.id !== req.user.id) {
        return res.status(400).json({ message: 'Username already taken' });
      }
      data.username = username;
    }
    if (email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing && existing.id !== req.user.id) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      data.email = email;
    }
    if (level !== undefined) data.level = level;
    if (canViewAllSecondary !== undefined) data.canViewAllSecondary = String(canViewAllSecondary) === 'true';
    if (currentStreak !== undefined) data.currentStreak = Number(currentStreak);
    if (studyTimeDaily !== undefined) data.studyTimeDaily = Number(studyTimeDaily);

    if (req.files) {
      if (req.files.profilePic && req.files.profilePic.length > 0) {
        data.profilePicUrl = `/uploads/${req.files.profilePic[0].filename}`;
      }
      if (req.files.backgroundPic && req.files.backgroundPic.length > 0) {
        data.backgroundImageUrl = `/uploads/${req.files.backgroundPic[0].filename}`;
      }
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: { id: true, username: true, phone: true, email: true, role: true, level: true, points: true, profilePicUrl: true, backgroundImageUrl: true, currentStreak: true, studyTimeDaily: true, canViewAllSecondary: true },
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { register, login, validateUsername, getMe, getAllUsers, deleteUser, forgotPassword, verifyOtpAndReset, changePassword, updateProfile };
