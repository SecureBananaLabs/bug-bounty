<content>
const { response } = require('../utils/response');

/**
 * Middleware to ensure the user has an admin role
 * Should be used after authMiddleware which attaches req.user
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return response(res, 401, 'Authentication required');
  }

  if (req.user.role !== 'admin') {
    return response(res, 403, 'Admin access required');
  }

  next();
};

module.exports = requireAdmin;
</content>