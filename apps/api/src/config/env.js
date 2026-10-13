export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  // SECURITY: require an explicit, strong JWT secret in production. A hardcoded
  // default makes token forgery trivial and breaks the whole auth model.
  jwtSecret:
    process.env.NODE_ENV === "production"
      ? (process.env.JWT_SECRET ?? (() => { throw new Error("JWT_SECRET must be set in production"); })())
      : (process.env.JWT_SECRET ?? "development-secret"),
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};
