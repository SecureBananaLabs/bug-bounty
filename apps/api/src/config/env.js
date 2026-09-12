import { randomBytes } from "crypto";

// Resolve the JWT signing secret.
//
// A previous version fell back to the hardcoded string "development-secret".
// Because that value lives in public source, any deployment that forgot to set
// JWT_SECRET silently accepted attacker-forged tokens (auth bypass).
//
// The secure behaviour is fail-closed:
//   - If JWT_SECRET is provided, use it.
//   - In production with no JWT_SECRET, REFUSE TO START (throw).
//   - In dev/test, use an ephemeral random secret so tokens are never signed
//     with a predictable, publicly-known value.
function resolveJwtSecret() {
  const fromEnv = process.env.JWT_SECRET;
  if (fromEnv && fromEnv.length > 0) {
    return fromEnv;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "JWT_SECRET must be set in production; refusing to use an insecure default",
    );
  }
  return randomBytes(32).toString("hex");
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: resolveJwtSecret(),
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};
