const isProduction = (nodeEnv) => nodeEnv === "production";

const requireInProduction = (key, env) => {
  const value = env[key];
  const nodeEnv = env.NODE_ENV ?? "development";

  if (isProduction(nodeEnv)) {
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new Error(`Missing required production environment variable: ${key}`);
    }
  }

  return value ?? "";
};

export const createEnv = (inputEnv = process.env) => {
  const env = {
    ...inputEnv,
    NODE_ENV: inputEnv.NODE_ENV ?? "development"
  };

  return {
    nodeEnv: env.NODE_ENV,
    port: Number(env.PORT ?? 4000),
    jwtSecret: env.JWT_SECRET ?? "development-secret",
    stripeSecretKey: requireInProduction("STRIPE_SECRET_KEY", env),
    databaseUrl: requireInProduction("DATABASE_URL", env)
  };
};

export const env = createEnv();
