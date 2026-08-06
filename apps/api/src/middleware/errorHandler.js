const env = require('../config/env');

/**
 * Global error handler middleware.
 * In production, logs minimal structured metadata without raw error details.
 * In non-production, logs the full error for debugging.
 */
function errorHandler(err, req, res, next) {
  // Determine environment
  const isProduction = env.NODE_ENV === 'production';

  if (isProduction) {
    // Production: log minimal structured metadata, no raw error object/message/stack
    console.error('Unhandled API error:', {
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: err.statusCode || 500,
      timestamp: new Date().toISOString(),
    });
  } else {
    // Non-production: preserve raw error logging for debugging
    console.error('Unhandled API error:', err);
  }

  // Always return a generic 500 response
  res.status(err.statusCode || 500).json({
    error: 'Internal Server Error',
  });
}

module.exports = errorHandler;
