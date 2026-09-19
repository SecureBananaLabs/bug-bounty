import { connectDb, disconnectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { createApp } from "./app.js";

let server;

export async function bootstrap() {
  await connectDb();
  const app = createApp();
  server = app.listen(env.port, () => {
    console.log(`API listening on http://localhost:${env.port}`);
  });
  return server;
}

export async function shutdown(signal) {
  console.log(`Received ${signal}. Shutting down gracefully...`);

  if (server) {
    await new Promise((resolve) => {
      server.close((err) => {
        if (err) {
          console.error("Error closing HTTP server:", err);
        }
        resolve();
      });
    });
  }

  await disconnectDb();
  console.log("Graceful shutdown completed.");
}

export function registerShutdownHandlers() {
  const handleSignal = async (signal) => {
    await shutdown(signal);
    process.exit(0);
  };

  process.on("SIGTERM", () => handleSignal("SIGTERM"));
  process.on("SIGINT", () => handleSignal("SIGINT"));
}

if (process.env.NODE_ENV !== "test") {
  registerShutdownHandlers();
  bootstrap();
}
