export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? "development-secret",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  // Prevent users from self‑assigning the admin role during registration.
  // Defaults to false if the environment variable is not set.
  allowAdminSelfAssign: process.env.ALLOW_ADMIN_SELF_ASSIGNMENT === "true"
};
