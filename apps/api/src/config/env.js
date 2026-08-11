export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: (() => {
    if (!process.env.JWT_SECRET) throw new Error("Missing JWT_SECRET");
    return process.env.JWT_SECRET;
  })(),
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};