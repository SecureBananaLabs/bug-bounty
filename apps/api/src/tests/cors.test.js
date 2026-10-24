import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function startServer() {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  return {
    base: `http://127.0.0.1:${port}`,
    stop: () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}

test("untrusted Origin receives no Access-Control-Allow-Origin header by default", async () => {
  delete process.env.CORS_ALLOWED_ORIGINS;
  const { base, stop } = await startServer();
  try {
    const response = await fetch(`${base}/health`, {
      headers: { origin: "https://evil.example" },
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("access-control-allow-origin"), null);
  } finally {
    await stop();
  }
});

test("origin listed in CORS_ALLOWED_ORIGINS is allowed", async () => {
  process.env.CORS_ALLOWED_ORIGINS = "https://app.example.com, https://admin.example.com";
  const { base, stop } = await startServer();
  try {
    const response = await fetch(`${base}/health`, {
      headers: { origin: "https://app.example.com" },
    });
    assert.equal(response.status, 200);
    assert.equal(
      response.headers.get("access-control-allow-origin"),
      "https://app.example.com"
    );

    const evil = await fetch(`${base}/health`, {
      headers: { origin: "https://evil.example" },
    });
    assert.equal(evil.headers.get("access-control-allow-origin"), null);
  } finally {
    delete process.env.CORS_ALLOWED_ORIGINS;
    await stop();
  }
});
