const originalEnv = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = { ...originalEnv };
  delete process.env.NODE_ENV;
});

afterAll(() => {
  process.env = originalEnv;
});

describe('env config', () => {
  test('development fallback for jwtSecret when NODE_ENV is not production', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.JWT_SECRET;
    const { jwtSecret } = require('../config/env');
    expect(jwtSecret).toBe('development-secret');
  });

  test('development fallback for refreshSecret when NODE_ENV is not production', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.REFRESH_SECRET;
    const { refreshSecret } = require('../config/env');
    expect(refreshSecret).toBe('development-refresh-secret');
  });

  test('uses configured JWT_SECRET when provided in development', () => {
    process.env.NODE_ENV = 'development';
    process.env.JWT_SECRET = 'custom-dev-secret';
    const { jwtSecret } = require('../config/env');
    expect(jwtSecret).toBe('custom-dev-secret');
  });

  test('uses configured REFRESH_SECRET when provided in development', () => {
    process.env.NODE_ENV = 'development';
    process.env.REFRESH_SECRET = 'custom-refresh-secret';
    const { refreshSecret } = require('../config/env');
    expect(refreshSecret).toBe('custom-refresh-secret');
  });

  test('throws when JWT_SECRET is missing in production', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;
    expect(() => require('../config/env')).toThrow('Missing required environment variable: JWT_SECRET');
  });

  test('throws when REFRESH_SECRET is missing in production', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.REFRESH_SECRET;
    expect(() => require('../config/env')).toThrow('Missing required environment variable: REFRESH_SECRET');
  });

  test('uses configured JWT_SECRET in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'prod-secret';
    const { jwtSecret } = require('../config/env');
    expect(jwtSecret).toBe('prod-secret');
  });

  test('uses configured REFRESH_SECRET in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.REFRESH_SECRET = 'prod-refresh-secret';
    const { refreshSecret } = require('../config/env');
    expect(refreshSecret).toBe('prod-refresh-secret');
  });
});