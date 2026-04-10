const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getNotes = async (req, res) => {
  try {
    const { type, category } = req.query; // 'NOTE' or 'PAST_PAPER'
    
    let whereClause = {};
    if (type) whereClause.type = type;
    if (category && category !== 'All Levels') whereClause.category = category;

    const notes = await prisma.note.findMany({
      where: whereClause,
      include: {
        uploader: { select: { username: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const uploadNote = async (req, res) => {
  try {
    const { title, description, type, category, subject } = req.body;
    
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    // File is saved in uploads/ folder by multer. Build the URL.
    // Express serves this folder natively as static.
    const fileUrl = `/uploads/${req.file.filename}`;

    const newNote = await prisma.note.create({
      data: {
        title,
        description: description || '',
        fileUrl,
        type: type || 'NOTE',
        category: category || 'MSCE',
        subject: subject || 'General',
        uploaderId: req.user.id,
        isPublic: true,
      },
    });

    // ── Broadcast notification to all users ──────────────────────────────
    const uploader = await prisma.user.findUnique({ where: { id: req.user.id }, select: { username: true } });
    const typeLabel = type === 'PAST_PAPER' ? 'Past Paper' : 'Note';
    await prisma.notification.create({
      data: {
        message: `📚 ${uploader.username} uploaded a new ${typeLabel}: "${title}" (${subject} – ${category})`,
        type: 'UPLOAD',
      },
    });

    res.status(201).json(newNote);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getNotes, uploadNote };
