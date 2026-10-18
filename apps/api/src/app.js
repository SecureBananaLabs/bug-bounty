'use strict';

const express = require('express');
const cors = require('cors');

const app = express();

/**
 * Parse the CORS allowlist from the environment.
 *
 * CORS_ALLOWED_ORIGINS should be a comma-separated list of trusted origins,
 * e.g. "https://app.example.com,https://admin.example.com".
 *
 * If unset, we fall back to a safe default that only permits same-origin
 * (no cross-origin) requests in production, and localhost origins in
 * non-production environments for developer convenience.
 */
function getAllowedOrigins() {
  const raw = process.env.CORS_ALLOWED_ORIGINS;

  if (raw && raw.trim().length > 0) {
    return raw
      .split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0);
  }

  if (process.env.NODE_ENV === 'production') {
    // No cross-origin access permitted unless explicitly configured.
    return [];
  }

  // Development / test defaults.
  return [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
  ];
}

const allowedOrigins = getAllowedOrigins();

const corsOptions = {
  origin(origin, callback) {
    // Allow requests with no Origin header (e.g. same-origin, curl, server-to-server).
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400,
};

app.use(cors(corsOptions));

// Ensure preflight requests are handled for all routes.
app.options('*', cors(corsOptions));

module.exports = app;
