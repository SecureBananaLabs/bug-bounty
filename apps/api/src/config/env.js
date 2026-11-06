export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: (() => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET is required. Set it to a strong random value (min 32 chars).");
    }
    if (secret === "development-secret") {
      throw new Error("JWT_SECRET must not use the default value 'development-secret'. Set a strong random secret.");
    }
    return secret;
  })(),
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};
