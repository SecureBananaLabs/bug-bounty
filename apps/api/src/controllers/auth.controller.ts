import { Request, Response } from 'express';

export const register = async (req: Request, res: Response) => {
  // Remove any admin role assignments from request body
  if (req.body.roles) {
    if (typeof req.body.roles === 'string' && req.body.roles === 'admin') {
      delete req.body.roles;
    }
    if (Array.isArray(req.body.roles)) {
      req.body.roles = (req.body.roles as string[]).filter(role => role !== 'admin');
    }
  }
  // ... rest of controller implementation
};