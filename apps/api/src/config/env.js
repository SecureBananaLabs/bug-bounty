export const env = {
  get nodeEnv() {
    return process.env.NODE_ENV ?? "development";
  },
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? "development-secret",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  get corsOrigins() {
    const raw = process.env.CORS_ORIGINS ?? "";
    return raw
      .split(",")
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0);
  }
};
