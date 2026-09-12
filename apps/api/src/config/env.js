function resolvePort(raw, fallback = 4000) {
  if (raw === undefined || raw === null || raw === "") {
    return fallback;
  }

  const port = Number(raw);
  if (!Number.isFinite(port) || !Number.isInteger(port) || port < 0 || port > 65535) {
    console.warn(`Invalid PORT "${raw}", falling back to ${fallback}`);
    return fallback;
  }

  return port;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: resolvePort(process.env.PORT, 4000),
  jwtSecret: process.env.JWT_SECRET ?? "development-secret",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};
