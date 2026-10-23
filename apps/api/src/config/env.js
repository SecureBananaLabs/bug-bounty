const jwtSecretRaw = process.env.JWT_SECRET;
if (process.env.NODE_ENV === "production" && !jwtSecretRaw) {
  throw new Error("JWT_SECRET must be set in production. Refusing to start with a public default.");
}
if (!jwtSecretRaw) {
  console.warn("[WARN] JWT_SECRET not set — using insecure development-secret. Do NOT deploy this.");
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: jwtSecretRaw ?? "development-secret",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};
