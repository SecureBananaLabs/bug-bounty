export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: (() => {
    if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
    if ((process.env.NODE_ENV ?? "development") === "development") {
      return "development-secret";
    }
    throw new Error("JWT_SECRET environment variable is required");
  })(),
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};
