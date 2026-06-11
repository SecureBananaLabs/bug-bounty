import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { verifyRefreshToken } from '../utils/jwt';

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.body;
      const decoded = verifyRefreshToken(token);
      
      if (!decoded) {
        return res.status(401).json({ message: 'Invalid or expired refresh token' });
      }
      
      const result = await authService.refreshToken(decoded.sub, decoded.role);
      return res.json(result);
    } catch (error) {
      next(error);
    }