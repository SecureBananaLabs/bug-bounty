function req(key) {
  const v = process.env[key];
  if (!v) throw new Error(`Missing required env var: ${key}`);
  return v;
}
const isProd = process.env.NODE_ENV === "production";
export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: isProd ? req("JWT_SECRET") : (process.env.JWT_SECRET ?? "development-secret"),
  stripeSecretKey: isProd ? req("STRIPE_SECRET_KEY") : (process.env.STRIPE_SECRET_KEY ?? ""),
  databaseUrl: isProd ? req("DATABASE_URL") : (process.env.DATABASE_URL ?? "")
};
