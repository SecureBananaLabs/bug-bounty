export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: (() => {
    const raw = process.env.PORT;
    const parsed = Number(raw);
    if (raw && isNaN(parsed)) {
      console.warn(`[config] Invalid PORT="${raw}" — falling back to 4000`);
      return 4000;
    }
    return parsed ?? 4000;
  })(),
  jwtSecret: process.env.JWT_SECRET ?? "development-secret",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};
