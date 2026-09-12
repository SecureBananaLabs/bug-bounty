import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { createApp } from "./app.js";
import { fileURLToPath } from "node:url";

export async function bootstrap({
  connect = connectDb,
  createApplication = createApp,
  port = env.port,
  logger = console
} = {}) {
  await connect();
  const app = createApplication();
  return app.listen(port, () => {
    logger.log(`API listening on http://localhost:${port}`);
  });
}

export function handleBootstrapFailure(error, logger = console) {
  logger.error("API failed to start:", error);
  process.exitCode = 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  bootstrap().catch((error) => handleBootstrapFailure(error));
}
