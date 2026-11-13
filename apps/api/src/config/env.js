const nodeEnv = process.env.NODE_ENV ?? "development";

function requireProductionValue(name, value) {
  if (nodeEnv === "production" && !value?.trim()) {
    throw new Error(`${name} is required in production`);
  }

  return value ?? "";
}

export const env = {
  nodeEnv,
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? "development-secret",
  stripeSecretKey: requireProductionValue("STRIPE_SECRET_KEY", process.env.STRIPE_SECRET_KEY),
  databaseUrl: requireProductionValue("DATABASE_URL", process.env.DATABASE_URL)
};
