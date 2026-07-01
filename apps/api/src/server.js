import { pathToFileURL } from "node:url";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { createApp } from "./app.js";

export async function bootstrap({
  connect = connectDb,
  createServerApp = createApp,
  port = env.port
} = {}) {
  await connect();
  const app = createServerApp();

  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      console.log(`API listening on http://localhost:${port}`);
      resolve(server);
    });

    server.once("error", reject);
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  bootstrap().catch((error) => {
    console.error("Failed to start API:", error);
    process.exitCode = 1;
  });
}
