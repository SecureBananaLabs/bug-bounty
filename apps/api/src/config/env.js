function parsePort(val) {
  const p = Number(val);
  if (isNaN(p) || !Number.isInteger(p) || p < 0 || p > 65535) {
    return 4000;
  }
  return p;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parsePort(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? "development-secret",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};
