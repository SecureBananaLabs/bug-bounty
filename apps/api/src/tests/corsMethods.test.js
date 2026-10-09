import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

function listen(app) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, "127.0.0.1", () => {
      resolve({ server, port: server.address().port });
    });
    server.once("error", reject);
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("preflight advertises only the supported methods", async () => {
  const app = createApp();
  const { server, port } = await listen(app);

  const response = await fetch(`http://127.0.0.1:${port}/health`, {
    method: "OPTIONS",
    headers: {
      Origin: "http://localhost:3000",
      "Access-Control-Request-Method": "POST",
    },
  });

  const methods = response.headers.get("access-control-allow-methods");

  assert.equal(methods, "GET,POST,PUT,DELETE");
  assert.ok(!methods.includes("PATCH"));

  await close(server);
});

test("simple requests still succeed with CORS headers", async () => {
  const app = createApp();
  const { server, port } = await listen(app);

  const response = await fetch(`http://127.0.0.1:${port}/health`, {
    headers: { Origin: "http://localhost:3000" },
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(payload, { ok: true, service: "api" });
  assert.equal(response.headers.get("access-control-allow-origin"), "*");

  await close(server);
});
