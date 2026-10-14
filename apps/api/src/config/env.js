/**
 * Parse and validate PORT from environment.
 * Rejects invalid values (non-integer, zero, negative, outside 1..65535).
 * Falls back to 4000 only when PORT is not set.
 */
function parsePort() {
  const raw = process.env.PORT;
  if (raw === undefined || raw === '') {
    return 4000;
  }
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT value "${raw}": must be an integer in 1..65535`);
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
