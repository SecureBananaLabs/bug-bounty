const LOCAL_ENVS = new Set(["development", "dev", "local", "test"]);
const DEV_FALLBACK_SECRET = "development-secret";

// A shared fallback secret is fine on a laptop, but a real deployment must
// state its own secret so signed tokens stay unpredictable.
export function resolveJwtSecret(nodeEnv, rawSecret) {
  const secret = typeof rawSecret === "string" ? rawSecret.trim() : "";

  if (LOCAL_ENVS.has(nodeEnv)) {
    return secret || DEV_FALLBACK_SECRET;
  }

  if (!secret || secret === DEV_FALLBACK_SECRET) {
    throw new Error(
      `JWT_SECRET must be provided explicitly in the "${nodeEnv}" environment`,
    );
  }

  return secret;
}

export function buildEnv(source = process.env) {
  const nodeEnv = source.NODE_ENV ?? "development";

  return {
    nodeEnv,
    port: Number(source.PORT ?? 4000),
    jwtSecret: resolveJwtSecret(nodeEnv, source.JWT_SECRET),
    stripeSecretKey: source.STRIPE_SECRET_KEY ?? "",
    databaseUrl: source.DATABASE_URL ?? "",
  };
}

export const env = buildEnv(process.env);
