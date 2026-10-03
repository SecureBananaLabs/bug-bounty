import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { createApp } from "./app.js";

const SHUTDOWN_TIMEOUT_MS = 10_000;

async function bootstrap() {
  await connectDb();
  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(`API listening on http://localhost:${env.port}`);
  });

  const shutdown = (signal) => {
    console.log(`[shutdown] Received ${signal}, closing HTTP server...`);
    server.close((err) => {
      if (err) {
        console.error("[shutdown] Error during close:", err);
        process.exit(1);
      }
      console.log("[shutdown] HTTP server closed gracefully");
      process.exit(0);
    });
    // Force exit after timeout if connections don't drain
    setTimeout(() => {
      console.warn("[shutdown] Forced exit after timeout");
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

bootstrap();
