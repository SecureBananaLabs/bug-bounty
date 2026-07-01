const nodeEnv = process.env.NODE_ENV ?? "development";

function readJwtSecret() {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }

  if (nodeEnv === "production") {
    throw new Error("JWT_SECRET is required in production");
  }

  return "development-secret";
}

export const env = {
  nodeEnv,
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: readJwtSecret(),
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};
