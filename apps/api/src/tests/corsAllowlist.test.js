import test from "node:test";
import assert from "node:assert/strict";

async function serve(app) {
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  return server;
}

async function close(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("allowed origin receives a CORS header", async () => {
  process.env.CORS_ORIGINS = "https://app.example, https://admin.example";
  const { createApp } = await import("../app.js");
  const app = createApp();
  const server = await serve(app);
  const { port } = server.address();

  const response = await fetch(`http://127.0.0.1:${port}/health`, {
    headers: { Origin: "https://admin.example" }
  });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("access-control-allow-origin"), "https://admin.example");

  await close(server);
});

test("origin outside the allowlist receives no CORS header", async () => {
  process.env.CORS_ORIGINS = "https://app.example";
  const { createApp } = await import("../app.js");
  const app = createApp();
  const server = await serve(app);
  const { port } = server.address();

  const response = await fetch(`http://127.0.0.1:${port}/health`, {
    headers: { Origin: "https://evil.example" }
  });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("access-control-allow-origin"), null);

  await close(server);
});
