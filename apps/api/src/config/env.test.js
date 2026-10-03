<content>
import { describe, it, expect, beforeAll, afterAll } from 'node:test';
import { env } from './env.js';

// Store original environment variables
const originalEnv = { ...process.env };

describe('Environment Configuration', () => {
  beforeAll(() => {
    // Clean up environment variables before each test
    delete process.env.JWT_SECRET;
    delete process.env.NODE_ENV;
  });

  afterAll(() => {
    // Restore original environment variables
    Object.assign(process.env, originalEnv);
  });

  describe('Development Environment', () => {
    it('should allow default development secret', () => {
      process.env.NODE_ENV = 'development';
      process.env.JWT_SECRET = 'development-secret';
      
      // This should not throw
      expect(() => {
        require('./env.js');
      }).not.toThrow();
    });

    it('should allow custom secret in development', () => {
      process.env.NODE_ENV = 'development';
      process.env.JWT_SECRET = 'custom-dev-secret';
      
      // This should not throw
      expect(() => {
        require('./env.js');
      }).not.toThrow();
    });

    it('should fail with empty JWT_SECRET in development', () => {
      process.env.NODE_ENV = 'development';
      process.env.JWT_SECRET = '';
      
      expect(() => {
        require('./env.js');
      }).toThrow('JWT_SECRET must be a non-empty string');
    });
  });

  describe('Test Environment', () => {
    it('should allow default development secret in test', () => {
      process.env.NODE_ENV = 'test';
      process.env.JWT_SECRET = 'development-secret';
      
      // This should not throw
      expect(() => {
        require('./env.js');
      }).not.toThrow();
    });

    it('should allow custom secret in test', () => {
      process.env.NODE_ENV = 'test';
      process.env.JWT_SECRET = 'custom-test-secret';
      
      // This should not throw
      expect(() => {
        require('./env.js');
      }).not.toThrow();
    });

    it('should fail with empty JWT_SECRET in test', () => {
      process.env.NODE_ENV = 'test';
      process.env.JWT_SECRET = '';
      
      expect(() => {
        require('./env.js');
      }).toThrow('JWT_SECRET must be a non-empty string');
    });
  });

  describe('Production Environment', () => {
    it('should fail with missing JWT_SECRET in production', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.JWT_SECRET;
      
      expect(() => {
        require('./env.js');
      }).toThrow('JWT_SECRET must be a non-empty string');
    });

    it('should fail with empty JWT_SECRET in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = '';
      
      expect(() => {
        require('./env.js');
      }).toThrow('JWT_SECRET must be a non-empty string');
    });

    it('should fail with development secret in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = 'development-secret';
      
      expect(() => {
        require('./env.js');
      }).toThrow('Using the default JWT_SECRET in production is not allowed');
    });

    it('should fail with short JWT_SECRET in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = 'short';
      
      expect(() => {
        require('./env.js');
      }).toThrow('JWT_SECRET must be at least 32 characters long in production');
    });

    it('should allow strong JWT_SECRET in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = 'a-very-strong-and-long-production-jwt-secret-that-is-at-least-32-characters-long';
      
      // This should not throw
      expect(() => {
        require('./env.js');
      }).not.toThrow();
    });
  });
});
</content>