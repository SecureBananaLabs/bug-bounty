export function parsePort(value, defaultPort = 4000) {
  if (value === undefined) {
    return defaultPort;
  }

  const normalized = String(value).trim();
  if (normalized.length === 0) {
    return defaultPort;
  }

  const port = Number(normalized);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    return defaultPort;
  }

  return port;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parsePort(process.env.PORT),
  jwtSecret: process.env.JWT_SECRET ?? "development-secret",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};
