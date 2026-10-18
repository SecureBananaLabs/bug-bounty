function parseNonNegativeNumber(value, fallback) {
  const normalized = value?.trim();
  if (normalized === undefined || normalized === "") {
    return fallback;
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }

  return parsed;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? "development-secret",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  paymentAmountMax: parseNonNegativeNumber(process.env.PAYMENT_AMOUNT_MAX, 1000000)
};
