function parsePort(raw) {
  if (raw === undefined || raw === "") return 4000;
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(
      `Invalid PORT value: "${raw}". Must be an integer between 1 and 65535.`
    );
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
