/**
 * In-memory Token Revocation Blacklist with TTL purging
 */
class TokenBlacklistService {
  constructor() {
    /** @type {Map<string, number>} token -> expiry timestamp ms */
    this.revokedTokens = new Map();
  }

  /**
   * Revoke a token until its natural expiration timestamp
   * @param {string} token - Token to invalidate
   * @param {number | Date} [expiresAt] - Expiry timestamp or Date (defaults to 24h)
   */
  revokeToken(token, expiresAt) {
    if (!token || typeof token !== 'string') return;
    
    let expiryMs;
    if (expiresAt instanceof Date) {
      expiryMs = expiresAt.getTime();
    } else if (typeof expiresAt === 'number') {
      expiryMs = expiresAt;
    } else {
      expiryMs = Date.now() + 24 * 60 * 60 * 1000;
    }

    this.revokedTokens.set(token.trim(), expiryMs);
    this.cleanup();
  }

  /**
   * Checks if a token has been revoked and has not yet expired
   * @param {string} token - Token to check
   * @returns {boolean} True if revoked
   */
  isTokenRevoked(token) {
    if (!token || typeof token !== 'string') return false;
    const cleanToken = token.trim();
    const expiryMs = this.revokedTokens.get(cleanToken);

    if (!expiryMs) return false;

    if (Date.now() > expiryMs) {
      this.revokedTokens.delete(cleanToken);
      return false;
    }

    return true;
  }

  /**
   * Purges expired tokens from memory
   */
  cleanup() {
    const now = Date.now();
    for (const [token, expiryMs] of this.revokedTokens.entries()) {
      if (now > expiryMs) {
        this.revokedTokens.delete(token);
      }
    }
  }

  /**
   * Clear all entries (for testing)
   */
  clear() {
    this.revokedTokens.clear();
  }
}

export const tokenBlacklist = new TokenBlacklistService();
