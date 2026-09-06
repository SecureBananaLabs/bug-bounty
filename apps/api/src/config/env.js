const INSECURE_JWT_SECRETS = new Set(["development-secret"]);

function requireJwtSecret() {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret || INSECURE_JWT_SECRETS.has(secret.toLowerCase())) {
    throw new Error(
      "JWT_SECRET environment variable must be set to a non-default value; refusing to start."
    );
  }
  return secret;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: requireJwtSecret(),
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};
