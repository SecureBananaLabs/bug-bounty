export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};

// Enforce required secrets in production
const REQUIRED_IN_PRODUCTION = ["JWT_SECRET", "DATABASE_URL"];
if (env.nodeEnv === "production") {
  const missing = REQUIRED_IN_PRODUCTION.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables in production: ${missing.join(", ")}. ` +
      "Set these values before starting the server."
    );
  }
}
