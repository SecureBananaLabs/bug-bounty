export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? "development-secret",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  corsAllowedOrigins: (process.env.ALLOWED_ORIGINS ?? "http://localhost:3000,http://localhost:4000")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean)
};
