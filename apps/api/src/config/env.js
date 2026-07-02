const nodeEnv = process.env.NODE_ENV ?? "development";
const databaseUrl = process.env.DATABASE_URL ?? "";
const stripeSecretKey = process.env.STRIPE_SECRET_KEY ?? "";

if (nodeEnv === "production") {
  if (!databaseUrl.trim()) {
    throw new Error("DATABASE_URL is required in production");
  }

  if (!stripeSecretKey.trim()) {
    throw new Error("STRIPE_SECRET_KEY is required in production");
  }
}

export const env = {
  nodeEnv,
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? "development-secret",
  stripeSecretKey,
  databaseUrl
};
