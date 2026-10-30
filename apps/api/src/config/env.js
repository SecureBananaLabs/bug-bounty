export function createEnv(source = process.env) {
  const nodeEnv = source.NODE_ENV ?? "development";
  const jwtSecret = source.JWT_SECRET ?? "";

  if (nodeEnv === "production" && !jwtSecret) {
    throw new Error("JWT_SECRET is required in production");
  }

  return {
    nodeEnv,
    port: Number(source.PORT ?? 4000),
    jwtSecret: jwtSecret || "development-secret",
    stripeSecretKey: source.STRIPE_SECRET_KEY ?? "",
    databaseUrl: source.DATABASE_URL ?? ""
  };
}

export const env = createEnv();
