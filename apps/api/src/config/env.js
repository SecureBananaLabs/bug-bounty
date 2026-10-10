const DEVELOPMENT_JWT_SECRET = "development-secret";

const nodeEnv = (process.env.NODE_ENV ?? "development").trim();
const configuredJwtSecret = process.env.JWT_SECRET?.trim();
const isLocalEnvironment = nodeEnv === "development" || nodeEnv === "test";

if (
  !isLocalEnvironment &&
  (!configuredJwtSecret || configuredJwtSecret === DEVELOPMENT_JWT_SECRET)
) {
  throw new Error(
    "JWT_SECRET must be set to a non-default value outside development and test environments"
  );
}

export const env = {
  nodeEnv,
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: configuredJwtSecret || DEVELOPMENT_JWT_SECRET,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};
