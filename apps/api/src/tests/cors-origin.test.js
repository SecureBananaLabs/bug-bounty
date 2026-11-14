import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("CORS rejects origins not in allowlist", async () => {
  process.env.CORS_ORIGINS = "https://allowed.com";
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/health`, {
    headers: { Origin: "https://evil.com" }
  });

  const allowOrigin = response.headers.get("access-control-allow-origin");
  assert.notEqual(allowOrigin, "https://evil.com");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  delete process.env.CORS_ORIGINS;
});

test("CORS allows origins in allowlist", async () => {
  process.env.CORS_ORIGINS = "https://allowed.com,https://also-allowed.com";
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/health`, {
    headers: { Origin: "https://allowed.com" }
  });

  const allowOrigin = response.headers.get("access-control-allow-origin");
  assert.equal(allowOrigin, "https://allowed.com");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  delete process.env.CORS_ORIGINS;
});

test("CORS blocks all origins when CORS_ORIGINS is empty", async () => {
  delete process.env.CORS_ORIGINS;
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/health`, {
    headers: { Origin: "https://any.com" }
  });

  const allowOrigin = response.headers.get("access-control-allow-origin");
  assert.notEqual(allowOrigin, "https://any.com");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
