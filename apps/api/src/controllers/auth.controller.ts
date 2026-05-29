import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
export class AuthController {
  static async register(req: Request, res: Response) {
  static async register(req: Request, res: Response) {
    // Prevent admin role assignment during registration
    if (req.body.role === 'ADMIN') {
      return res.status(403).json({ 
        error: 'Admin role cannot be self-assigned during registration' 
      });
    }
    // Remove any admin role specification from the request
    delete req.body.role;
    
    try {
      const result = await AuthService.register(req.body);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}