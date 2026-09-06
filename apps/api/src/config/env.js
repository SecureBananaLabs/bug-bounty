export function parsePort(rawPort, defaultPort = 4000) {
  if (rawPort === undefined) {
    return defaultPort;
  }

  const value = rawPort.trim();

  if (!/^\d+$/.test(value)) {
    return defaultPort;
  }

  const port = Number(value);
  return Number.isInteger(port) && port >= 0 && port < 65536 ? port : defaultPort;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parsePort(process.env.PORT),
  jwtSecret: process.env.JWT_SECRET ?? "development-secret",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};
