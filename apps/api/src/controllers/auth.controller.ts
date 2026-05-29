import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { generateToken } from '../utils/jwt';
import { validateRegistrationInput } from '../utils/validation';

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const { name, email, password, role } = req.body;
      // Validate input
      const { error } = validateRegistrationInput(req.body);
      if (error) {
        return res.status(400).json({ message: error.message });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user without admin role
      const userData = {
        name,
        email,
        password: hashedPassword,
        role: role || 'user' // Default to 'user' role, prevent admin assignment
      };

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        res.status(409).json({ message: 'User already exists' });
        return;
      }

      // Prevent self-assignment of admin role during registration
      const userRole = 'user';
      if (role === 'admin') {
        userRole = 'user'; // Ensure role is always 'user' for new registrations
      }

      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: userRole
        });

      // Create token
      const token = generateToken(newUser.id);
      res.status(201).json({ token, user: newUser });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async login(req: Request, res: Response) {
    // ... login logic