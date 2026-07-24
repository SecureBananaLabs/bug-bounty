import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
export class AuthController {
  static async register(req: Request, res: Response) {
    // Prevent admin role self-assignment during registration
    const { role, ...userData } = req.body;
    if (role === 'ADMIN') {
      return res.status(403).json({ error: 'Admin role cannot be self-assigned during registration' });
    }
    
    try {
      const result = await AuthService.register({ ...userData, role: role || 'USER' });
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });