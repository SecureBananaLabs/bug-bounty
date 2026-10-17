const nodeEnv = process.env.NODE_ENV ?? "development";

function requireProductionEnv(name) {
  const value = process.env[name];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function readRequiredProductionEnv(name) {
  if (nodeEnv === "production") {
    return requireProductionEnv(name);
  }
  return process.env[name] ?? "";
}

export const env = {
  nodeEnv,
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? "development-secret",
  stripeSecretKey: readRequiredProductionEnv("STRIPE_SECRET_KEY"),
  databaseUrl: readRequiredProductionEnv("DATABASE_URL")
};
