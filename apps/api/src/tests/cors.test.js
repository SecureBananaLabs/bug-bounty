import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { env } from "../config/env.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await run(port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("CORS only allows the configured frontend origin", async () => {
  const previousOrigin = env.frontendOrigin;
  env.frontendOrigin = "https://app.example";

  try {
    await withServer(async (port) => {
      const trusted = await fetch(`http://127.0.0.1:${port}/health`, {
        headers: {
          Origin: "https://app.example"
        }
      });
      const untrusted = await fetch(`http://127.0.0.1:${port}/health`, {
        headers: {
          Origin: "https://evil.example"
        }
      });

      assert.equal(trusted.status, 200);
      assert.equal(trusted.headers.get("access-control-allow-origin"), "https://app.example");

      assert.equal(untrusted.status, 200);
      assert.equal(untrusted.headers.get("access-control-allow-origin"), null);
    });
  } finally {
    env.frontendOrigin = previousOrigin;
  }
});
