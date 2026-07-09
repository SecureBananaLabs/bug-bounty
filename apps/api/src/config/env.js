function readOptionalValue(value) {
  return value?.trim() ?? "";
}

export function resolveEnv(source = process.env) {
  const nodeEnv = source.NODE_ENV ?? "development";
  const databaseUrl = readOptionalValue(source.DATABASE_URL);

  if (nodeEnv === "production" && !databaseUrl) {
    throw new Error("DATABASE_URL is required in production");
  }

  return {
    nodeEnv,
    port: Number(source.PORT ?? 4000),
    jwtSecret: source.JWT_SECRET ?? "development-secret",
    stripeSecretKey: source.STRIPE_SECRET_KEY ?? "",
    databaseUrl
  };
}

export const env = resolveEnv();
