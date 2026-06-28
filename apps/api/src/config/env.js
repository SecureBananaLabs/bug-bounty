const nodeEnv = process.env.NODE_ENV ?? "development";
const isProduction = nodeEnv === "production";

function readRequiredProductionEnv(name) {
  const value = process.env[name] ?? "";

  if (isProduction && value.trim() === "") {
    throw new Error(`${name} must be set in production`);
  }

  return value;
}

export const env = {
  nodeEnv,
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? "development-secret",
  stripeSecretKey: readRequiredProductionEnv("STRIPE_SECRET_KEY"),
  databaseUrl: readRequiredProductionEnv("DATABASE_URL")
};
