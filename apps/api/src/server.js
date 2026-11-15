import { createApp } from "./app.js";
import { env } from "./config/env.js";

const app = createApp();
const server = app.listen(env.port, () => {
  console.log(`API server listening on port ${env.port}`);
});

process.on("SIGTERM", () => {
  console.log("Received SIGTERM, shutting down gracefully...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("Received SIGINT, shutting down gracefully...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
