const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

const getNotes = async (req, res) => {
  try {
    const { type, category, search } = req.query; // 'NOTE' or 'PAST_PAPER'
    
    let whereClause = {};
    if (type) whereClause.type = type;
    if (category && category !== 'All Levels') whereClause.category = category;
    if (search) {
      whereClause.subject = {
        contains: search,
      }; // Case insensitive search not built-in sqlite prisma easily without lowercasing, but contains works on some level, we'll just use contains
    }

    const unassignedFilter = Object.keys(whereClause).length > 0;

    // Apply strict filtering only if no category is rigidly queried, or if security dictates it
    // Wait, the rule says: if you're in primary you MUST view ONLY primary notes.
    const userRole = req.user.role || 'USER';
    const userLevel = req.user.level || '';
    const canViewAllSecondary = req.user.canViewAllSecondary || false;

    if (userRole !== 'ADMIN') {
      const primaryLevels = ['Standard 5', 'Standard 6', 'Standard 7', 'Standard 8'];
      const form12Levels = ['Form 1', 'Form 2'];
      const form34Levels = ['Form 3', 'Form 4'];
      const allSecondary = [...form12Levels, ...form34Levels];

      let allowedCategories = [];

      if (primaryLevels.includes(userLevel)) {
        allowedCategories = primaryLevels;
      } else if (form12Levels.includes(userLevel)) {
        allowedCategories = canViewAllSecondary ? allSecondary : form12Levels;
      } else if (form34Levels.includes(userLevel)) {
        allowedCategories = canViewAllSecondary ? allSecondary : form34Levels;
      }

      if (allowedCategories.length > 0) {
        if (whereClause.category) {
          // If the queried category isn't in their allowed list, they see nothing
          if (!allowedCategories.includes(whereClause.category)) {
            return res.json([]);
          }
        } else {
          whereClause.category = { in: allowedCategories };
        }
      }
    }

    const notes = await prisma.note.findMany({
      where: whereClause,
      include: {
        uploader: { select: { username: true, id: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Fallback for case insensitive subject search in SQLite if raw contains fails case checking
    let finalNotes = notes;
    if (search) {
      finalNotes = notes.filter(n => n.subject.toLowerCase().includes(search.toLowerCase()));
    }

    res.json(finalNotes);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const uploadNote = async (req, res) => {
  try {
    const { title, description, type, category, subject } = req.body;
    
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const fileUrl = `/uploads/${req.file.filename}`;

    const newNote = await prisma.note.create({
      data: {
        title,
        description: description || '',
        fileUrl,
        type: type || 'NOTE',
        category: category || 'Form 4',
        subject: subject || 'General',
        uploaderId: req.user.id,
        isPublic: true,
      },
    });

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

const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;
    const note = await prisma.note.findUnique({ where: { id: parseInt(id) } });
    
    if (!note) return res.status(404).json({ message: 'Note not found' });
    
    if (req.user.role !== 'ADMIN' && note.uploaderId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this file' });
    }

    // Delete the file from filesystem
    if (note.fileUrl) {
      const fileName = path.basename(note.fileUrl);
      const filePath = path.join(__dirname, '..', '..', 'uploads', fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await prisma.note.delete({ where: { id: parseInt(id) } });

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getNotes, uploadNote, deleteNote };
