/**
 * fix(auth): bind registerUser access token to the newly created user id
 *
 * Issue #2845 — registerUser access token can reference a different user id.
 *
 * Problem
 * -------
 * The registration handler minted the access token using a user id taken from
 * the request body (or from a stale/shared value) instead of the id of the user
 * that was just persisted. A caller could therefore receive a token whose `sub`
 * claim pointed at a DIFFERENT account, enabling horizontal privilege
 * escalation (act as another user).
 *
 * Fix
 * ---
 * 1. Persist the user first and capture the authoritative `createdUser.id`.
 * 2. Sign the access token with `sub: createdUser.id` ONLY — never trust a
 *    client-supplied id.
 * 3. Reject any request body that attempts to set `id` / `userId` explicitly.
 */

const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();

// In-memory user store (mock backend used by the bug-bounty harness).
const users = new Map();
let nextUserId = 1;

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

router.post('/register', async (req, res) => {
  const body = req.body || {};
  const { username, password } = body;

  if (!isNonEmptyString(username) || !isNonEmptyString(password)) {
    return res.status(400).json({ error: 'username and password are required' });
  }

  // SECURITY: never allow a client to dictate the account identity.
  if ('id' in body || 'userId' in body || 'sub' in body) {
    return res.status(400).json({ error: 'id is server-assigned and cannot be provided' });
  }

  if (users.has(username)) {
    return res.status(409).json({ error: 'username already taken' });
  }

  // 1. Persist first — the store assigns the authoritative id.
  const createdUser = {
    id: nextUserId++,
    username,
    password,
    role: 'user',
    createdAt: new Date().toISOString(),
  };
  users.set(username, createdUser);

  // 2. Sign the token bound to the id of the user we actually created.
  const accessToken = jwt.sign(
    {
      sub: createdUser.id,          // authoritative, server-assigned
      username: createdUser.username,
      role: createdUser.role,
    },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: '1h' }
  );

  // 3. Return the token alongside the canonical user record.
  return res.status(201).json({
    accessToken,
    user: {
      id: createdUser.id,
      username: createdUser.username,
      role: createdUser.role,
    },
  });
});

module.exports = router;
