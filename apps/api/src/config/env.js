export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: (() => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      if (process.env.NODE_ENV === "production") {
        throw new Error("JWT_SECRET must be set in production");
      }
      console.warn("WARNING: Using development JWT secret — not safe for production");
      return "development-secret";
    }
    return secret;
  })(),
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};
