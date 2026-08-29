/**
 * @file cors.js
 * Configurable CORS middleware enforcing an explicit origin allowlist.
 */

'use strict';

/**
 * Returns CORS middleware options restricted to the configured origin allowlist.
 *
 * @param {string} [allowedOrigins] - Comma-separated list of allowed origins (from CORS_ORIGIN env).
 * @returns {Object} CORS configuration object.
 */
export function getCorsOptions(allowedOrigins) {
  const origins = (allowedOrigins || process.env.CORS_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  return {
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., same-origin, curl, server-to-server)
      if (!origin) {
        return callback(null, true);
      }
      if (origins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  };
}
