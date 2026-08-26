export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? "development-secret",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  // Comma-separated list of origins allowed to call this API cross-origin.
  // Empty by default => all cross-origin requests are denied (production-safe).
  corsOrigins: process.env.CORS_ORIGINS ?? ""
};
