const DEFAULT_DEV_SECRET = "development-secret";

/**
 * Resolves the JWT signing secret from environment variables.
 * Fails fast in production if JWT_SECRET is missing, blank, or uses the insecure default.
 *
 * @param {Record<string, string | undefined>} [envVars=process.env]
 * @returns {string}
 */
export function getJwtSecret(envVars = process.env) {
  const nodeEnv = (envVars.NODE_ENV ?? "development").trim();
  const rawSecret = typeof envVars.JWT_SECRET === "string" ? envVars.JWT_SECRET.trim() : "";

  if (nodeEnv === "production") {
    if (!rawSecret || rawSecret === DEFAULT_DEV_SECRET) {
      throw new Error(
        "CRITICAL: JWT_SECRET environment variable must be explicitly set to a strong secret in production."
      );
    }
    return rawSecret;
  }

  return rawSecret || DEFAULT_DEV_SECRET;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: getJwtSecret(process.env),
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};
