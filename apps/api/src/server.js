import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { createApp } from "./app.js";
import { installProcessErrorHandlers } from "./utils/processErrorHandlers.js";

async function bootstrap() {
  installProcessErrorHandlers();

  await connectDb();
  const app = createApp();
  app.listen(env.port, () => {
    console.log(`API listening on http://localhost:${env.port}`);
  });
}

bootstrap();
