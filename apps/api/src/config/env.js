function requireEnv(key, opts = {}) {
  const value = process.env[key];
  if (!value) {
    const label = opts.label ?? key;
    if (opts.allowMissing) return "";
    throw new Error(
      `FATAL: Missing required environment variable: ${label}. ` +
      `Set ${key} in your environment or .env file before starting the server.`
    );
  }
  if (opts.minLength && value.length < opts.minLength) {
    throw new Error(
      `FATAL: Environment variable ${label} must be at least ${opts.minLength} characters long. ` +
      `Current length: ${value.length}.`
    );
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: requireEnv("JWT_SECRET", { label: "JWT_SECRET", minLength: 32 }),
  stripeSecretKey: requireEnv("STRIPE_SECRET_KEY", { allowMissing: true }),
  databaseUrl: requireEnv("DATABASE_URL", { label: "DATABASE_URL" })
};
