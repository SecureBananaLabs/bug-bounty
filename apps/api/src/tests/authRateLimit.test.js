import test from "node:test";
import assert from "node:assert/strict";

// Must be set before the rate-limit module is first imported.
process.env.AUTH_RATE_LIMIT_MAX = "3";
process.env.AUTH_RATE_LIMIT_WINDOW_MS = String(15 * 60 * 1000);

const { createApp } = await import("../app.js");

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

test("POST /api/auth/login rate-limits after AUTH_RATE_LIMIT_MAX attempts", async () => {
  await withServer(async (port) => {
    const url = `http://127.0.0.1:${port}/api/auth/login`;
    const body = JSON.stringify({
      email: "attacker@example.com",
      password: "password123"
    });

    const statuses = [];
    for (let i = 0; i < 4; i += 1) {
      const response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body
      });
      statuses.push(response.status);
    }

    assert.equal(statuses[0], 200);
    assert.equal(statuses[1], 200);
    assert.equal(statuses[2], 200);
    assert.equal(statuses[3], 429);

    const limited = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body
    });
    const payload = await limited.json();
    assert.equal(limited.status, 429);
    assert.equal(payload.success, false);
    assert.match(String(payload.message), /too many auth attempts/i);
  });
});

test("GET /health is not constrained by the auth limiter", async () => {
  await withServer(async (port) => {
    // Burn auth budget first.
    const loginUrl = `http://127.0.0.1:${port}/api/auth/login`;
    const body = JSON.stringify({
      email: "attacker@example.com",
      password: "password123"
    });
    for (let i = 0; i < 4; i += 1) {
      await fetch(loginUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body
      });
    }

    const health = await fetch(`http://127.0.0.1:${port}/health`);
    assert.equal(health.status, 200);
  });
});
