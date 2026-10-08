import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { createApp } from "./app.js";

export const SHUTDOWN_TIMEOUT_MS = 10000;

export function startServer({ port = env.port, onListening } = {}) {
  const app = createApp();
  const server = app.listen(port, onListening);

  return { app, server };
}

export function createShutdownHandler(server, { timeoutMs = SHUTDOWN_TIMEOUT_MS, onClosed } = {}) {
  let closing = false;

  return function shutdown() {
    if (closing) {
      return;
    }

    closing = true;

    server.close((error) => {
      if (onClosed) {
        onClosed(error);
      }
    });

    // Never let a hung keep-alive connection keep the process alive forever.
    const timer = setTimeout(() => {
      server.closeAllConnections();
    }, timeoutMs);

    if (timer.unref) {
      timer.unref();
    }
  };
}

export async function bootstrap() {
  await connectDb();

  const { server } = startServer({
    onListening() {
      console.log(`API listening on http://localhost:${env.port}`);
    }
  });

  const shutdown = createShutdownHandler(server);

  for (const signal of ["SIGTERM", "SIGINT"]) {
    process.on(signal, shutdown);
  }

  return server;
}

bootstrap();
