export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? "development-secret",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};

export function validateEnv() {
  if (env.nodeEnv === "production") {
    const errors = [];
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET === "development-secret") {
      errors.push("JWT_SECRET must be set to a strong secret in production");
    }
    if (!process.env.DATABASE_URL) {
      errors.push("DATABASE_URL must be set in production");
    }
    if (!process.env.STRIPE_SECRET_KEY) {
      errors.push("STRIPE_SECRET_KEY should be set in production");
    }
    if (errors.length > 0) {
      console.error("FATAL: Invalid environment configuration:");
      errors.forEach(e => console.error("  - " + e));
      process.exit(1);
    }
  }
}
