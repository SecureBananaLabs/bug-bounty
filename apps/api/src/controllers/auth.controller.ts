import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';

class AuthController {
  static async register(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Prevent admin role assignment during registration
    const { roles = [] } = req.body;
    const sanitizedRoles = roles.filter((role: string) => role !== 'admin');
    req.body.roles = sanitizedRoles;
  }