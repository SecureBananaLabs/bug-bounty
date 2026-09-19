Full replacement content (the change targets the `jwtSecret` fallback assignment in the exported config object — it is replaced by `resolveJwtSecret()`, which throws at load time when NODE_ENV=production and JWT_SECRET is unset):

/**
 * Centralized environment configuration for the API.
 *
 * JWT_SECRET policy (issue #3582):
 *  - Required when NODE_ENV=production: the process refuses to boot
 *    without it, so a misconfigured deployment can never silently sign
 *    tokens with the well-known development default.
 *  - Falls back to 'development-secret' only in non-production
 *    environments, keeping local development zero-config.
 */

const DEV_FALLBACK_JWT_SECRET = 'development-secret';

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

function resolveJwtSecret() {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }

  if (isProduction) {
    throw new Error(
      'JWT_SECRET is required when NODE_ENV=production. ' +
        'Refusing to start with the insecure development fallback. ' +
        'Set the JWT_SECRET environment variable to a long random value and restart.'
    );
  }

  return DEV_FALLBACK_JWT_SECRET;
}

const env = {
  nodeEnv,
  isProduction,
  isDevelopment: nodeEnv === 'development',
  isTest: nodeEnv === 'test',

  port: Number.parseInt(process.env.PORT || '3001', 10),

  mongoUri:
    process.env.MONGODB_URI ||
    process.env.DATABASE_URL ||
    'mongodb://127.0.0.1:27017/bug_bounty',

  jwtSecret: resolveJwtSecret(),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
};

module.exports = env;
