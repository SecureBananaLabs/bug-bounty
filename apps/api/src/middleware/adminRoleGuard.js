<content>
/**
 * Admin Role Guard Middleware
 * 
 * This middleware checks if the authenticated user has the 'admin' role.
 * If the user is not authenticated, the authMiddleware should handle the 401 response.
 * If the user is authenticated but does not have the admin role, returns a 403 Forbidden.
 * If the user is an admin, proceeds to the next middleware/route handler.
 */

const adminRoleGuard = (req, res, next) => {
  // Check if user is authenticated and has admin role
  if (req.user && req.user.role === 'admin') {
    return next();
  }

  // User is authenticated but not an admin
  return res.status(403).json({
    success: false,
    message: 'Access denied. Admin role required.'
  });
};

module.exports = adminRoleGuard;
</content>