const parsePort = (portStr) => {
  if (portStr === undefined || portStr === null) return 4000;
  const parsed = Number(portStr);
  if (Number.isNaN(parsed)) {
    console.warn(`Warning: Invalid PORT value "${portStr}". Falling back to default port 4000.`);
    return 4000;
  }
  return parsed;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parsePort(process.env.PORT),
  jwtSecret: process.env.JWT_SECRET ?? "development-secret",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};
