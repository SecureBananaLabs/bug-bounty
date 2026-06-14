import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

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

test("health endpoint allows the configured frontend origin", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/health`, {
      headers: { Origin: "http://localhost:3000" }
    });

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("access-control-allow-origin"), "http://localhost:3000");
  });
});

test("health endpoint does not echo untrusted origins", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/health`, {
      headers: { Origin: "https://evil.example" }
    });

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("access-control-allow-origin"), null);
  });
});
