const createError = require('http-errors');

/**
 * Middleware to verify that the authenticated user has an admin role.
 * Must be used after authMiddleware so that req.user is populated.
 */
const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return next(createError(403, 'Forbidden: Admin access required'));
  }
  next();
};

module.exports = adminMiddleware;
