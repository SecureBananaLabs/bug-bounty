function getRequiredEnv(key, fallback) {
  const value = process.env[key];
  if (process.env.NODE_ENV === "production" && !value) {
    throw new Error(`Environment variable ${key} is required in production`);
  }
  return value ?? fallback;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: getRequiredEnv("JWT_SECRET", "development-secret"),
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};

