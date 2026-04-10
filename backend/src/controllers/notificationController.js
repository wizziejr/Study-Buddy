const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ─── GET NOTIFICATIONS ────────────────────────────────────────────────────────
const getNotifications = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── MARK ALL READ ────────────────────────────────────────────────────────────
const markAllRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({ data: { isRead: true } });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getNotifications, markAllRead };
