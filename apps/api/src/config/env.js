try {
  // Automatically load local .env file natively if it exists
  process.loadEnvFile();
} catch (error) {
  // Ignore missing .env file (ENOENT)
  if (error && error.code !== "ENOENT") {
    console.warn("Failed to load .env file:", error.message);
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? "development-secret",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};
