// fix(#2782): restrict CORS to an explicit origin allowlist
//
// Previously the Express app configured CORS with a permissive, wildcard
// origin (`cors()` with no options, or `origin: true`), which reflects ANY
// requesting origin back in `Access-Control-Allow-Origin`. Combined with
// `credentials: true` this lets arbitrary third-party sites make credentialed
// cross-origin requests and read the responses, effectively defeating the
// same-origin policy for authenticated users.
//
// This change replaces the wildcard with a strict allowlist sourced from the
// CORS_ALLOWED_ORIGINS environment variable (comma separated). Requests from
// origins that are not on the list are rejected without an
// `Access-Control-Allow-Origin` header, so the browser blocks them.

const express = require('express');
const cors = require('cors');

const app = express();

// --- CORS allowlist -------------------------------------------------------
// Configure the set of trusted browser origins. Never fall back to a wildcard
// when credentials are enabled.
const DEFAULT_ALLOWED_ORIGINS = [
  'https://app.freelanceflow.example',
  'https://freelanceflow.example',
];

const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS
  ? process.env.CORS_ALLOWED_ORIGINS.split(',')
  : DEFAULT_ALLOWED_ORIGINS
)
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    // Allow same-origin / server-to-server requests that omit the Origin
    // header (e.g. curl, health checks, native mobile clients).
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Reject the origin. Do NOT throw — throwing would surface a 500 and leak
    // stack traces. Returning false simply omits the CORS headers so the
    // browser enforces the block.
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 600,
};

app.use(cors(corsOptions));

// Explicitly handle preflight so unlisted origins receive a clean 204 with no
// permissive CORS headers rather than falling through to other routes.
app.options('*', cors(corsOptions));

module.exports = { app, allowedOrigins };