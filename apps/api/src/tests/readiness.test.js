import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { readiness } from "../controllers/healthController.js";

async function withServer(fn) {
  const app = createApp();
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

function fakeRes() {
  const state = { statusCode: null, body: null };
  return {
    state,
    status(code) {
      state.statusCode = code;
      return this;
    },
    json(payload) {
      state.body = payload;
      return this;
    }
  };
}

test("GET /health still answers the liveness probe with the original payload", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/health`);
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { ok: true, service: "api" });
  });
});

test("GET /health/ready reports ready with a database check when the dependency is up", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/health/ready`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, "ready");
    assert.equal(body.checks.database.ok, true);
    assert.ok(body.checks.database.driver, "the driver is reported for debugging");
  });
});

test("readiness returns 503 when the database is unreachable", async () => {
  const res = fakeRes();
  await readiness({}, res, { checkDb: async () => ({ ok: false, driver: "prisma-placeholder" }) });

  assert.equal(res.state.statusCode, 503);
  assert.equal(res.state.body.status, "not_ready");
  assert.equal(res.state.body.checks.database.ok, false);
});

test("readiness returns 503 and does not throw when the check itself throws", async () => {
  const res = fakeRes();
  await readiness(
    {},
    res,
    {
      checkDb: async () => {
        throw new Error("connection refused");
      }
    }
  );

  assert.equal(res.state.statusCode, 503);
  assert.equal(res.state.body.status, "not_ready");
  assert.equal(res.state.body.checks.database.error, "connection refused");
});

test("readiness is mounted before the rate limiter so probes are never throttled", async () => {
  // Exceed the API limiter's window with probe calls; a 429 would be
  // indistinguishable from an unhealthy instance to the orchestrator.
  await withServer(async (base) => {
    const codes = new Set();
    for (let i = 0; i < 120; i += 1) {
      const res = await fetch(`${base}/health/ready`);
      codes.add(res.status);
    }
    assert.deepEqual([...codes], [200], "readiness probe must never be throttled");
  });
});
