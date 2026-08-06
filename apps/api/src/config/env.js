export function parsePort(value, fallback = 4000) {
  const port = Number(value ?? fallback);

  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    return fallback;
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
