import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("CORS allows configured origin", async () => {
  process.env.ALLOWED_ORIGINS = "http://example.com";
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/health`, {
    headers: { Origin: "http://example.com" },
  });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("access-control-allow-origin"), "http://example.com");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("CORS blocks disallowed origin", async () => {
  process.env.ALLOWED_ORIGINS = "http://trusted.com";
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/health`, {
    headers: { Origin: "http://evil.com" },
  });

  assert.notEqual(response.headers.get("access-control-allow-origin"), "http://evil.com");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("CORS defaults to localhost:3000 when ALLOWED_ORIGINS not set", async () => {
  delete process.env.ALLOWED_ORIGINS;
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/health`, {
    headers: { Origin: "http://localhost:3000" },
  });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("access-control-allow-origin"), "http://localhost:3000");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
