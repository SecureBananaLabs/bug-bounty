const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = 'test-secret';

// Generate a unique user ID based on timestamp and random string
function generateUserId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 5);
}

// Register a new user: create ID once, hash password, sign JWT with that ID as sub
async function register(userData) {
  // Generate user ID once to ensure consistency between response and token
  const userId = generateUserId();

  // Hash the password (cost factor 10)
  const hashedPassword = await bcrypt.hash(userData.password, 10);

  // Simulate user persistence (in real code this would be a DB call)
  const user = { id: userId, email: userData.email, password: hashedPassword };

  // Sign access token with the same user ID as the JWT subject claim
  const token = jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '1h' });

  // Return the user ID and token; ID used here is the one generated above
  return { id: userId, token };
}

// Simple test to verify that the token's subject matches the returned user ID
(async () => {
  try {
    const result = await register({ email: 'test@example.com', password: 'password123' });
    const decoded = jwt.verify(result.token, JWT_SECRET);
    if (decoded.sub === result.id) {
      console.log('PASS: token sub matches returned id');
    } else {
      console.log('FAIL: token sub does not match returned id');
    }
  } catch (err) {
    console.error('Error during test:', err);
  }
})();