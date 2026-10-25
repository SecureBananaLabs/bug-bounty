const nodeEnv = process.env.NODE_ENV ?? "development";
const isProduction = nodeEnv === "production";

function requireInProd(value, name) {
  if (isProduction && !value) {
    throw new Error(`Missing required production environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv,
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: (() => {
    const secret = process.env.JWT_SECRET ?? "development-secret";
    if (isProduction && secret.length < 32) {
      throw new Error("JWT_SECRET must be at least 32 characters in production");
    }
    if (!isProduction && !process.env.JWT_SECRET) {
      console.warn("[WARN] JWT_SECRET not set; using insecure default. Set JWT_SECRET before production deployment.");
    }
    return secret;
  })(),
  stripeSecretKey: requireInProd(process.env.STRIPE_SECRET_KEY ?? "", "STRIPE_SECRET_KEY"),
  databaseUrl: requireInProd(process.env.DATABASE_URL ?? "", "DATABASE_URL")
};
