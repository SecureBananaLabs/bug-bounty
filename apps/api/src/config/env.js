const isProduction = process.env.NODE_ENV === 'production';

function requireInProduction(name) {
  const value = process.env[name];
  if (isProduction && !value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

module.exports = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  dbUrl: process.env.DATABASE_URL,
  jwtSecret: requireInProduction('JWT_SECRET') ?? 'development-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  refreshSecret: requireInProduction('REFRESH_SECRET') ?? 'development-refresh-secret',
  refreshExpiresIn: process.env.REFRESH_EXPIRES_IN || '7d',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  isProduction,
  requireInProduction,
};