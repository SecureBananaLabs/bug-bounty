/**
 * Safely parse a PORT env value.
 * Returns `defaultVal` when the value is missing, NaN, or out of range.
 */
function parsePort(val, defaultVal = 4000) {
  const port = Number(val);
  if (Number.isInteger(port) && port >= 0 && port < 65536) return port;
  return defaultVal;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parsePort(process.env.PORT, 4000),
  jwtSecret: process.env.JWT_SECRET ?? "development-secret",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};
