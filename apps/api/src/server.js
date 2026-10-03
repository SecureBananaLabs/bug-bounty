import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { createApp } from "./app.js";

async function bootstrap() {
  await connectDb();
  const app = createApp();
  const server = app.listen(env.port, () => {
    const address = server.address();
    const port = typeof address === "object" && address !== null ? address.port : env.port;
    console.log(`API listening on http://localhost:${port}`);
  });
}

bootstrap();
