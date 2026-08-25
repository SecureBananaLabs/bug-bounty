const redis = require('../config/redis');

class TokenBlacklistService {
  constructor() {
    this.prefix = 'token:blacklist:';
  }

  /**
   * Revoke a token by storing it in Redis with TTL until expiration
   * @param {string} token - The JWT token to revoke
   * @param {number} expiresAt - Unix timestamp (seconds) when the token expires
   * @returns {Promise<void>}
   */
  async revokeToken(token, expiresAt) {
    const key = `${this.prefix}${token}`;
    const ttl = expiresAt - Math.floor(Date.now() / 1000);
    
    if (ttl > 0) {
      await redis.set(key, 'revoked', 'EX', ttl);
    }
  }

  /**
   * Check if a token has been revoked
   * @param {string} token - The JWT token to check
   * @returns {Promise<boolean>} - True if token is revoked, false otherwise
   */
  async isTokenRevoked(token) {
    const key = `${this.prefix}${token}`;
    const result = await redis.get(key);
    return result === 'revoked';
  }
}

module.exports = new TokenBlacklistService();
