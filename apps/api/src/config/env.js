export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? "development-secret",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  platformFeePercent: Number(process.env.PLATFORM_FEE_PERCENT ?? 10),
  databaseUrl: process.env.DATABASE_URL ?? ""
};
