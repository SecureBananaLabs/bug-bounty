/**
 * @file tokenBlacklistService.js
 * In-memory token revocation and blacklist management service with TTL expiration.
 */

'use strict';

// Store revoked tokens with their expiry timestamp: Map<string, number>
const revokedTokens = new Map();

/**
 * Prunes expired tokens from the blacklist store.
 */
function pruneExpiredTokens() {
  const now = Date.now();
  for (const [token, expiry] of revokedTokens.entries()) {
    if (expiry <= now) {
      revokedTokens.delete(token);
    }
  }
}

/**
 * Revokes a token by adding it to the blacklist with an expiration timestamp.
 *
 * @param {string} token - The JWT or session token to revoke.
 * @param {number|Date} [expiresAt] - Epoch timestamp (ms) or Date object when the token naturally expires.
 * @returns {boolean} True if successfully revoked, false otherwise.
 */
export function revokeToken(token, expiresAt) {
  if (!token || typeof token !== 'string' || token.trim() === '') {
    return false;
  }

  const trimmedToken = token.trim();
  let expiryMs;

  if (expiresAt instanceof Date) {
    expiryMs = expiresAt.getTime();
  } else if (typeof expiresAt === 'number' && Number.isFinite(expiresAt)) {
    // If expiresAt is in seconds (standard JWT exp claim), convert to milliseconds
    expiryMs = expiresAt < 10000000000 ? expiresAt * 1000 : expiresAt;
  } else {
    // Default TTL: 24 hours from now
    expiryMs = Date.now() + 24 * 60 * 60 * 1000;
  }

  // If already expired, no need to store
  if (expiryMs <= Date.now()) {
    return false;
  }

  revokedTokens.set(trimmedToken, expiryMs);
  return true;
}

/**
 * Checks whether a token is revoked and active in the blacklist.
 *
 * @param {string} token - The token to verify.
 * @returns {boolean} True if token is revoked, false if valid or not found.
 */
export function isTokenRevoked(token) {
  if (!token || typeof token !== 'string' || token.trim() === '') {
    return false;
  }

  const trimmedToken = token.trim();
  const expiry = revokedTokens.get(trimmedToken);

  if (!expiry) {
    return false;
  }

  // Check if token has expired past its TTL
  if (expiry <= Date.now()) {
    revokedTokens.delete(trimmedToken);
    return false;
  }

  return true;
}

/**
 * Returns the current count of revoked tokens in the store.
 * @returns {number}
 */
export function getBlacklistSize() {
  pruneExpiredTokens();
  return revokedTokens.size;
}

/**
 * Resets the blacklist store (primarily for unit testing).
 */
export function clearBlacklist() {
  revokedTokens.clear();
}
