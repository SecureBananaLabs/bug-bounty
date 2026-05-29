import { Request, Response } from 'express';
import { registerUser } from '../services/auth.service';
import { validateRegistrationInput } from '../utils/validation';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body;
    
    // Remove admin role assignment from user input
    if (role === 'admin' || role === 'ADMIN') {
      return res.status(400).json({ error: 'Admin role cannot be self-assigned' });
    }

    const validatedData = validateRegistrationInput(req.body);
    const result = await registerUser(validatedData);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
};