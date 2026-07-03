function readRequiredSecret(name, fallback = "") {
  const value = process.env[name]?.trim();
  if (value) {
    return value;
  }

  if ((process.env.NODE_ENV ?? "development") === "production") {
    throw new Error(`${name} must be set in production`);
  }

  return fallback;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? "development-secret",
  stripeSecretKey: readRequiredSecret("STRIPE_SECRET_KEY"),
  databaseUrl: readRequiredSecret("DATABASE_URL")
};
