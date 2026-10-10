const nodeEnv = process.env.NODE_ENV ?? "development";

function resolveJwtSecret() {
  const jwtSecret = process.env.JWT_SECRET;

  if (typeof jwtSecret === "string" && jwtSecret.trim().length > 0) {
    return jwtSecret;
  }

  if (nodeEnv === "production") {
    throw new Error("JWT_SECRET is required in production");
  }

  return "development-secret";
}

export const env = {
  nodeEnv,
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: resolveJwtSecret(),
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};
