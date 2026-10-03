export const port = (() => {
  const raw = process.env.PORT;
  if (raw === undefined || raw === "") {
    return 4000;
  }
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error("Invalid PORT value: " + raw);
  }
  return parsed;
})();

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: port,
  jwtSecret: process.env.JWT_SECRET ?? "development-secret",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};
