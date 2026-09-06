const jwtUtils = require('../utils/jwt');

const verifyToken = typeof jwtUtils === 'function' ? jwtUtils : jwtUtils.verifyToken || jwtUtils.verify || jwtUtils.default;

if (typeof verifyToken !== 'function') {
  throw new Error('auth middleware requires a verifyToken function from utils/jwt');
}

const extractBearerToken = (authorizationHeader) => {
  if (!authorizationHeader || typeof authorizationHeader !== 'string') return null;
  const [scheme, ...tokenParts] = authorizationHeader.trim().split(/\s+/);
  if (!scheme || tokenParts.length === 0) return null;
  if (scheme.toLowerCase() !== 'bearer') return null;
  const token = tokenParts.join(' ');
  return token.length > 0 ? token : null;
};

const authMiddleware = async (req, res, next) => {
  try {
    const token = extractBearerToken(req.headers.authorization);
    if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const payload = await verifyToken(token);
    if (!payload) return res.status(401).json({ success: false, message: 'Unauthorized' });
    req.user = payload;
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
};

module.exports = authMiddleware;
module.exports.authMiddleware = authMiddleware;
module.exports.authenticate = authMiddleware;
module.exports.requireAuth = authMiddleware;
module.exports.protect = authMiddleware;
module.exports.extractBearerToken = extractBearerToken;
module.exports.default = authMiddleware;
