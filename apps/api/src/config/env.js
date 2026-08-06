const _rawPort = process.env.PORT;
const _parsedPort = _rawPort !== undefined ? parseInt(_rawPort, 10) : NaN;
const _resolvedPort = (_rawPort === undefined || isNaN(_parsedPort) || _parsedPort < 0 || _parsedPort > 65535) ? 4000 : _parsedPort;

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: _resolvedPort,
  jwtSecret: process.env.JWT_SECRET ?? "development-secret",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};
