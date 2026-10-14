export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? "development-secret",
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};
