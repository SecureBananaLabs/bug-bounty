import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

function loginBody(seed) {
  return JSON.stringify({ email: `dev${seed}@acme.io`, password: "super-secret" });
}

test("login allows five attempts, throttles the sixth, other routes keep working", async () => {
  const server = await new Promise((resolve, reject) => {
    const instance = createApp().listen(0);
    instance.once("listening", () => resolve(instance));
    instance.once("error", reject);
  });
  const { port } = server.address();

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: loginBody(attempt)
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.success, true);
    assert.match(body.data.token, /\./);
  }

  const throttled = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: loginBody(6)
  });
  assert.equal(throttled.status, 429);

  const health = await fetch(`http://127.0.0.1:${port}/health`);
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { ok: true, service: "api" });

  const refresh = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  });
  assert.equal(refresh.status, 200);

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
