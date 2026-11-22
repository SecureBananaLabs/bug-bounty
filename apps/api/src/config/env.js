function parsePort(val, defaultPort = 4000) {
  if (val === undefined || val === null || val === "") {
    return defaultPort;
  }
  const parsed = Number(val);
  if (Number.isNaN(parsed) || parsed <= 0 || !Number.isInteger(parsed)) {
    console.warn(`Warning: Invalid PORT "${val}", falling back to default ${defaultPort}`);
    return defaultPort;
  }
  return parsed;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parsePort(process.env.PORT, 4000),
  jwtSecret: process.env.JWT_SECRET ?? "development-secret",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};
