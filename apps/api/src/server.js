import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { createApp } from "./app.js";

async function bootstrap() {
  await connectDb();
  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(`API listening on http://localhost:${env.port}`);
  });

  let shuttingDown = false;
  function shutdown() {
    if (shuttingDown) return;
    shuttingDown = true;

    // Stop accepting connections, but let active requests finish first.
    const timeout = setTimeout(() => {
      console.error("Graceful shutdown timed out");
      process.exit(1);
    }, 10_000);
    timeout.unref();

    server.close((error) => {
      clearTimeout(timeout);
      if (error) {
        console.error("Failed to close API server:", error);
        process.exitCode = 1;
      }
    });
  }

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

bootstrap();
