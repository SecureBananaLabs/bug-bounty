import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { createApp } from "./app.js";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export async function bootstrap({
  connect = connectDb,
  createApplication = createApp,
  port = env.port,
  logger = console
} = {}) {
  await connect();

  const app = createApplication();
  return new Promise((resolveServer, reject) => {
    const server = app.listen(port, () => {
      logger.log(`API listening on http://localhost:${port}`);
      resolveServer(server);
    });

    server.once("error", reject);
  });
}

function isEntrypoint() {
  return process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}

if (isEntrypoint()) {
  bootstrap().catch((error) => {
    console.error("API startup failed", error);
    process.exitCode = 1;
  });
}
