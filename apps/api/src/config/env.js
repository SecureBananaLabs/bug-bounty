const nodeEnv = process.env.NODE_ENV ?? "development";

function requireProductionValue(name) {
  const value = process.env[name] ?? "";

  if (nodeEnv === "production" && value.trim() === "") {
    throw new Error(`${name} must be set in production`);
  }

  return value;
}

export const env = {
  nodeEnv,
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? "development-secret",
  stripeSecretKey: requireProductionValue("STRIPE_SECRET_KEY"),
  databaseUrl: requireProductionValue("DATABASE_URL")
};
