import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function serve() {
  const server = await new Promise((resolve, reject) => {
    const instance = createApp().listen(0);
    instance.once("listening", () => resolve(instance));
    instance.once("error", reject);
  });
  return { server, port: server.address().port };
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

async function options(port, origin) {
  const headers = origin ? { Origin: origin } : {};
  return fetch(`http://127.0.0.1:${port}/health`, { method: "OPTIONS", headers });
}

test("an origin on the allowlist is accepted", async () => {
  process.env.NODE_ENV = "production";
  process.env.CORS_ORIGINS = "https://app.local, https://admin.local";

  const { server, port } = await serve();
  const response = await options(port, "https://admin.local");

  assert.equal(response.headers.get("access-control-allow-origin"), "https://admin.local");
  await close(server);
});

test("an origin outside the allowlist is refused", async () => {
  process.env.NODE_ENV = "production";
  process.env.CORS_ORIGINS = "https://app.local";

  const { server, port } = await serve();
  const response = await options(port, "https://evil.example");

  assert.equal(response.headers.get("access-control-allow-origin"), null);
  await close(server);
});

test("production without an allowlist refuses cross-origin calls", async () => {
  process.env.NODE_ENV = "production";
  delete process.env.CORS_ORIGINS;

  const { server, port } = await serve();
  const response = await options(port, "https://anywhere.example");

  assert.equal(response.headers.get("access-control-allow-origin"), null);
  await close(server);
});

test("development without an allowlist stays permissive", async () => {
  process.env.NODE_ENV = "development";
  delete process.env.CORS_ORIGINS;

  const { server, port } = await serve();
  const response = await options(port, "https://localhost:5173");

  assert.equal(response.headers.get("access-control-allow-origin"), "https://localhost:5173");
  await close(server);
});

test("requests without an Origin header still get through", async () => {
  process.env.NODE_ENV = "production";
  process.env.CORS_ORIGINS = "https://app.local";

  const { server, port } = await serve();
  const response = await fetch(`http://127.0.0.1:${port}/health`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, service: "api" });
  await close(server);
});
