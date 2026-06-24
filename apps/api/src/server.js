import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { createApp } from "./app.js";

async function bootstrap() {
  await connectDb();
  const app = createApp();
  app.listen(env.port, () => {
    const addr = app.address();
    const port = typeof addr === "object" && addr ? addr.port : env.port;
    console.log(`API listening on http://localhost:${port}`);
  });
}

bootstrap();
