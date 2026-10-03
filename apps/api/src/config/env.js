const rawPort = process.env.PORT;
let parsedPort = 4000;
if (rawPort !== undefined && rawPort !== "") {
  const num = Number(rawPort);
  if (!isNaN(num) && Number.isInteger(num) && num > 0 && num <= 65535) {
    parsedPort = num;
  } else {
    console.warn(`Warning: Invalid PORT "${rawPort}" specified. Falling back to default 4000.`);
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parsedPort,
  jwtSecret: process.env.JWT_SECRET ?? "development-secret",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? ""
};
