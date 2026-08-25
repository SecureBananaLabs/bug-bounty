/**
 * @file env.js
 * Application environment configuration with production-hardened secret validation.
 */

'use strict';

/**
 * Validates and retrieves the JWT secret according to execution environment.
 * Requires an explicit JWT_SECRET in production; allows default fallback in development/test.
 *
 * @param {string} [nodeEnv=process.env.NODE_ENV]
 * @param {string} [secret=process.env.JWT_SECRET]
 * @returns {string}
 */
export function getJwtSecret(
  nodeEnv = process.env.NODE_ENV ?? 'development',
  secret = process.env.JWT_SECRET
) {
  const isProduction = nodeEnv === 'production';

  if (isProduction) {
    if (!secret || secret.trim() === '' || secret === 'development-secret') {
      throw new Error(
        'FATAL: JWT_SECRET environment variable is required and must be secure in production mode.'
      );
    }
    return secret;
  }

  return secret && secret.trim() !== '' ? secret : 'development-secret';
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: getJwtSecret(),
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? '',
  databaseUrl: process.env.DATABASE_URL ?? '',
};
