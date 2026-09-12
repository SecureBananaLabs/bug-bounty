/**
 * @file adminMiddleware.js
 * Middleware that asserts the authenticated user has the 'admin' role.
 * Must be used after authMiddleware.
 */

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: admin role required',
    });
  }
  return next();
}
