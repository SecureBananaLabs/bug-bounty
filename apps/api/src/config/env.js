export function parsePort(val) {
  if (val === undefined || val === null || val === '') {
    return 4000;
  }
  const num = Number(val);
  if (!Number.isInteger(num) || num < 1 || num > 65535) {
    throw new Error(`Invalid PORT: "${val}" must be an integer between 1 and 65535.`);
  }
  return num;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parsePort(process.env.PORT),
  jwtSecret: process.env.JWT_SECRET ?? "development-secret",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};
