const authMiddleware = require('./auth.middleware');
const adminAuthorizationMiddleware = require('./adminAuth.middleware');

module.exports = {
  authMiddleware,
  adminAuthorizationMiddleware,
};
