import crypto from "crypto";

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  // 开发环境自动生成随机 secret，生产环境必须显式设置 JWT_SECRET
  jwtSecret:
    process.env.JWT_SECRET ??
    (process.env.NODE_ENV !== "production"
      ? `dev-secret-${crypto.randomUUID()}`
      : (() => {
          throw new Error(
            "FATAL: JWT_SECRET environment variable is required in production mode. " +
              "Please set JWT_SECRET to a strong random string."
          );
        })()),
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
};
