const DEFAULT_JWT_SECRET = "development-secret";

function resolveJwtSecret() {
  const jwtSecret = process.env.JWT_SECRET ?? DEFAULT_JWT_SECRET;

  if (process.env.NODE_ENV === "production" && jwtSecret === DEFAULT_JWT_SECRET) {
    throw new Error("JWT_SECRET must be set in production");
  }

  return jwtSecret;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: resolveJwtSecret(),
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};
