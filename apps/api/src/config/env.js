const nodeEnv = process.env.NODE_ENV ?? "development";
const jwtSecret = process.env.JWT_SECRET || (nodeEnv === "production" ? "" : "development-secret");

if (nodeEnv === "production" && !jwtSecret) {
  throw new Error("JWT_SECRET is required in production");
}

export const env = {
  nodeEnv,
  port: Number(process.env.PORT ?? 4000),
  jwtSecret,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};
