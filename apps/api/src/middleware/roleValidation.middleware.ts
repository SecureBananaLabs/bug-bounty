import { NextFunction, Request, Response } from 'express';

export const preventRoleElevation = (req: Request, res: Response, next: NextFunction) => {
  if (req.body.roles && Array.isArray(req.body.roles)) {
    // Prevent self-assignment of admin role
    const sanitizedRoles = req.body.roles.filter((role: string) => 
      role.toLowerCase() !== 'admin' && role.toLowerCase() !== 'administrator'
    );
    
    // Ensure basic user role
    if (sanitizedRoles.length === 0) {
      sanitizedRoles.push('USER');
    }
    
    req.body.roles = sanitizedRoles;
  }
  next();
};