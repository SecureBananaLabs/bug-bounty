import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

function listen(app) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0);
    server.once("listening", () => resolve(server));
    server.once("error", reject);
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

function post(base, path) {
  return fetch(`${base}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "dev@example.com", password: "super-secret" })
  });
}

test("login is throttled after five attempts in a window", async () => {
  const server = await listen(createApp());
  const base = `http://127.0.0.1:${server.address().port}`;

  try {
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      const response = await post(base, "/api/auth/login");
      assert.equal(response.status, 200, `attempt ${attempt} should succeed`);
    }

    const blocked = await post(base, "/api/auth/login");
    assert.equal(blocked.status, 429);
  } finally {
    await close(server);
  }
});

test("other endpoints stay available once login is limited", async () => {
  const server = await listen(createApp());
  const base = `http://127.0.0.1:${server.address().port}`;

  try {
    for (let attempt = 0; attempt < 6; attempt += 1) {
      await post(base, "/api/auth/login");
    }

    const health = await fetch(`${base}/health`);
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), { ok: true, service: "api" });
  } finally {
    await close(server);
  }
});
