const nodeEnv = process.env.NODE_ENV ?? "development";

function readJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (nodeEnv !== "production") {
    return secret ?? "development-secret";
  }

  if (!secret || secret.trim().length < 32) {
    throw new Error("JWT_SECRET must be set to at least 32 characters in production");
  }

  return secret;
}

export const env = {
  nodeEnv,
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: readJwtSecret(),
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};
