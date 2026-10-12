const DEFAULT_PORT = 4000;

export function parsePort(value) {
  if (value === undefined || value === null || String(value).trim() === "") {
    return DEFAULT_PORT;
  }

  const parsed = Number(String(value).trim());

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    console.warn(
      `PORT "${value}" is not a valid TCP port, falling back to ${DEFAULT_PORT}.`
    );
    return DEFAULT_PORT;
  }

  return parsed;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parsePort(process.env.PORT),
  jwtSecret: process.env.JWT_SECRET ?? "development-secret",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};
