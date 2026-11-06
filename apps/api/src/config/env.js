function requiredInProduction(name, fallback) {
  const value = process.env[name];
  if (value) {
    return value;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(name + " is required in production");
  }

  return fallback;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: requiredInProduction("JWT_SECRET", "development-secret"),
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};
