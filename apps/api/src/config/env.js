const nodeEnv = process.env.NODE_ENV ?? "development";

const rawPort = process.env.PORT;
let port = 4000;
if (rawPort !== undefined) {
  const parsed = Number(rawPort);
  if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 65535) {
    port = parsed;
  } else {
    console.warn(`Invalid PORT "${rawPort}" — falling back to ${port}`);
  }
}

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret === "development-secret") {
  if (nodeEnv === "production") {
    throw new Error(
      "FATAL: JWT_SECRET is not set or is using the default value. " +
      "In production, you MUST set a strong, unique JWT_SECRET environment variable."
    );
  }
  console.warn(
    "WARNING: Using default JWT_SECRET — this is insecure. " +
    "Set JWT_SECRET environment variable for production use."
  );
}

export const env = {
  nodeEnv,
  port,
  jwtSecret: jwtSecret || "development-secret",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};
