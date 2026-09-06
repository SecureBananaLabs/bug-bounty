export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
const DEFAULT_PORT = 4000;
const rawPort = process.env.PORT;
let PORT = DEFAULT_PORT;

if (rawPort !== undefined) {
  const parsed = Number(rawPort);
  if (!Number.isFinite(parsed) || parsed <= 0 || !Number.isInteger(parsed)) {
    console.warn(`[config] Invalid PORT value "${rawPort}" - falling back to default ${DEFAULT_PORT}`);
  } else {
    PORT = parsed;
  }
}
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};
