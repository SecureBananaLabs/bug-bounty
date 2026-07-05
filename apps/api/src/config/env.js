export const env = (() => {
  const nodeEnv = process.env.NODE_ENV ?? "development";
  const jwtSecret = (() => {
    if (nodeEnv === "production" && (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim() === "")) {
      throw new Error("JWT_SECRET is required in production");
    }
    return process.env.JWT_SECRET ?? "development-secret";
  })();
  return {
    nodeEnv,
    port: Number(process.env.PORT ?? 4000),
    jwtSecret,
    stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
    databaseUrl: process.env.DATABASE_URL ?? ""
  };
})();
