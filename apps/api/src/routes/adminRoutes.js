import { Router } from 'express';
import { adminMiddleware } from '../middleware/adminMiddleware.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// Protect all admin routes with auth and admin checks
router.use(authMiddleware);
router.use(adminMiddleware);

router.patch('/users/:id/role', async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  // Block self-assignment of admin role
  if (req.user.id === id && role === 'ADMIN') {
    return res.status(403).json({ error: 'Cannot assign admin role to yourself' });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
    });
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

export const adminRoutes = router;
