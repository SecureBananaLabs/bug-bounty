export function resolveJwtSecret(nodeEnv, rawSecret) {
  const secret = rawSecret?.trim();

  if (secret) {
    return secret;
  }

  if (nodeEnv === "production") {
    throw new Error("JWT_SECRET is required in production");
  }

  return "development-secret";
}

const nodeEnv = process.env.NODE_ENV ?? "development";

export const env = {
  nodeEnv,
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: resolveJwtSecret(nodeEnv, process.env.JWT_SECRET),
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};
