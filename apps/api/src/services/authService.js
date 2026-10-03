<content>
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * Logs in a user by verifying credentials and signing a JWT
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise<string>} - Signed JWT token
 * @throws {Error} - If authentication fails
 */
const loginUser = async (email, password) => {
  // Find user by email
  const user = await User.findOne({ where: { email } });
  
  if (!user) {
    throw new Error('Authentication failed: Invalid credentials');
  }

  // Verify password against stored hash
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  
  if (!isPasswordValid) {
    throw new Error('Authentication failed: Invalid credentials');
  }

  // Sign JWT with user's subject and role
  const token = jwt.sign(
    { sub: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: '15m' }
  );

  return token;
};

module.exports = {
  loginUser,
};
</content>