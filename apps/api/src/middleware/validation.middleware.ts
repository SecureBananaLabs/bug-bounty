import { Request, Response, NextFunction } from 'express';
import { registerSchema } from '../auth/auth.validation';
import { UserRole } from '@prisma/client';

export const validateRegistration = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role = UserRole.USER } = req.body;
    
    // Prevent admin role self-assignment at validation level
    if (role === UserRole.ADMIN) {
      return res.status(400).json({
        error: "Admin role cannot be self-assigned during registration"
      });
    }
    
    // Validate input data
    const validatedData = registerSchema.parse(req.body);
    req.body = validatedData;
    next();
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};