function parsePort(raw, defaultPort) {
  // Number("") === 0, Number("abc") === NaN — both cause app.listen() to
  // bind on port 0 (random) or throw, with no useful error message.
  // Fail fast here with a clear diagnostic instead.
  const n = raw !== undefined ? Number(raw) : defaultPort;
  if (!Number.isInteger(n) || n < 1 || n > 65535) {
    throw new Error(
      `Invalid PORT value '${raw}'. Must be an integer between 1 and 65535.`
    );
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

