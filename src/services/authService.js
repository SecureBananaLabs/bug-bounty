<content>
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/config');

const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
};

const refreshToken = (verifiedUserPayload) => {
  // Use the verified payload instead of hardcoding
  const { sub, role } = verifiedUserPayload;
  return generateToken({ sub, role });
};

module.exports = {
  login,
  refreshToken,
};

// Assuming login function exists or is defined elsewhere
const login = async (credentials) => {
  // Dummy implementation, replace with actual authentication logic
  const user = { sub: 'usr_dummy', role: 'client' };
  const token = generateToken(user);
  const refresh = generateToken({ sub: user.sub, role: user.role });
  return { token, refreshToken: refresh };
};
</content>