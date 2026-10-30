export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? "development-secret",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};

// Warn in all environments when using default JWT secret
if (!process.env.JWT_SECRET && env.nodeEnv !== "test") {
  console.warn("WARNING: Using default JWT_SECRET. Set JWT_SECRET environment variable for production security.");
}

// In production, require explicit JWT_SECRET
if (env.nodeEnv === "production" && env.jwtSecret === "development-secret") {
  throw new Error("FATAL: JWT_SECRET must be explicitly configured in production environment.");
}
