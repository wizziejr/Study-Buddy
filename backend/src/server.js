require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/authRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Static files (for uploaded notes/images)
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notes', require('./routes/noteRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

// Add ping endpoint
app.get('/api/ping', (req, res) => {
  res.json({ message: 'StudyBuddy AI API is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
