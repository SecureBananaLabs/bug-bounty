export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? "development-secret",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  allowedOrigins: process.env.ALLOWED_ORIGINS ?? ""
};

// Validate critical secrets in production
if (env.nodeEnv === "production") {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be set to at least 32 characters in production");
  }
} else if (!process.env.JWT_SECRET) {
  console.warn("[warn] JWT_SECRET not set — using insecure development default");
}
