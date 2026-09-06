export function loadEnv(source = process.env) {
  const nodeEnv = source.NODE_ENV ?? "development";
  const jwtSecret = source.JWT_SECRET ?? (nodeEnv === "development" ? "development-secret" : undefined);
  const requireRuntimeConfig = nodeEnv !== "development";
  const databaseUrl = readEnv(source, "DATABASE_URL", { required: requireRuntimeConfig, fallback: "" });
  const stripeSecretKey = readEnv(source, "STRIPE_SECRET_KEY", { required: requireRuntimeConfig, fallback: "" });

  if (!jwtSecret) {
    throw new Error("JWT_SECRET is required outside development");
  }

  return {
    nodeEnv,
    port: Number(source.PORT ?? 4000),
    jwtSecret,
    stripeSecretKey,
    databaseUrl
  };
}

function readEnv(source, key, { required, fallback }) {
  const value = source[key];

  if (typeof value !== "string") {
    if (required) {
      throw new Error(`${key} is required`);
    }

    return fallback;
  }

  if (value.trim() === "") {
    throw new Error(`${key} is required`);
  }

  return value;
}

export const env = loadEnv();
