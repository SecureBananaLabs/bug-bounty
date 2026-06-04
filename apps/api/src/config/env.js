/**
 * Parse and validate a TCP port number.
 * Returns a valid integer port in [1, 65535] or throws.
 * @param {string|number} raw - Raw port value
 * @param {number} defaultPort - Fallback when raw is undefined/null
 * @returns {number}
 */
export function parsePort(raw, defaultPort = 4000) {
  if (raw === undefined || raw === null || raw === "") return defaultPort;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > 65535) {
    throw new Error(`Invalid PORT value: "${raw}". Must be an integer between 1 and 65535.`);
  }
  return n;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parsePort(process.env.PORT, 4000),
  jwtSecret: process.env.JWT_SECRET ?? "development-secret",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};
