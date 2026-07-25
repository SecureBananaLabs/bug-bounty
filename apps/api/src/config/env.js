let portValue = 4000;
if (process.env.PORT) {
  const parsed = parseInt(process.env.PORT, 10);
  if (!isNaN(parsed) && parsed > 0 && parsed <= 65535) {
    portValue = parsed;
  } else {
    console.warn(`[Config] Invalid PORT env value: "${process.env.PORT}". Falling back to default: 4000`);
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: portValue,
  jwtSecret: process.env.JWT_SECRET ?? "development-secret",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};
