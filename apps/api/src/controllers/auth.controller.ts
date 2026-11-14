import { UserRole } from '@prisma/client';
import { Request, Response } from 'express';

// ... existing imports
  async register(req: Request, res: Response) {
    try {
      const { email, password, name, role } = req.body;

      // Prevent self-assignment of privileged roles
      let sanitizedRole = role;
      if (role === UserRole.ADMIN || role === UserRole.MODERATOR) {
        sanitizedRole = UserRole.USER;
      }
      
      const user = await authService.register({
        email,
        password,
        name
      });

      res.status(201).json({ user });