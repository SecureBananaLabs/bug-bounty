import crypto from "node:crypto";

function resolveJwtSecret() {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "FATAL: JWT_SECRET environment variable is required in production.\n" +
      "Generate a strong random secret, e.g.:\n" +
      "  node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
    );
  }

  const fallback = crypto.randomBytes(32).toString("hex");
  console.warn(
    `WARNING: JWT_SECRET not set — using a randomly generated secret for this session.\n` +
    `Set JWT_SECRET in your environment for consistent tokens across restarts.`
  );
  return fallback;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: resolveJwtSecret(),
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};
