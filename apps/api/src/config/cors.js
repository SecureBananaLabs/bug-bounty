export function createCorsOptions(allowedOrigins = []) {
  const allowed = new Set(allowedOrigins);

  return {
    origin(origin, callback) {
      if (!origin || allowed.size === 0 || allowed.has(origin)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    }
  };
}
