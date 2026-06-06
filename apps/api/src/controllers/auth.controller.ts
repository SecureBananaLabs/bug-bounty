import { Request, (Response } from 'express';

// Mocking what the controller might look like based on the issue description
// The actual fix would prevent admin role in the registration flow

export const register = async (req: Request, res: Response) => {
  try {
    // Remove any admin role assignment from request body
    const { email, password, role, ...otherData } = req.body;
    
    // Prevent admin role self-assignment
    if (role === 'admin') {
      // Either remove the role or throw an error
      delete req.body.role;
    }
    
    // Continue with normal registration flow...
  } catch (error) {
    // error handling
  }
};