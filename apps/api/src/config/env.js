export function parsePort(value, defaultValue) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 65535) {
    return defaultValue;
  }
  return parsed;
}

function requireEnv(name, fallback, isProduction) {
  const value = process.env[name];
  if (!value) {
    if (isProduction) {
      throw new Error(`${name} environment variable is required in production`);
    }
    return fallback;
  }
  return value;
}

const isProduction = (process.env.NODE_ENV ?? "development") === "production";

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parsePort(process.env.PORT, 4000),
  jwtSecret: requireEnv("JWT_SECRET", "development-secret", isProduction),
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};
