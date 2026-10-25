import { connectDb } from "./config/db.js";
import { env, validateEnv } from "./config/env.js";
import { createApp } from "./app.js";

async function bootstrap() {
  validateEnv();
  await connectDb();
  const app = createApp();
  app.listen(env.port, () => {
    console.log(`API listening on http://localhost:${env.port}`);
  });
}

bootstrap();
