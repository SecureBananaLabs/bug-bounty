export function validateEnv(customEnv = process.env) {
  const nodeEnv = customEnv.NODE_ENV ?? "development";
  const port = Number(customEnv.PORT ?? 4000);
  const jwtSecret = customEnv.JWT_SECRET;

  if (nodeEnv === "production") {
    if (!jwtSecret || jwtSecret === "development-secret" || jwtSecret.length < 32) {
      throw new Error("JWT_SECRET must be explicitly set with at least 32 characters in production");
    }
  }

  return {
    nodeEnv,
    port: isNaN(port) || port <= 0 || port > 65535 ? 4000 : port,
    jwtSecret: jwtSecret ?? "development-secret",
    stripeSecretKey: customEnv.STRIPE_SECRET_KEY ?? "",
    databaseUrl: customEnv.DATABASE_URL ?? ""
  };
}

export const env = validateEnv();
