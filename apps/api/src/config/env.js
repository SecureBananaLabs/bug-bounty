function parseOriginList(value) {
  return (value ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function getCorsOrigins() {
  return parseOriginList(process.env.CORS_ORIGINS);
}

export function corsOriginResolver(origin, callback) {
  // Same-origin and non-browser requests (curl, server-to-server) send no Origin.
  if (!origin) {
    return callback(null, true);
  }

  const allowlist = getCorsOrigins();
  if (allowlist.includes(origin)) {
    return callback(null, true);
  }

  // With no allowlist configured, keep permissive behaviour only outside
  // production so local development keeps working.
  if (allowlist.length === 0 && process.env.NODE_ENV !== "production") {
    return callback(null, true);
  }

  return callback(null, false);
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? "development-secret",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};
