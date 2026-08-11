import assert from "node:assert/strict";
import { once } from "node:events";
import { spawn } from "node:child_process";
import test from "node:test";

test("importing the server module does not start the listener", async () => {
  const child = spawn(process.execPath, [
    "--input-type=module",
    "-e",
    "await import('./apps/api/src/server.js'); console.log('imported');"
  ], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: "0" },
    stdio: ["ignore", "pipe", "pipe"]
  });

  const timeout = setTimeout(() => child.kill("SIGTERM"), 1000);
  const [code] = await once(child, "exit");
  clearTimeout(timeout);

  assert.equal(code, 0);
});

test("bootstrap surfaces startup dependency failures", async () => {
  const { bootstrap } = await import("../server.js");

  await assert.rejects(
    () => bootstrap({
      connectDb: async () => {
        throw new Error("database unavailable");
      },
      createApp: () => ({
        listen() {
          throw new Error("listen should not run");
        }
      }),
      port: 0
    }),
    /database unavailable/
  );
});
