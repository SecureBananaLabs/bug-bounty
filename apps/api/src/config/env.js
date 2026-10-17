export const DEFAULT_PORT = 4000;

/**
 * Turn the raw PORT environment value into a usable TCP port number.
 * Anything that is not a positive integer falls back to the default, so a
 * stray value such as "api" cannot crash startup with NaN.
 */
export function resolvePort(raw) {
  if (raw === undefined || raw === null || raw === "") {
    return DEFAULT_PORT;
  }

  const parsed = Number(raw);

  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
    process.stdout.write(
      `Invalid PORT "${raw}", falling back to ${DEFAULT_PORT}\n`,
    );
    return DEFAULT_PORT;
  }

  return parsed;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: resolvePort(process.env.PORT),
  jwtSecret: process.env.JWT_SECRET ?? "development-secret",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};
