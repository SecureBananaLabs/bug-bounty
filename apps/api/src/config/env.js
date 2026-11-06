const DEFAULT_PORT = 4000;

/**
 * Parse a raw PORT value into a valid TCP port number.
 * Falls back to DEFAULT_PORT when the value is missing or invalid,
 * and logs a warning when an invalid (but present) value is supplied.
 *
 * @param {string|undefined} raw - Raw PORT environment variable.
 * @returns {number} A valid port number in [1, 65535].
 */
function parsePort(raw) {
  if (raw === undefined || raw === null || String(raw).trim() === '') {
    return DEFAULT_PORT;
  }

  const parsed = Number(raw);

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    console.warn(
      `[env] Invalid PORT "${raw}" - falling back to default port ${DEFAULT_PORT}`
    );
    return DEFAULT_PORT;
  }

  return parsed;
}

const MONGO_FALLBACK = 'mongodb://127.0.0.1:27017/bug_bounty';

const mongoUri =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  process.env.DB_URI ||
  process.env.DATABASE_URL ||
  MONGO_FALLBACK;

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parsePort(process.env.PORT),

  // Database
  MONGO_URI: mongoUri,
  MONGODB_URI: mongoUri,
  DB_URI: mongoUri,
  DATABASE_URL: mongoUri,

  // Auth
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',

  // Web client / CORS
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  CORS_ORIGIN:
    process.env.CORS_ORIGIN || process.env.CLIENT_URL || 'http://localhost:3000',

  // Payments
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',

  // Uploads
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
};

module.exports = env;
module.exports.parsePort = parsePort;
module.exports.DEFAULT_PORT = DEFAULT_PORT;
