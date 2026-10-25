export function getJwtSecret(overrideEnv = process.env) {
  const nodeEnv = overrideEnv.NODE_ENV ?? "development";
  const isProduction = nodeEnv === "production";
  if (isProduction && !overrideEnv.JWT_SECRET) {
    throw new Error("JWT_SECRET is required in production environment");
  }
  return overrideEnv.JWT_SECRET ?? "development-secret";
}

export function createEnvConfig(overrideEnv = process.env) {
  return {
    nodeEnv: overrideEnv.NODE_ENV ?? "development",
    port: Number(overrideEnv.PORT ?? 4000),
    jwtSecret: getJwtSecret(overrideEnv),
    corsOrigin: overrideEnv.CORS_ORIGIN ?? "http://localhost:3000",
    stripeSecretKey: overrideEnv.STRIPE_SECRET_KEY ?? "",
    databaseUrl: overrideEnv.DATABASE_URL ?? ""
  };
}


export const env = createEnvConfig();

