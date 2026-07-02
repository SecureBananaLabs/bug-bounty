export function requireSecretInProduction(value, name, nodeEnv) {
  if (value) {
    return value;
  }

  if (nodeEnv === "production") {
    throw new Error(`${name} is required in production`);
  }

  return "development-secret";
}

export function loadEnv(source = process.env) {
  const nodeEnv = source.NODE_ENV ?? "development";

  return {
    nodeEnv,
    port: Number(source.PORT ?? 4000),
    jwtSecret: requireSecretInProduction(source.JWT_SECRET, "JWT_SECRET", nodeEnv),
    stripeSecretKey: source.STRIPE_SECRET_KEY ?? "",
    databaseUrl: source.DATABASE_URL ?? ""
  };
}

export const env = loadEnv();
