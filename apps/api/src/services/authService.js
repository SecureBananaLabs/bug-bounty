<content>
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * Generates a unique identifier for a user.
 * @returns {string} A unique identifier.
 */
function generateUserId() {
  return crypto.randomUUID();
}

/**
 * Registers a new user.
 * @param {object} userData - The user data.
 * @returns {Promise<object>} The registered user data with an access token.
 */
async function registerUser(userData) {
  // Generate a single user ID to be used for both the user object and the token
  const userId = generateUserId();

  // Create the user object with the generated ID
  const user = {
    id: userId,
    ...userData,
  };

  // Generate JWT with the same ID as the subject
  const accessToken = jwt.sign(
    { sub: userId, iat: Math.floor(Date.now() / 1000) },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  return {
    user,
    accessToken,
  };
}

module.exports = {
  registerUser,
};
</content>