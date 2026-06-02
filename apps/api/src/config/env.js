const isProduction = (process.env.NODE_ENV ?? "development") === "production";

if (isProduction && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required in production");
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? "development-secret",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};
