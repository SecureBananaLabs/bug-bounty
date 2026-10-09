const path = require('path');

// Determine environment
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';
const isLocal = NODE_ENV !== 'production' && !process.env.CI;

// Required environment variables
const REQUIRED_VARS = ['DATABASE_URL', 'PORT'];

if (isProduction) {
  REQUIRED_VARS.push('JWT_SECRET');
}

// Check required vars
for (const varName of REQUIRED_VARS) {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
}

// JWT secret validation
const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret || jwtSecret === 'dev-secret') {
  if (!isLocal) {
    throw new Error(
      'JWT_SECRET must be set to a secure, unique value. Using the default "dev-secret" in a non-local environment is not allowed.'
    );
  }
  console.warn(
    'WARNING: JWT_SECRET is using the default dev value. This is fine for local development but must be set in production.'
  );
}

module.exports = {
  NODE_ENV,
  isProduction,
  isLocal,
  databaseUrl: process.env.DATABASE_URL,
  port: parseInt(process.env.PORT, 10) || 3000,
  jwtSecret: jwtSecret,
};
