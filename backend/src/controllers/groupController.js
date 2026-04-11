const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ── GET ALL GROUPS ──────────────────────────────────────────────────────────
const getGroups = async (req, res) => {
  try {
    const groups = await prisma.group.findMany({
      include: {
        creator: { select: { id: true, username: true } },
        _count: { select: { messages: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ── CREATE GROUP ────────────────────────────────────────────────────────────
const createGroup = async (req, res) => {
  try {
    const { name, description, level } = req.body;
    if (!name || !level) {
      return res.status(400).json({ message: 'Name and level are required' });
    }
    const group = await prisma.group.create({
      data: {
        name,
        description: description || null,
        level,
        creatorId: req.user.id,
      },
      include: {
        creator: { select: { id: true, username: true } },
        _count: { select: { messages: true } },
      },
    });
    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ── DELETE GROUP ────────────────────────────────────────────────────────────
const deleteGroup = async (req, res) => {
  try {
    const group = await prisma.group.findUnique({ where: { id: Number(req.params.id) } });
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (group.creatorId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized to delete this group' });
    }
    // Delete messages first (cascade)
    await prisma.groupMessage.deleteMany({ where: { groupId: group.id } });
    await prisma.group.delete({ where: { id: group.id } });
    res.json({ message: 'Group deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ── GET MESSAGES ────────────────────────────────────────────────────────────
const getMessages = async (req, res) => {
  try {
    const messages = await prisma.groupMessage.findMany({
      where: { groupId: Number(req.params.id) },
      include: { sender: { select: { id: true, username: true } } },
      orderBy: { createdAt: 'asc' },
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ── SEND MESSAGE ────────────────────────────────────────────────────────────
const sendMessage = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: 'Message content required' });
    const message = await prisma.groupMessage.create({
      data: {
        content,
        groupId: Number(req.params.id),
        senderId: req.user.id,
      },
      include: { sender: { select: { id: true, username: true } } },
    });
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getGroups, createGroup, deleteGroup, getMessages, sendMessage };
