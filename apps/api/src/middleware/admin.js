export function adminMiddleware(req, res, next) { if (req.user && req.user.role === 'admin') { return next(); } return res.status(403).json({ error: 'Forbidden: Admin access required' }); }
