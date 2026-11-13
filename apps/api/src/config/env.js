export function loadEnv(source = process.env) {
  const nodeEnv = source.NODE_ENV ?? "development";
  const jwtSecret = source.JWT_SECRET ?? (nodeEnv === "development" ? "development-secret" : undefined);

  if (!jwtSecret) {
    throw new Error("JWT_SECRET is required outside development");
  }

  return {
    nodeEnv,
    port: Number(source.PORT ?? 4000),
    jwtSecret,
    stripeSecretKey: source.STRIPE_SECRET_KEY ?? "",
    databaseUrl: source.DATABASE_URL ?? ""
  };
}

export const env = loadEnv();