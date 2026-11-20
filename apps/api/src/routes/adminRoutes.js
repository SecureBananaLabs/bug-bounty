import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { prisma } from '../config/db.js';

const router = express.Router();

router.patch('/users/:userId/role', authMiddleware, async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;
  const currentUser = req.user;

  // Check if requester is admin
  if (currentUser.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admins only' });
  }

  // Prevent self-assignment
  if (currentUser.id === userId) {
    return res.status(403).json({ error: 'Forbidden: Cannot modify own role' });
  }

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export const adminRoutes = router;
