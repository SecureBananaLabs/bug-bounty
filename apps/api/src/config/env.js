const jwtSecret = process.env.JWT_SECRET ?? "development-secret";

if (process.env.NODE_ENV === "production" && jwtSecret === "development-secret") {
  throw new Error(
    "JWT_SECRET must be set in production. " +
    "Remove the development fallback by setting the JWT_SECRET environment variable."
  );
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  jwtSecret,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};