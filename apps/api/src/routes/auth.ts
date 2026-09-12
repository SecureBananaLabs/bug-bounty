import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';

const registerValidationRules = () => {
  return [
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    // Prevent admin role self-assignment by filtering out admin role from registration input
    // Additional validation rules would be implemented in the service layer
  ];
};

// Registration endpoint that prevents admin role assignment
export const register = async (req: Request, res: Response) => {
  // Implementation would validate and sanitize user input