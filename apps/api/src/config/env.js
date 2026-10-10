function parsePort(value) {
  if (value === undefined || value === "") {
    return 4000;
  }

  const port = Number(value);
  if (Number.isInteger(port) && port > 0 && port <= 65535) {
    return port;
  }

  console.warn(`Invalid PORT value "${value}", falling back to 4000`);
  return 4000;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parsePort(process.env.PORT),
  jwtSecret: process.env.JWT_SECRET ?? "development-secret",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};
