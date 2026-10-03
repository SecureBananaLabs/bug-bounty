<content>
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { usersCollection } from '../db.js';

export const registerUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Validate role is either 'client' or 'freelancer'
    if (!['client', 'freelancer'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Only client or freelancer roles are allowed for self-registration.' });
    }

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    // Create user
    await usersCollection.insertOne({
      id: userId,
      username,
      email,
      password: hashedPassword,
      role,
      createdAt: new Date(),
    });

    // Return success response without sensitive data
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: userId,
        username,
        email,
        role,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};