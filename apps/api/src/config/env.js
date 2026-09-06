const nodeEnv = process.env.NODE_ENV ?? "development";
const configuredJwtSecret = process.env.JWT_SECRET?.trim();

if (nodeEnv === "production" && !configuredJwtSecret) {
  throw new Error("JWT_SECRET must be set in production");
}

export const env = {
  nodeEnv,
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: configuredJwtSecret || "development-secret",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};
