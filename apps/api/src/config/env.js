const nodeEnv = process.env.NODE_ENV ?? "development";
const jwtSecret = process.env.JWT_SECRET?.trim() ?? "";

if (!jwtSecret && nodeEnv !== "development" && nodeEnv !== "test") {
  throw new Error("JWT_SECRET must be set outside development and test");
}

export const env = {
  nodeEnv,
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: jwtSecret || "development-secret",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};
