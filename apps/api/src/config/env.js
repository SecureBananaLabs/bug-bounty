function requireNonBlank(value, name) {
  if (value === undefined || value === null || value.trim() === "") {
    throw new Error(`${name} is required`);
  }
  return value;
}

const nodeEnv = process.env.NODE_ENV ?? "development";
const isProduction = nodeEnv === "production";

const databaseUrl = process.env.DATABASE_URL ?? "";
const stripeSecretKey = process.env.STRIPE_SECRET_KEY ?? "";

if (isProduction) {
  requireNonBlank(databaseUrl, "DATABASE_URL");
  requireNonBlank(stripeSecretKey, "STRIPE_SECRET_KEY");
}

export const env = {
  nodeEnv,
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? "development-secret",
  stripeSecretKey,
  databaseUrl
};
