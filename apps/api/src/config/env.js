function resolveJwtSecret(nodeEnv, jwtSecret) {
  if (jwtSecret) {
    return jwtSecret;
  }

  if (nodeEnv === "development") {
    return "development-secret";
  }

  throw new Error("JWT_SECRET must be set outside development");
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: resolveJwtSecret(
    process.env.NODE_ENV ?? "development",
    process.env.JWT_SECRET
  ),
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};
