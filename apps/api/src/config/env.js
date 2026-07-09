const nodeEnv = process.env.NODE_ENV ?? "development";
const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";

if (nodeEnv === "production" && !stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY must be set in production");
}

if (nodeEnv === "production" && !databaseUrl) {
  throw new Error("DATABASE_URL must be set in production");
}

export const env = {
  nodeEnv,
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? "development-secret",
  stripeSecretKey,
  databaseUrl
};
