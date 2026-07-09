const path = require('path');

// Helper to clear and reload the config module
function reloadConfig(env, jwtSecret) {
  // Clear all cached modules that might have been loaded
  delete require.cache[require.resolve('../../src/config/env')];
  
  // Set environment variables before requiring
  process.env.NODE_ENV = env;
  if (jwtSecret !== undefined) {
    process.env.JWT_SECRET = jwtSecret;
  } else {
    delete process.env.JWT_SECRET;
  }
  
  return require('../../src/config/env');
}

describe('Config - JWT_SECRET resolution', () => {
  const originalEnv = process.env.NODE_ENV;
  const originalJwtSecret = process.env.JWT_SECRET;

  afterEach(() => {
    // Restore original environment after each test
    process.env.NODE_ENV = originalEnv;
    if (originalJwtSecret !== undefined) {
      process.env.JWT_SECRET = originalJwtSecret;
    } else {
      delete process.env.JWT_SECRET;
    }
  });

  describe('development environment', () => {
    test('should use development-secret fallback when JWT_SECRET is not set', () => {
      const config = reloadConfig('development');
      expect(config.jwtSecret).toBe('development-secret');
    });

    test('should use explicit JWT_SECRET when provided', () => {
      const config = reloadConfig('development', 'my-dev-secret');
      expect(config.jwtSecret).toBe('my-dev-secret');
    });
  });

  describe('test environment', () => {
    test('should use test-secret fallback when JWT_SECRET is not set', () => {
      const config = reloadConfig('test');
      expect(config.jwtSecret).toBe('test-secret');
    });

    test('should use explicit JWT_SECRET when provided', () => {
      const config = reloadConfig('test', 'my-test-secret');
      expect(config.jwtSecret).toBe('my-test-secret');
    });
  });

  describe('production environment', () => {
    test('should throw error when JWT_SECRET is not set', () => {
      expect(() => reloadConfig('production')).toThrow(
        'JWT_SECRET environment variable is required in production mode'
      );
    });

    test('should use explicit JWT_SECRET when provided', () => {
      const config = reloadConfig('production', 'my-prod-secret');
      expect(config.jwtSecret).toBe('my-prod-secret');
    });

    test('should not throw when JWT_SECRET is set to a non-empty string', () => {
      expect(() => reloadConfig('production', 'some-secret')).not.toThrow();
    });
  });
});
