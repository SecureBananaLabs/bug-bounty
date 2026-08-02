const nodeEnv = process.env.NODE_ENV ?? "development";
const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  if (nodeEnv === "production") {
    throw new Error("FATAL: JWT_SECRET must be set in production environment. A default development secret MUST NOT be used in production.");
  }
  console.warn("WARNING: JWT_SECRET not set, using development-only default. Do NOT use in production.");
}

export const env = {
  nodeEnv,
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: jwtSecret ?? "dev-secret-do-not-use-in-production",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};
