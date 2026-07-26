import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { createApp } from "./app.js";

const SHUTDOWN_TIMEOUT = 10000; // 10 seconds

async function bootstrap() {
  await connectDb();
  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(`API listening on http://localhost:${env.port}`);
  });

  // Graceful shutdown handler
  const shutdown = async (signal) => {
    console.log(`\nReceived ${signal}. Starting graceful shutdown...`);
    
    // Stop accepting new connections
    server.close(() => {
      console.log("Server stopped accepting new connections.");
    });

    // Force exit after timeout
    setTimeout(() => {
      console.error("Forced shutdown after timeout.");
      process.exit(1);
    }, SHUTDOWN_TIMEOUT);

    try {
      // Close DB connection if available
      const { closeDb } = await import("./config/db.js").catch(() => ({ closeDb: null }));
      if (typeof closeDb === "function") {
        await closeDb();
        console.log("Database connection closed.");
      }
      console.log("Graceful shutdown complete.");
      process.exit(0);
    } catch (err) {
      console.error("Error during shutdown:", err);
      process.exit(1);
    }
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

bootstrap();
