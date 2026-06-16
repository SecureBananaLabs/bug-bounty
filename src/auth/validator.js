const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class AuthValidator {
  constructor(secretKey) {
    this.secretKey = secretKey;
    this.tokenBlacklist = new Set();
  }

  validateToken(token) {
    if (!token || typeof token !== 'string') {
      throw new Error('Invalid token format');
    }

    // Check if token is blacklisted
    if (this.tokenBlacklist.has(token)) {
      throw new Error('Token has been revoked');
    }

    try {
      // Fixed: Added algorithm specification to prevent algorithm confusion attacks
      const decoded = jwt.verify(token, this.secretKey, { algorithms: ['HS256'] });
      
      // Fixed: Added additional validation for token payload
      if (!decoded.userId || !decoded.exp) {
        throw new Error('Invalid token payload');
      }

      // Fixed: Check if token has expired (redundant but safe)
      const currentTime = Math.floor(Date.now() / 1000);
      if (decoded.exp < currentTime) {
        throw new Error('Token has expired');
      }

      return decoded;
    } catch (error) {
      // Fixed: More specific error handling
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token signature');
      } else if (error.name === 'TokenExpiredError') {
        throw new Error('Token has expired');
      } else {
        throw new Error('Token validation failed');
      }
    }
  }

  generateToken(userId, expiresIn = '24h') {
    if (!userId || typeof userId !== 'string') {
      throw new Error('Invalid user ID');
    }

    const payload = {
      userId: userId,
      iat: Math.floor(Date.now() / 1000),
      // Fixed: Ensure exp is always set
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // Default 24 hours
    };

    // Fixed: Use consistent algorithm
    return jwt.sign(payload, this.secretKey, { algorithm: 'HS256' });
  }

  revokeToken(token) {
    if (!token || typeof token !== 'string') {
      throw new Error('Invalid token');
    }
    this.tokenBlacklist.add(token);
  }

  // Fixed: Added method to clean up expired blacklisted tokens
  cleanupBlacklist() {
    const currentTime = Math.floor(Date.now() / 1000);
    for (const token of this.tokenBlacklist) {
      try {
        const decoded = jwt.decode(token);
        if (decoded && decoded.exp < currentTime) {
          this.tokenBlacklist.delete(token);
        }
      } catch (error) {
        // If token can't be decoded, remove it
        this.tokenBlacklist.delete(token);
      }
    }
  }
}

module.exports = AuthValidator;