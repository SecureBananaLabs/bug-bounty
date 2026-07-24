import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { createApp } from "./app.js";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export async function bootstrap({
  connectDb: connect = connectDb,
  createApp: makeApp = createApp,
  port = env.port
} = {}) {
  await connect();
  const app = makeApp();
  const server = app.listen(port);

  await new Promise((resolveStartup, rejectStartup) => {
    server.once("listening", () => {
      console.log(`API listening on http://localhost:${port}`);
      resolveStartup();
    });
    server.once("error", rejectStartup);
  });

  return server;
}

function isEntrypoint() {
  return Boolean(process.argv[1]) && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}

if (isEntrypoint()) {
  bootstrap().catch((error) => {
    console.error("API startup failed:", error);
    process.exitCode = 1;
  });
}
