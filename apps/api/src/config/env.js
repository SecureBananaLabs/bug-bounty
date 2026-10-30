const DEV_SECRET = "development-secret";

const nodeEnv = process.env.NODE_ENV ?? "development";

function resolveJwtSecret() {
  const provided = process.env.JWT_SECRET;

  if (provided && provided.length > 0) {
    return provided;
  }

  // A well-known fallback is only tolerable for local work; anywhere else it
  // lets anyone mint valid tokens.
  if (nodeEnv !== "development" && nodeEnv !== "test") {
    throw new Error("JWT_SECRET must be set outside of development.");
  }

  return DEV_SECRET;
}

export const env = {
  nodeEnv,
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: resolveJwtSecret(),
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};
