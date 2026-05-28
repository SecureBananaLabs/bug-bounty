const nodeEnv = process.env.NODE_ENV ?? "development";
const jwtSecret = process.env.JWT_SECRET ?? "development-secret";

if (nodeEnv === "production" && (!process.env.JWT_SECRET || jwtSecret === "development-secret")) {
  throw new Error("JWT_SECRET must be explicitly provided in production environments and cannot use the development default.");
}

export const env = {
  nodeEnv,
  port: Number(process.env.PORT ?? 4000),
  jwtSecret,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};
