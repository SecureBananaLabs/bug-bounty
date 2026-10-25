import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { prisma } from '@freelanceflow/db';

const router = Router();

// PUT /api/users/profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, role, bio, skills } = req.body;

    // Prevent user from upgrading own role to admin
    if (role === 'admin') {
      return res.status(403).json({ error: 'Admin role cannot be self-assigned' });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (role !== undefined) updateData.role = role;
    if (bio !== undefined) updateData.bio = bio;
    if (skills !== undefined) updateData.skills = skills;

    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: updateData,
    });

    res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: 'Profile update failed' });
  }
});

// GET /api/users/profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

export { router as userRoutes };