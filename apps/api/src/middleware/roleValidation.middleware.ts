import { NextFunction, Request, Response } from 'express';

const preventRoleElevation = (req: Request, res: Response, next: NextFunction) => {
  // Prevent users from assigning themselves admin roles during registration
  const requestedRole = req.body?.role?.toUpperCase();
  
  if (requestedRole === 'ADMIN') {
    return res.status(400).json({
      error: 'Forbidden: Admin role cannot be self-assigned during user registration'
    });
  }
  
  next();
};

// For registration endpoint security
export const validateRegistrationRole = (req: Request, res: Response, next: NextFunction) => {
  const { role } = req.body;
  if (role && role.toUpperCase() === 'ADMIN') {
    return res.status(400).json({ error: 'Admin role assignment is forbidden during registration' });
  }
  next();
};

export default preventRoleElevation;