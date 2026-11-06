import express from 'express';
import cors from 'cors';

const app = express();

// Strict CORS Origin Allowlist (Addresses #2782, #743, and #13541)
const rawOrigins = process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:3000,https://securebananalabs.com';
const allowedOrigins = rawOrigins.split(',').map(o => o.trim()).filter(Boolean);

const corsOptions = {
  origin(requestOrigin, callback) {
    // Allow non-browser server-to-server requests in non-production if no Origin header is present
    if (!requestOrigin && process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS origin allowlist'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '100kb' }));

export default app;
