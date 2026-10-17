import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(app, fn) {
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  try {
    return await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("CORS: allowed origin receives Access-Control-Allow-Origin", async () => {
  const app = createApp({ corsOrigins: ["https://app.example.com"] });
  await withServer(app, async (base) => {
    const response = await fetch(`${base}/health`, {
      headers: { Origin: "https://app.example.com" }
    });
    assert.equal(response.status, 200);
    assert.equal(
      response.headers.get("access-control-allow-origin"),
      "https://app.example.com"
    );
  });
});

test("CORS: unknown origin is denied (no allow-origin header)", async () => {
  const app = createApp({ corsOrigins: ["https://app.example.com"] });
  await withServer(app, async (base) => {
    const response = await fetch(`${base}/health`, {
      headers: { Origin: "https://evil.example.net" }
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("access-control-allow-origin"), null);
  });
});

test("CORS: requests without Origin are allowed", async () => {
  const app = createApp({ corsOrigins: ["https://app.example.com"] });
  await withServer(app, async (base) => {
    const response = await fetch(`${base}/health`);
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.deepEqual(payload, { ok: true, service: "api" });
  });
});
