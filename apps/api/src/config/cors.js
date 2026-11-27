const DEFAULT_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];
const DEFAULT_HEADERS = ["Content-Type", "Authorization"];

export function buildCorsOptions(allowedOrigins = [], nodeEnv = "development") {
  const allowlist = allowedOrigins.map((origin) => origin.replace(/\/+$/, ""));
  const allowAnyOrigin = allowlist.length === 0 && nodeEnv !== "production";

  return {
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }
      const normalized = origin.replace(/\/+$/, "");
      if (allowAnyOrigin || allowlist.includes(normalized)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: DEFAULT_METHODS,
    allowedHeaders: DEFAULT_HEADERS,
    maxAge: 600
  };
}
