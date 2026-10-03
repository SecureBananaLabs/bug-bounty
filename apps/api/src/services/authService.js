<content>
const scrypt = require('scryptsy');
const jwt = require('jsonwebtoken');
const { users } = require('../models');
const { JWT_SECRET } = require('../config');

async function loginUser(email, password) {
  // Find user by email
  const user = await users.findByEmail(email);
  if (!user) {
    throw new Error('Unauthorized');
  }

  // Verify password against stored hash
  const isValidPassword = scrypt.verify(password, user.passwordHash);
  if (!isValidPassword) {
    throw new Error('Unauthorized');
  }

  // Sign JWT with user's actual subject and role
  const token = jwt.sign(
    { sub: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: '15m' }
  );

  return token;
}

module.exports = {
  loginUser,
};
</content>