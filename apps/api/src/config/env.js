export function resolveJwtSecret(nodeEnv, jwtSecret) {
  if (jwtSecret) {
    return jwtSecret;
  }

  if (nodeEnv === "production") {
    throw new Error("JWT_SECRET is required when NODE_ENV=production");
  }

  return "development-secret";
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: resolveJwtSecret(process.env.NODE_ENV ?? "development", process.env.JWT_SECRET),
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};
