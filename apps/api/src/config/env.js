export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  corsOrigin: process.env.CORS_ORIGIN ?? "*"
};

// Validate required production secrets
if (!env.jwtSecret) {
  console.warn(
    "[env] JWT_SECRET not set — signing tokens with weak defaults is insecure. " +
    "Set JWT_SECRET in .env or production."
  );
}

if (env.nodeEnv === "production" && !env.jwtSecret) {
  throw new Error(
    "JWT_SECRET is required in production. Set the environment variable."
  );
}

if (env.nodeEnv === "production" && !env.databaseUrl) {
  throw new Error(
    "DATABASE_URL is required in production. Set the environment variable."
  );
}
