export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: (() => {
    const secret = process.env.JWT_SECRET;
    const isProd = process.env.NODE_ENV === "production";
    if (!secret) {
      if (isProd) throw new Error("FATAL: JWT_SECRET is required in production");
      return "development-secret";
    }
    if (isProd && secret === "development-secret") {
      throw new Error("FATAL: JWT_SECRET must not be default in production");
    }
    return secret;
  })(),
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};
