export function parsePort(value, defaultPort = 4000) {
  if (value === undefined || value === null) {
    return defaultPort;
  }

  if (typeof value === "string" && value.trim() === "") {
    return defaultPort;
  }

  const port = Number(value);

  if (!Number.isInteger(port) || port < 0 || port >= 65536) {
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
