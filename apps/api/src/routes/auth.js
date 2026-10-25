'use strict';

/**
 * Auth routes — hardened refresh flow (fixes #2847).
 *
 * The refresh endpoint MUST NOT issue tokens based on unverified input.
 * The subject of any newly minted token is derived ONLY from the verified
 * claims of the presented refresh token, never from the request body.
 */

const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '7d';

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return secret;
}

/**
 * Look up a user by id. Replace with the real data-access layer.
 * Must return null when the user does not exist or is inactive.
 */
async function findActiveUserById(userId) {
  // const user = await db.users.findById(userId);
  // if (!user || user.disabled) return null;
  // return user;
  return { id: userId, disabled: false };
}

function signAccessToken(user) {
  return jwt.sign(
    { sub: String(user.id), type: 'access' },
    getSecret(),
    { expiresIn: ACCESS_TOKEN_TTL }
  );
}

function signRefreshToken(user) {
  return jwt.sign(
    { sub: String(user.id), type: 'refresh' },
    getSecret(),
    { expiresIn: REFRESH_TOKEN_TTL }
  );
}

/**
 * POST /auth/refresh
 * Body: { refreshToken: string }
 *
 * SECURITY: We verify the refresh token signature + expiry, then read the
 * subject from the VERIFIED claims. We never trust body-provided userId.
 */
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body || {};

  if (!refreshToken || typeof refreshToken !== 'string') {
    return res.status(400).json({ error: 'refreshToken is required' });
  }

  let claims;
  try {
    claims = jwt.verify(refreshToken, getSecret());
  } catch (err) {
    // Covers TokenExpiredError, JsonWebTokenError, NotBeforeError.
    // Do not disclose which check failed.
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }

  // Reject tokens that are not explicitly refresh tokens.
  if (claims.type !== 'refresh' || !claims.sub) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }

  // The subject comes ONLY from the verified claims — never from req.body.
  const userId = claims.sub;

  const user = await findActiveUserById(userId);
  if (!user) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }

  // Rotate: issue a brand-new access + refresh pair. The presented refresh
  // token should be invalidated by the caller's rotation store (single-use).
  const accessToken = signAccessToken(user);
  const newRefreshToken = signRefreshToken(user);

  return res.status(200).json({
    accessToken,
    refreshToken: newRefreshToken,
    tokenType: 'Bearer',
    expiresIn: ACCESS_TOKEN_TTL,
  });
});

module.exports = router;
