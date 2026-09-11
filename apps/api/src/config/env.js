function loadLocalEnvFile() {
  if (typeof process.loadEnvFile !== "function") {
    return;
  }

  try {
    process.loadEnvFile();
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
  }
}

loadLocalEnvFile();

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? "development-secret",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};
