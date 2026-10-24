const DEVELOPMENT_JWT_SECRET = "development-secret";

export function loadEnv(source = process.env) {
  const nodeEnv = source.NODE_ENV ?? "development";
  const jwtSecret = source.JWT_SECRET?.trim() || DEVELOPMENT_JWT_SECRET;

  if (nodeEnv === "production" && jwtSecret === DEVELOPMENT_JWT_SECRET) {
    throw new Error("JWT_SECRET must be set to a non-development value in production");
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
