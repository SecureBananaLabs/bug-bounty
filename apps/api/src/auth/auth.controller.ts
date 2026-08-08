import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { UserRole } from '@prisma/client';

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const { email, password, role = UserRole.USER } = req.body;
      
      // Prevent admin role self-assignment
      const sanitizedRole = role === UserRole.ADMIN ? UserRole.USER : role;
      
      const user = await AuthService.register({
        ...req.body,
        role: sanitizedRole
      });
      
      res.status(201).json({ user });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}