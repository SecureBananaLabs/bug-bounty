function resolveJwtSecret(nodeEnv) {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }

  if (nodeEnv === "production") {
    throw new Error("JWT_SECRET is required when NODE_ENV=production");
  }

  return "development-secret";
}

const nodeEnv = process.env.NODE_ENV ?? "development";

export const env = {
  nodeEnv,
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: resolveJwtSecret(nodeEnv),
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};
