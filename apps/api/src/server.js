import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { createApp } from "./app.js";

async function bootstrap() {
  await connectDb();
  const app = createApp();
  const server = app.listen(env.port, () => {
    const actualPort = server.address().port;
    console.log(`API listening on http://localhost:${actualPort}`);
  });
}

bootstrap();
