function requireEnv(key) {
  const val = process.env[key];
  if (!val) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return val;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.NODE_ENV === "production"
    ? requireEnv("JWT_SECRET")
    : (process.env.JWT_SECRET ?? "development-secret"),
  stripeSecretKey: process.env.NODE_ENV === "production"
    ? requireEnv("STRIPE_SECRET_KEY")
    : (process.env.STRIPE_SECRET_KEY ?? ""),
  databaseUrl: process.env.NODE_ENV === "production"
    ? requireEnv("DATABASE_URL")
    : (process.env.DATABASE_URL ?? "")
};
