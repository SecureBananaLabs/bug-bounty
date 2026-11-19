export const env = {
  port: parseInt(process.env.PORT || "3001"),
  jwtSecret: process.env.JWT_SECRET || (() => { throw new Error("JWT_SECRET environment variable is required"); })(),
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
  databaseUrl: process.env.DATABASE_URL || "file:./dev.db",
};
