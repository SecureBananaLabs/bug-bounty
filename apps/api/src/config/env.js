export function parsePort(value, defaultPort = 4000) {
  if (value === undefined || value === null || value === "") {
    return defaultPort;
  }
  const parsed = Number(value);
  if (Number.isInteger(parsed) && parsed >= 1 && parsed <= 65535) {
    return parsed;
  }
  return defaultPort;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parsePort(process.env.PORT, 4000),
  jwtSecret: process.env.JWT_SECRET ?? "development-secret",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};
