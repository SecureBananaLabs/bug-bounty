function requireInProduction(name, fallback = "") {
  const value = process.env[name];
  if ((process.env.NODE_ENV ?? "development") === "production") {
    if (!value?.trim()) {
      throw new Error(`${name} is required in production`);
    }
    return value;
  }

  return value?.trim() ? value : fallback;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: requireInProduction("JWT_SECRET", "development-secret"),
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};
