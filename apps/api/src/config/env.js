const DEFAULT_PORT = 4000;

/**
 * Safely parses the PORT environment variable, falling back to 4000 and logging
 * a warning if the configured value is non-numeric or outside valid TCP port bounds (1-65535).
 *
 * @param {string | number | undefined} rawPort
 * @param {number} [defaultPort=4000]
 * @returns {number}
 */
export function parsePort(rawPort, defaultPort = DEFAULT_PORT) {
  if (rawPort === undefined || rawPort === null || String(rawPort).trim() === "") {
    return defaultPort;
  }

  const parsed = Number(String(rawPort).trim());
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    console.warn(
      `[config] Invalid PORT "${rawPort}" supplied; falling back to default port ${defaultPort}.`
    );
    return defaultPort;
  }

  return parsed;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parsePort(process.env.PORT, DEFAULT_PORT),
  jwtSecret: process.env.JWT_SECRET ?? "development-secret",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};
