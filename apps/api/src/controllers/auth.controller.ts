import { Request, Response } from 'express';
import { UserRole } from '@prisma/client';

class AuthController {
  async register(req: Request, res: Response) {
    try {
      const { name, email, password, role } = req.body;
      
      // Prevent admin role self-assignment vulnerability
      if (role === UserRole.ADMIN) {
        return res.status(403).json({ 
          error: 'Admin role cannot be self-assigned during registration' 
        });
      }

      // Process user registration without admin role validation
      // ... existing registration logic ...
      
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }

  // Additional validation to prevent privilege escalation
  validateRoleAssignment(role: string) {
    // Block any attempt to assign admin role during registration
    if (role === 'ADMIN' || role === 'admin') {
      throw new Error('Admin role cannot be self-assigned during registration');
    }
    return true;
  }
}

export default AuthController;