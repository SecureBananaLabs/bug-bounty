const rawPort = Number(process.env.PORT ?? 4000);
if (Number.isNaN(rawPort) || rawPort <= 0 || rawPort > 65535) {
  throw new Error("Invalid PORT environment variable");
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: rawPort,
  jwtSecret: process.env.JWT_SECRET ?? "development-secret",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};
