function requireEnv(name, fallback) {
  const val = process.env[name] ?? fallback;
  // In production, secrets must be explicitly provided — never fall back to
  // a hardcoded string. A known fallback (e.g. "development-secret") allows
  // anyone to forge valid JWTs if the env var is accidentally unset.
  if (process.env.NODE_ENV === "production" && !process.env[name]) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  if (name === "JWT_SECRET" && val.length < 32) {
    throw new Error(`JWT_SECRET must be at least 32 characters (got ${val.length})`);
  }
  return val;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: requireEnv("JWT_SECRET", "development-secret-replace-in-prod"),
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};

