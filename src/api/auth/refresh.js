const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const sign = promisify(jwt.sign);
const verify = promisify(jwt.verify);
const { REFRESH_SECRET, ACCESS_SECRET } = require('../config');

const refresh = async (req, res) => {
  const { authorization } = req.headers;

  // 1. Require a signed, unexpired bearer token before issuing a replacement token.
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authorization.split(' ')[1];

  try {
    // 2. Reject missing, forged, or expired tokens with HTTP 401.
    const decoded = await verify(token, ACCESS_SECRET);

    // 3. Mint the replacement from the authenticated token's trusted identity fields.
    const newToken = await sign(
      {
        sub: decoded.sub, // Subject (user ID)
        roles: decoded.roles || ['user'],
      },
      ACCESS_SECRET,
      { expiresIn: '1h' } // 4. Do not copy old iat/exp claims
    );

    res.json({ token: newToken });
  } catch (err) {
    // Handle specific JWT errors for better feedback if needed
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

module.exports = refresh;