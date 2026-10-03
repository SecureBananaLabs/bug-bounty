function requireInProduction(name, value, nodeEnv) {
  if (nodeEnv === "production" && !value) {
    throw new Error(`${name} is required in production`);
  }

  return value;
}

export function createEnv(source = process.env) {
  const nodeEnv = source.NODE_ENV ?? "development";
  const jwtSecret = requireInProduction("JWT_SECRET", source.JWT_SECRET, nodeEnv);

  return {
    nodeEnv,
    port: Number(source.PORT ?? 4000),
    jwtSecret: jwtSecret ?? "development-secret",
    stripeSecretKey: source.STRIPE_SECRET_KEY ?? "",
    databaseUrl: source.DATABASE_URL ?? ""
  };
}

export const env = createEnv();
