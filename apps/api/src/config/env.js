const isProd = process.env.NODE_ENV === "production";

function req(key, minLength = 0) {
  const v = process.env[key];
  if (!v) throw new Error(`Missing required environment variable: ${key}`);
  if (minLength && v.length < minLength) throw new Error(`${key} must be at least ${minLength} characters`);
  return v;
}

function devOrReq(key, devFallback, minLength = 0) {
  if (isProd) return req(key, minLength);
  const v = process.env[key];
  if (v) {
    if (minLength && v.length < minLength) throw new Error(`${key} must be at least ${minLength} characters`);
    return v;
  }
  console.warn(`[env] ${key} not set — using insecure development fallback. Set ${key} in .env`);
  return devFallback;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: devOrReq("JWT_SECRET", "dev-secret-do-not-use-in-production", isProd ? 32 : 0),
  stripeSecretKey: isProd ? req("STRIPE_SECRET_KEY") : (process.env.STRIPE_SECRET_KEY ?? ""),
  databaseUrl: isProd ? req("DATABASE_URL") : (process.env.DATABASE_URL ?? "")
};
