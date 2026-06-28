const parseCorsOrigins = (value) => {
  const fallback = ["http://localhost:3000"];
  const raw = (value ?? "").trim();
  if (!raw) {
    return fallback;
  }

  const parsed = raw.split(",").map((origin) => origin.trim()).filter(Boolean);
  return parsed.length > 0 ? parsed : fallback;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? "development-secret",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  corsOrigins: parseCorsOrigins(process.env.CORS_ORIGIN)
};
