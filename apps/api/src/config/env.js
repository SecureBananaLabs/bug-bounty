const defaultCorsOrigins = ["http://localhost:3000", "http://127.0.0.1:3000"];

function parseCorsOrigins(value) {
  if (!value) {
    return defaultCorsOrigins;
  }

  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? "development-secret",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  corsOrigins: parseCorsOrigins(process.env.CORS_ORIGINS)
};
