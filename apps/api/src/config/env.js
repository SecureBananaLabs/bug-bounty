function parseTrustProxy(value) {
  if (!value) {
    return false;
  }

  const hops = Number(value);
  return Number.isInteger(hops) && hops > 0 ? hops : false;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? "development-secret",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  trustProxy: parseTrustProxy(process.env.TRUST_PROXY_HOPS)
};
