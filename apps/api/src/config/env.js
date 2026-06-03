export function parsePort(value = process.env.PORT) {
  if (value === undefined) {
    return 4000;
  }

  const normalized = String(value).trim();
  const port = Number(normalized);

  if (
    normalized.length === 0 ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535
  ) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }

  return port;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parsePort(),
  jwtSecret: process.env.JWT_SECRET ?? "development-secret",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};
