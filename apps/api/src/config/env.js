function req(key, minLength = 0) {
  const v = process.env[key];
  if (!v) throw new Error(`Missing required environment variable: ${key}`);
  if (minLength && v.length < minLength) throw new Error(`${key} must be at least ${minLength} characters`);
  return v;
}
const isProd = process.env.NODE_ENV === "production";
export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: isProd ? req("JWT_SECRET", 32) : (process.env.JWT_SECRET ?? "development-secret-do-not-use-in-prod"),
  stripeSecretKey: isProd ? req("STRIPE_SECRET_KEY") : (process.env.STRIPE_SECRET_KEY ?? ""),
  databaseUrl: isProd ? req("DATABASE_URL") : (process.env.DATABASE_URL ?? "")
};
