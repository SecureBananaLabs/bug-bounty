const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');

function signAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

async function registerUser(payload) {
  const { email, password, role, name } = payload;

  // Check if user already exists
  const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    const error = new Error('User already exists');
    error.statusCode = 409;
    throw error;
  }

  // Hash password
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Generate user id once
  const userId = `usr_${Date.now()}`;

  // Insert user into database
  const result = await db.query(
    'INSERT INTO users (id, email, password, role, name) VALUES ($1, $2, $3, $4, $5) RETURNING id',
    [userId, email, hashedPassword, role, name]
  );

  const user = result.rows[0];

  // Sign token with the same user id
  const token = signAccessToken({ sub: userId, role: payload.role });

  return {
    id: user.id,
    token,
  };
}

async function loginUser(payload) {
  const { email, password } = payload;

  const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  if (result.rows.length === 0) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const user = result.rows[0];
  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const token = signAccessToken({ sub: user.id, role: user.role });

  return {
    id: user.id,
    token,
  };
}

module.exports = {
  registerUser,
  loginUser,
};
