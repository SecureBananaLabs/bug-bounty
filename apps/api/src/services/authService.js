const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const env = require('../config/env');

/**
 * Register a new user.
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} role - User role (default: 'freelancer')
 * @returns {Promise<{user: Object, token: string}>} - Created user and JWT
 */
async function registerUser(email, password, role = 'freelancer') {
  // Generate user id once
  const userId = uuidv4();
  const hashedPassword = await bcrypt.hash(password, 10);

  const query = 'INSERT INTO users (id, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, email, role, created_at';
  const values = [userId, email, hashedPassword, role];

  const result = await db.query(query, values);
  const user = result.rows[0];

  // Sign token with the same userId
  const token = jwt.sign(
    { sub: userId, role: user.role },
    env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  return { user, token };
}

/**
 * Authenticate a user with email and password.
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<{user: Object, token: string}>} - Authenticated user and JWT
 */
async function loginUser(email, password) {
  const query = 'SELECT id, email, password, role FROM users WHERE email = $1';
  const result = await db.query(query, [email]);

  if (result.rows.length === 0) {
    throw new Error('Invalid email or password');
  }

  const user = result.rows[0];
  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    throw new Error('Invalid email or password');
  }

  const token = jwt.sign(
    { sub: user.id, role: user.role },
    env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  return { user: { id: user.id, email: user.email, role: user.role }, token };
}

module.exports = { registerUser, loginUser };
