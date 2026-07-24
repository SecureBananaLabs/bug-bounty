import { Request, Response } from 'express';
import { registerUser } from '../services/auth.service';

export const register = async (req: Request, res: Response) => {
  try {
    // Remove admin role from request body if present to prevent self-assignment
    if (req.body.roles && Array.isArray(req.body.roles)) {
      const sanitizedRoles = req.body.roles.filter((role: string) => 
        role.toLowerCase() !== 'admin'
      );
      req.body.roles = sanitizedRoles;
    }
    
    const user = await registerUser(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};