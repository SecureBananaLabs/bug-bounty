function validatePort(value) {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) {
    throw new Error(
      `Invalid PORT value: "${value}". Must be an integer between 1024 and 65535.`
    );
  }
  return port;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: validatePort(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? "development-secret",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
};
