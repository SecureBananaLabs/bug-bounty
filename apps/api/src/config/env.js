const developmentJwtSecret = "development-secret";

function hasSecret(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function loadEnv(source = process.env) {
  const nodeEnv = source.NODE_ENV ?? "development";
  if (nodeEnv === "production" && !hasSecret(source.JWT_SECRET)) {
    throw new Error("JWT_SECRET is required in production");
  }

  return {
    nodeEnv,
    port: Number(source.PORT ?? 4000),
    jwtSecret: hasSecret(source.JWT_SECRET) ? source.JWT_SECRET : developmentJwtSecret,
    stripeSecretKey: source.STRIPE_SECRET_KEY ?? "",
    databaseUrl: source.DATABASE_URL ?? ""
  };
}

export const env = loadEnv();
