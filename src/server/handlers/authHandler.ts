import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, Role } from '../../models/user';

// Middleware to validate registration role
export const validateRegistrationRole = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { role } = req.body;

  // Only allow 'client' and 'freelancer' roles for public registration
  if (role !== Role.CLIENT && role !== Role.FREELANCER) {
    return res.status(400).json({
      message: 'Registration role must be "client" or "freelancer"',
    });
  }

  next();
};

// Handler for user registration
export const registerUser = async (req: Request, res: Response) => {
  const { email, password, role } = req.body;

  try {
    // Validate role using middleware
    validateRegistrationRole(req, res, async () => {
      // Check if user already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(409).json({ message: 'User with this email already exists' });
      }

      // Create new user with validated role
      const user = await User.create({
        email,
        password,
        role: role || Role.CLIENT, // default to client if not specified
      });

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
      );

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      });
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};