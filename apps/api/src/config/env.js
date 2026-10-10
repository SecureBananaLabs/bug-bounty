const nodeEnv = process.env.NODE_ENV ?? "development";
const rawJwtSecret = process.env.JWT_SECRET;
const hasJwtSecret = typeof rawJwtSecret === "string" && rawJwtSecret.trim() !== "";

function resolveJwtSecret() {
  if (nodeEnv === "production") {
    if (!hasJwtSecret) {
      throw new Error("JWT_SECRET is required in production");
    }
    return rawJwtSecret;
  }

  return hasJwtSecret ? rawJwtSecret : "development-secret";
}

export const env = {
  nodeEnv,
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: resolveJwtSecret(),
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};
