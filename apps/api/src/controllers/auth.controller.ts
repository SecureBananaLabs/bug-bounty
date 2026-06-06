import { Request, Response } from 'express';
import { z } from 'zod';

const registerUser = async (req: Request, res: Response) => {
  // Extract user registration data
  const { email, password, role } = req.body;
  
  // Prevent admin role self-assignment
  if (role === 'admin') {
    return res.status(400).json({ 
      error: 'Cannot assign admin role during registration' 
    });
  }

  // ... rest of registration logic
};

export { registerUser };
// Preventing admin role self-assignment in registration
const validateRegistrationInput = (userData: any) => {
  if (userData.role === 'admin') {
    throw new Error('Admin role cannot be self-assigned during registration');
  }
  // Process normal registration
};

// This would be called during user registration to validate and prevent admin role assignment
// ... existing validation logic
import { Router } from 'express';
import { validateRegistrationInput } from '../services/auth.service';

// Additional security middleware to prevent admin role self-assignment
const preventAdminSelfAssignment = (req: any, res: any, next: any) => {
  if (req.body.role === 'admin') {
    return res.status(400).json({ 
      error: 'Cannot assign admin role during registration' 
    });
  }
  next();
};

export { preventAdminSelfAssignment };