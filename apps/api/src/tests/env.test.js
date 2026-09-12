/**
 * Regression tests for apps/api/src/config/env.js (issue #3582).
 *
 * Covers the three required scenarios:
 *  - development fallback for JWT_SECRET
 *  - production rejection when JWT_SECRET is missing
 *  - explicit JWT_SECRET honored in production
 */

const ENV_PATH = '../config/env';
const DEV_FALLBACK_JWT_SECRET = 'development-secret';

describe('config/env JWT_SECRET handling', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.JWT_SECRET;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  function loadEnv() {
    return require(ENV_PATH);
  }

  it('falls back to the development secret when JWT_SECRET is unset in development', () => {
    process.env.NODE_ENV = 'development';
    expect(loadEnv().jwtSecret).toBe(DEV_FALLBACK_JWT_SECRET);
  });

  it('falls back to the development secret when NODE_ENV is unset entirely', () => {
    delete process.env.NODE_ENV;
    expect(loadEnv().jwtSecret).toBe(DEV_FALLBACK_JWT_SECRET);
  });

  it('throws at load time when NODE_ENV=production and JWT_SECRET is missing', () => {
    process.env.NODE_ENV = 'production';
    expect(loadEnv).toThrow(/JWT_SECRET is required when NODE_ENV=production/);
  });

  it('uses the explicit JWT_SECRET when provided in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'a-strong-production-secret';
    expect(loadEnv().jwtSecret).toBe('a-strong-production-secret');
  });

  it('uses the explicit JWT_SECRET when provided in development', () => {
    process.env.NODE_ENV = 'development';
    process.env.JWT_SECRET = 'local-override';
    expect(loadEnv().jwtSecret).toBe('local-override');
  });
});
