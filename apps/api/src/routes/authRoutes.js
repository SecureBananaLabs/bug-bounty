import express from 'express';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../utils/auth.js';

const prisma = new PrismaClient();
const router = express.Router();

router.post('/register', async (req, res) => {
  const { username, email, password, role: requestedRole } = req.body;
  const allowedRoles = ['client', 'freelancer'];
  const userRole = requestedRole || 'client'; // Default to 'client' if not specified

  // Validate role
  if (!allowedRoles.includes(userRole)) {
    return res.status(400).json({ error: 'Invalid role specified. Must be "client" or "freelancer".' });
  }

  try {
    // Check for existing user
    const existingUser = await prisma.user.findFirst({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Create new user with validated role
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: await hashPassword(password),
        role: userRole,
      },
    });

    // Generate JWT token (implementation assumed in existing codebase)
    const token = generateToken(newUser);

    res.status(201).json({
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      },
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Existing login and other auth routes...

export default router;
