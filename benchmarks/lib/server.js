import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import { setTimeout as delay } from "node:timers/promises";
import { REPO_ROOT } from "./env.js";

const MAX_LOG_BYTES = 16 * 1024;

function freePort() {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.unref();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });
}

/**
 * Start apps/api on an ephemeral port with benchmark-friendly settings.
 *
 * The rate limit is raised because the default 200 requests / 15 minutes is a
 * production guard, not a property of the handlers being measured.
 *
 * @param {{jwtSecret:string}} options
 */
export async function startLocalServer({ jwtSecret }) {
  const port = await freePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  let logs = "";

  const child = spawn(process.execPath, ["apps/api/src/server.js"], {
    cwd: REPO_ROOT,
    env: {
      ...process.env,
      NODE_ENV: "benchmark",
      PORT: String(port),
      JWT_SECRET: jwtSecret,
      RATE_LIMIT_MAX: "1000000",
      RATE_LIMIT_WINDOW_MS: "60000"
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  const capture = (chunk) => {
    if (logs.length < MAX_LOG_BYTES) logs += chunk.toString();
  };
  child.stdout.on("data", capture);
  child.stderr.on("data", capture);

  const stop = async () => {
    if (child.exitCode !== null) return;
    child.kill("SIGTERM");
    const forceKill = setTimeout(() => child.kill("SIGKILL"), 5000);
    await once(child, "exit").catch(() => {});
    clearTimeout(forceKill);
  };

  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Local API exited with code ${child.exitCode}:\n${logs}`);
    }

    try {
      const response = await fetch(`${baseUrl}/health`, { signal: AbortSignal.timeout(1000) });
      if (response.ok) {
        return { baseUrl, stop, logs: () => logs };
      }
    } catch {
      // Server not ready yet.
    }

    await delay(150);
  }

  await stop();
  throw new Error(`Local API did not become healthy within 15s:\n${logs}`);
}
