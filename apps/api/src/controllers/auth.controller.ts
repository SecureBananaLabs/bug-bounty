import { Request, Response } from 'express';
import { User } from '@prisma/client';

// Mock implementation - this would be actual registration controller code
// preventing self-assignment of admin roles
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body;
    
    // Remove or ignore any role assignment attempts for admin roles
    // Only allow user role assignment, prevent elevation to admin
    const userRole = role === 'admin' ? 'user' : role || 'user';
    
    // Registration logic would continue here with proper role validation
  } catch (error) {
    // Error handling
  }
};