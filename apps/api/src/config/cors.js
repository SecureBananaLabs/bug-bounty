const DEFAULT_DEV_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"];

function parseList(raw) {
  if (!raw) return [];
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function getAllowedOrigins(env = process.env) {
  const configured = parseList(env.CORS_ALLOWED_ORIGINS);
  if (configured.length > 0) return configured;

  // Development and test may keep the local frontend origins working.
  if ((env.NODE_ENV ?? "development") !== "production") {
    return DEFAULT_DEV_ORIGINS;
  }

  // Production must be explicit: an unset allowlist denies every origin.
  return [];
}

export function createCorsOptions(env = process.env) {
  const allowed = getAllowedOrigins(env);
  const allowlist = new Set(allowed);

  return {
    origin(origin, callback) {
      // Non-browser clients (curl, server-to-server) send no Origin header.
      if (!origin) return callback(null, true);
      if (allowlist.has(origin)) return callback(null, true);
      return callback(new Error(`Origin not allowed by CORS policy: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  };
}
