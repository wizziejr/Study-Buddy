const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ── GET ALL GROUPS ──────────────────────────────────────────────────────────
const getGroups = async (req, res) => {
  try {
    const groups = await prisma.group.findMany({
      include: {
        creator: { select: { id: true, username: true } },
        members: { select: { userId: true, role: true } },
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
        members: {
          create: [{ userId: req.user.id, role: 'ADMIN' }] // Creator is default ADMIN
        }
      },
      include: {
        creator: { select: { id: true, username: true } },
        members: { select: { userId: true, role: true } },
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
    
    const isWebsiteAdmin = req.user.role === 'ADMIN';
    if (group.creatorId !== req.user.id && !isWebsiteAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this group' });
    }
    
    await prisma.group.delete({ where: { id: group.id } });
    res.json({ message: 'Group deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ── UPDATE GROUP SETTINGS ───────────────────────────────────────────────────
const updateGroupSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const { rules, name } = req.body;
    
    const group = await prisma.group.findUnique({ where: { id: Number(id) }, include: { members: true } });
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const isWebsiteAdmin = req.user.role === 'ADMIN';
    const member = group.members.find(m => m.userId === req.user.id);
    const isGroupAdmin = member && member.role === 'ADMIN';

    if (!isGroupAdmin && !isWebsiteAdmin) {
      return res.status(403).json({ message: 'Only admins can edit group settings.' });
    }

    const dataToUpdate = {};
    if (rules !== undefined) dataToUpdate.rules = rules;
    if (name) dataToUpdate.name = name;

    if (req.files) {
      if (req.files.groupIcon && req.files.groupIcon.length > 0) {
        dataToUpdate.iconUrl = `/uploads/${req.files.groupIcon[0].filename}`;
      }
      if (req.files.groupBg && req.files.groupBg.length > 0) {
        dataToUpdate.backgroundImageUrl = `/uploads/${req.files.groupBg[0].filename}`;
      }
    }

    const updatedGroup = await prisma.group.update({
      where: { id: Number(id) },
      data: dataToUpdate,
    });

    res.json(updatedGroup);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ── JOIN GROUP ──────────────────────────────────────────────────────────────
const joinGroup = async (req, res) => {
  try {
    const { id } = req.params; // groupId
    const existingMember = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: Number(id), userId: req.user.id } }
    });
    if (existingMember) return res.status(400).json({ message: 'Already a member' });

    const member = await prisma.groupMember.create({
      data: { groupId: Number(id), userId: req.user.id, role: 'MEMBER' }
    });
    res.status(201).json(member);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ── LEAVE GROUP ─────────────────────────────────────────────────────────────
const leaveGroup = async (req, res) => {
  try {
    const { id } = req.params; // groupId
    const groupMember = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: Number(id), userId: req.user.id } }
    });
    if (!groupMember) return res.status(400).json({ message: 'Not a member of this group' });

    await prisma.groupMember.delete({
       where: { groupId_userId: { groupId: Number(id), userId: req.user.id } }
    });
    res.json({ message: 'Left group successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ── GET MEMBERS ─────────────────────────────────────────────────────────────
const getMembers = async (req, res) => {
  try {
    const { id } = req.params; // groupId
    const members = await prisma.groupMember.findMany({
      where: { groupId: Number(id) },
      include: { user: { select: { id: true, username: true, profilePicUrl: true } } }
    });
    res.json(members);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ── MANAGE MEMBER (KICK / BAN) ──────────────────────────────────────────────
const manageMember = async (req, res) => {
  try {
    const { id, memberId } = req.params;
    const { action } = req.body; // 'KICK' or 'BAN' or 'UNBAN'

    const group = await prisma.group.findUnique({ where: { id: Number(id) }, include: { members: true } });
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const isWebsiteAdmin = req.user.role === 'ADMIN';
    const requester = group.members.find(m => m.userId === req.user.id);
    const isGroupAdmin = requester && requester.role === 'ADMIN';

    if (!isGroupAdmin && !isWebsiteAdmin) {
      return res.status(403).json({ message: 'Only admins can manage members.' });
    }

    if (action === 'KICK') {
      await prisma.groupMember.delete({
        where: { groupId_userId: { groupId: Number(id), userId: Number(memberId) } }
      });
      return res.json({ message: 'Member removed' });
    } else if (action === 'BAN') {
      await prisma.groupMember.update({
        where: { groupId_userId: { groupId: Number(id), userId: Number(memberId) } },
        data: { isBanned: true }
      });
      return res.json({ message: 'Member banned from messaging' });
    } else if (action === 'UNBAN') {
      await prisma.groupMember.update({
        where: { groupId_userId: { groupId: Number(id), userId: Number(memberId) } },
        data: { isBanned: false }
      });
      return res.json({ message: 'Member unbanned' });
    }
    
    res.status(400).json({ message: 'Invalid action' });
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
    const { content, isForwarded } = req.body;
    if (!content) return res.status(400).json({ message: 'Message content required' });

    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: Number(req.params.id), userId: req.user.id } }
    });

    if (!member) return res.status(403).json({ message: 'You are not a member of this group' });
    if (member.isBanned) return res.status(403).json({ message: 'You are banned from sending messages in this group' });

    const message = await prisma.groupMessage.create({
      data: {
        content,
        groupId: Number(req.params.id),
        senderId: req.user.id,
        isForwarded: isForwarded === true
      },
      include: { sender: { select: { id: true, username: true } } },
    });
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ── EDIT MESSAGE ────────────────────────────────────────────────────────────
const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    
    const message = await prisma.groupMessage.findUnique({ where: { id: Number(messageId) } });
    if (!message) return res.status(404).json({ message: 'Message not found' });
    if (message.senderId !== req.user.id) return res.status(403).json({ message: 'You can only edit your own messages' });

    const updated = await prisma.groupMessage.update({
      where: { id: Number(messageId) },
      data: { content, isEdited: true }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ── DELETE MESSAGE ──────────────────────────────────────────────────────────
const deleteMessage = async (req, res) => {
  try {
    const { id, messageId } = req.params;
    
    const message = await prisma.groupMessage.findUnique({ where: { id: Number(messageId) } });
    if (!message) return res.status(404).json({ message: 'Message not found' });

    const group = await prisma.group.findUnique({ where: { id: Number(id) }, include: { members: true } });
    const isWebsiteAdmin = req.user.role === 'ADMIN';
    const requester = group.members.find(m => m.userId === req.user.id);
    const isGroupAdmin = requester && requester.role === 'ADMIN';

    // Sender can delete, Group Admin can delete, Website Admin can delete
    if (message.senderId !== req.user.id && !isGroupAdmin && !isWebsiteAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    await prisma.groupMessage.update({
      where: { id: Number(messageId) },
      data: { content: 'This message was deleted.', isDeleted: true }
    });
    
    res.json({ message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { 
  getGroups, 
  createGroup, 
  deleteGroup, 
  updateGroupSettings,
  joinGroup,
  leaveGroup,
  getMembers,
  manageMember,
  getMessages, 
  sendMessage, 
  editMessage, 
  deleteMessage 
};
