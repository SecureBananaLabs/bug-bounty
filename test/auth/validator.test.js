const AuthValidator = require('../../src/auth/validator');
const jwt = require('jsonwebtoken');

describe('AuthValidator', () => {
  let validator;
  const secretKey = 'test-secret-key';

  beforeEach(() => {
    validator = new AuthValidator(secretKey);
  });

  describe('validateToken', () => {
    it('should validate a properly signed token', () => {
      const token = validator.generateToken('user123');
      const decoded = validator.validateToken(token);
      expect(decoded.userId).toBe('user123');
    });

    it('should reject invalid token format', () => {
      expect(() => validator.validateToken(null)).toThrow('Invalid token format');
      expect(() => validator.validateToken(123)).toThrow('Invalid token format');
      expect(() => validator.validateToken('')).toThrow('Invalid token format');
    });

    it('should reject blacklisted tokens', () => {
      const token = validator.generateToken('user123');
      validator.revokeToken(token);
      expect(() => validator.validateToken(token)).toThrow('Token has been revoked');
    });

    it('should reject tokens with invalid signature', () => {
      const token = jwt.sign({ userId: 'user123' }, 'wrong-secret', { algorithm: 'HS256' });
      expect(() => validator.validateToken(token)).toThrow('Invalid token signature');
    });

    it('should reject expired tokens', () => {
      const payload = {
        userId: 'user123',
        iat: Math.floor(Date.now() / 1000) - 1000,
        exp: Math.floor(Date.now() / 1000) - 500
      };
      const token = jwt.sign(payload, secretKey, { algorithm: 'HS256' });
      expect(() => validator.validateToken(token)).toThrow('Token has expired');
    });

    it('should reject tokens with missing userId', () => {
      const payload = { exp: Math.floor(Date.now() / 1000) + 1000 };
      const token = jwt.sign(payload, secretKey, { algorithm: 'HS256' });
      expect(() => validator.validateToken(token)).toThrow('Invalid token payload');
    });

    it('should reject tokens with missing exp', () => {
      const payload = { userId: 'user123' };
      const token = jwt.sign(payload, secretKey, { algorithm: 'HS256' });
      expect(() => validator.validateToken(token)).toThrow('Invalid token payload');
    });
  });

  describe('generateToken', () => {
    it('should generate a valid token', () => {
      const token = validator.generateToken('user123');
      expect(typeof token).toBe('string');
      
      const decoded = jwt.verify(token, secretKey);
      expect(decoded.userId).toBe('user123');
      expect(decoded.exp).toBeDefined();
    });

    it('should throw error for invalid user ID', () => {
      expect(() => validator.generateToken(null)).toThrow('Invalid user ID');
      expect(() => validator.generateToken(123)).toThrow('Invalid user ID');
      expect(() => validator.generateToken('')).toThrow('Invalid user ID');
    });
  });

  describe('cleanupBlacklist', () => {
    it('should remove expired tokens from blacklist', () => {
      // Create an expired token
      const payload = {
        userId: 'user123',
        iat: Math.floor(Date.now() / 1000) - 1000,
        exp: Math.floor(Date.now() / 1000) - 500
      };
      const expiredToken = jwt.sign(payload, secretKey, { algorithm: 'HS256' });
      
      // Create a valid token
      const validToken = validator.generateToken('user456');
      
      validator.revokeToken(expiredToken);
      validator.revokeToken(validToken);
      
      expect(validator.tokenBlacklist.size).toBe(2);
      
      validator.cleanupBlacklist();
      
      expect(validator.tokenBlacklist.size).toBe(1);
      expect(validator.tokenBlacklist.has(validToken)).toBe(true);
      expect(validator.tokenBlacklist.has(expiredToken)).toBe(false);
    });
  });
});