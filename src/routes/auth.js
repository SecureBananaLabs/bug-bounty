// fix(auth): prevent admin role self-assignment during registration (#2832)
//
// PROBLEM
// -------
// The registration endpoint trusted the client-supplied `role` field, allowing
// any unauthenticated caller to register an account with `role: "admin"`.
// This is a privilege-escalation vulnerability (mass-assignment / CWE-269).
//
// FIX
// ---
// 1. Never read a privileged `role` from the request body.
// 2. Force every self-service registration to the least-privileged role.
// 3. Only an already-authenticated admin may assign elevated roles, and only
//    through a separate, guarded endpoint.
//
// The snippet below shows the corrected registration handler. It is written to
// be drop-in compatible with the existing route module structure.

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Roles that must NEVER be assignable by an unauthenticated registrant.
const PRIVILEGED_ROLES = new Set(['admin', 'superadmin', 'root', 'owner']);

// The single role every new self-service account receives.
const DEFAULT_ROLE = 'user';

// Allowed roles an *authenticated admin* may assign via the admin endpoint.
const ASSIGNABLE_ROLES = new Set(['user', 'moderator', 'admin']);

/**
 * POST /api/auth/register
 *
 * Public, unauthenticated self-service registration.
 * The caller may NOT influence their own role.
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, username } = req.body || {};

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'A valid email is required.' });
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    // SECURITY: explicitly ignore any client-supplied role / isAdmin / is_admin
    // fields. Mass-assignment of privilege is the vulnerability being fixed.
    if (
      req.body.role !== undefined ||
      req.body.isAdmin !== undefined ||
      req.body.is_admin !== undefined
    ) {
      // Reject outright rather than silently dropping — surfaces probing attempts.
      return res.status(400).json({
        error: 'Role may not be specified during registration.',
      });
    }

    const existing = await db.findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const createdUser = await db.createUser({
      email,
      username: username || null,
      passwordHash,
      // SECURITY: server-assigned least-privilege role. Never trust the client.
      role: DEFAULT_ROLE,
    });

    const token = jwt.sign(
      { sub: String(createdUser.id), role: createdUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.status(201).json({
      user: {
        id: createdUser.id,
        email: createdUser.email,
        username: createdUser.username,
        role: createdUser.role, // always DEFAULT_ROLE at this point
      },
      token,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Registration failed.' });
  }
});

/**
 * PATCH /api/admin/users/:id/role
 *
 * Privileged role assignment. Reachable only by an authenticated admin.
 * This is the ONLY path that may change a user's role.
 */
router.patch(
  '/admin/users/:id/role',
  requireAuth,          // verifies JWT
  requireRole('admin'), // verifies caller.role === 'admin' from the verified token
  async (req, res) => {
    const { role } = req.body || {};

    if (typeof role !== 'string' || !ASSIGNABLE_ROLES.has(role)) {
      return res.status(400).json({ error: 'Invalid role.' });
    }

    const targetId = Number(req.params.id);
    if (!Number.isInteger(targetId) || targetId <= 0) {
      return res.status(400).json({ error: 'Invalid user id.' });
    }

    // SECURITY: an admin may not elevate themselves beyond the assignable set,
    // and may not create a second superuser through this path.
    if (PRIVILEGED_ROLES.has(role) && !ASSIGNABLE_ROLES.has(role)) {
      return res.status(403).json({ error: 'Role not assignable.' });
    }

    const updated = await db.updateUserRole(targetId, role);
    if (!updated) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.json({ id: updated.id, role: updated.role });
  }
);

/**
 * requireAuth — verifies the bearer JWT and attaches the decoded claims.
 * The role used for authorization ALWAYS comes from the signed token, never
 * from the request body.
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

/**
 * requireRole — asserts the verified token carries the required role.
 */
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: 'Insufficient privileges.' });
    }
    return next();
  };
}

module.exports = router;
