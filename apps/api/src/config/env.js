function requireEnv(name, { optional = false } = {}) {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    if (optional) return "";
    throw new Error(
      `Missing required environment variable: ${name}. ` +
      `Set ${name} in your .env file or environment.`
    );
  }
  return value.trim();
}

const isProduction = (process.env.NODE_ENV ?? "development") === "production";

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: requireEnv("JWT_SECRET", { optional: !isProduction }),
  stripeSecretKey: requireEnv("STRIPE_SECRET_KEY", { optional: !isProduction }),
  databaseUrl: requireEnv("DATABASE_URL", { optional: !isProduction })
};
