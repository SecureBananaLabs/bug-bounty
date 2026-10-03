const DEVELOPMENT_JWT_SECRET = "development-secret";
const LOCAL_ENVIRONMENTS = new Set(["development", "test", "local"]);

export function loadEnv(source = process.env) {
  const nodeEnv = source.NODE_ENV ?? "development";
  const configuredJwtSecret = source.JWT_SECRET;
  const hasConfiguredJwtSecret =
    typeof configuredJwtSecret === "string" && configuredJwtSecret.trim().length > 0;
  const isLocalEnvironment = LOCAL_ENVIRONMENTS.has(nodeEnv);

  if (!isLocalEnvironment) {
    if (!hasConfiguredJwtSecret) {
      throw new Error(
        `JWT_SECRET is required when NODE_ENV is "${nodeEnv}". Set a strong, unique secret before starting the API.`
      );
    }

    if (configuredJwtSecret === DEVELOPMENT_JWT_SECRET) {
      throw new Error(
        `JWT_SECRET must not use the development default when NODE_ENV is "${nodeEnv}".`
      );
    }
  }

  return {
    nodeEnv,
    port: Number(source.PORT ?? 4000),
    jwtSecret: hasConfiguredJwtSecret ? configuredJwtSecret : DEVELOPMENT_JWT_SECRET,
    stripeSecretKey: source.STRIPE_SECRET_KEY ?? "",
    databaseUrl: source.DATABASE_URL ?? ""
  };
}

export const env = loadEnv();
