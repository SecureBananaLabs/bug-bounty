const DEFAULT_DEVELOPMENT_JWT_SECRET = "development-secret";

function requireProductionSecret(name, value) {
  if (!value) {
    throw new Error(`${name} must be set in production`);
  }

  return value;
}

export function loadEnv(source = process.env) {
  const nodeEnv = source.NODE_ENV ?? "development";
  const jwtSecret =
    nodeEnv === "production"
      ? requireProductionSecret("JWT_SECRET", source.JWT_SECRET)
      : source.JWT_SECRET ?? DEFAULT_DEVELOPMENT_JWT_SECRET;

  return {
    nodeEnv,
    port: Number(source.PORT ?? 4000),
    jwtSecret,
    stripeSecretKey: source.STRIPE_SECRET_KEY ?? "",
    databaseUrl: source.DATABASE_URL ?? ""
  };
}

export const env = loadEnv();
