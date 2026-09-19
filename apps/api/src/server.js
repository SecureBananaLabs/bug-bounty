import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { createApp } from "./app.js";

export function setupGracefulShutdown(server, options = {}) {
  const timeoutMs = options.timeoutMs ?? 10000;
  let isShuttingDown = false;

  const handleShutdown = (signal) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log(`Received ${signal}. Gracefully stopping server...`);

    const timer = setTimeout(() => {
      console.error(`Graceful shutdown timed out after ${timeoutMs}ms. Forcing exit.`);
      if (options.onTimeout) options.onTimeout();
      else process.exit(1);
    }, timeoutMs);

    if (timer.unref) timer.unref();

    server.close((error) => {
      clearTimeout(timer);
      if (error) {
        console.error("Error encountered while closing server:", error);
        if (options.onError) options.onError(error);
        else process.exit(1);
      } else {
        console.log("HTTP server stopped cleanly.");
        if (options.onSuccess) options.onSuccess();
        else process.exit(0);
      }
    });
  };

  const sigtermListener = () => handleShutdown("SIGTERM");
  const sigintListener = () => handleShutdown("SIGINT");

  process.on("SIGTERM", sigtermListener);
  process.on("SIGINT", sigintListener);

  return {
    handleShutdown,
    cleanup: () => {
      process.removeListener("SIGTERM", sigtermListener);
      process.removeListener("SIGINT", sigintListener);
    }
  };
}

export async function bootstrap() {
  await connectDb();
  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(`API listening on http://localhost:${env.port}`);
  });
  setupGracefulShutdown(server);
  return server;
}

import { fileURLToPath } from "node:url";

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url).toLowerCase() === process.argv[1].toLowerCase();
if (isDirectRun) {
  bootstrap();
}
