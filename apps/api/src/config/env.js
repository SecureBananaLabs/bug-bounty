// Fix #1470: Production guard for JWT_SECRET
// Without this, a predictable default secret allows token forgery in production

const _nodeEnv = process.env.NODE_ENV ?? "development";
const _rawJwtSecret = process.env.JWT_SECRET;

if (_nodeEnv === "production" && (!_rawJwtSecret || _rawJwtSecret === "development-secret")) {
  throw new Error(
    "FATAL: JWT_SECRET must be set to a cryptographically random value in production.\n" +
    "Using the default 'development-secret' allows attackers to forge arbitrary authentication tokens.\n" +
    "Fix: export JWT_SECRET='your-random-secret-here'"
  );
}

if (!_rawJwtSecret) {
  console.warn(
    "[WARN] JWT_SECRET not set — using development default.\n" +
    "This is ONLY safe for local development. NEVER deploy with this default."
  );
}

export const env = {
  nodeEnv: _nodeEnv,
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: _rawJwtSecret ?? "development-secret",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};
