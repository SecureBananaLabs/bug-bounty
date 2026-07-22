export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: (() => {
    const p = Number(process.env.PORT ?? 4000);
    if (!Number.isFinite(p) || p <= 0) {
      console.warn(`[warn] Invalid PORT "$\{process.env.PORT}", falling back to 4000`);
      return 4000;
    }
    return p;
  })(),
  jwtSecret: process.env.JWT_SECRET ?? "development-secret",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};