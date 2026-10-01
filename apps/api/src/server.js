import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { createApp } from "./app.js";

const SHUTDOWN_TIMEOUT_MS = 30_000;

async function bootstrap() {
  await connectDb();
  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(`API listening on http://localhost:${env.port}`);
  });

  // Graceful shutdown on SIGTERM (deployments, containers) and SIGINT (Ctrl-C)
  const shutdown = (signal) => {
    console.log(`\n${signal} received — shutting down gracefully...`);
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
    // Force-kill after timeout if connections don't drain
    setTimeout(() => {
      console.error('Shutdown timed out — forcing exit.');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap();
