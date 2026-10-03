// Import dependencies
import { Router } from 'express';
import { registerValidation } from '../validation/auth.validation';
import { hashPassword } from '../utils/auth.utils';
import { prisma } from '../utils/db';
import { User } from '@prisma/client';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Validate input
    const { error } = registerValidation.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Prevent admin role assignment by ensuring new users always get USER role
    const userData = {
      name,
      email,
      password: await hashPassword(password),
      role: 'USER'  // Explicitly set role to USER to prevent privilege escalation
    };

    const newUser = await prisma.user.create({
      data: userData
    });

    res.json({ 
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Additional routes would be here

module.exports = router;