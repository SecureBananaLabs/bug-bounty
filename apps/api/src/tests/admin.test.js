import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function getMetrics(baseUrl, role) {
  const token = signAccessToken({ sub: `usr_${role}`, role });
  const response = await fetch(`${baseUrl}/api/admin/metrics`, {
    headers: { authorization: `Bearer ${token}` },
  });

  return { response, payload: await response.json() };
}

test("GET /api/admin/metrics rejects client tokens", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await getMetrics(baseUrl, "client");

    assert.equal(response.status, 403);
    assert.deepEqual(payload, {
      success: false,
      message: "Forbidden",
    });
  });
});

test("GET /api/admin/metrics rejects freelancer tokens", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await getMetrics(baseUrl, "freelancer");

    assert.equal(response.status, 403);
    assert.deepEqual(payload, {
      success: false,
      message: "Forbidden",
    });
  });
});

test("GET /api/admin/metrics allows admin tokens", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await getMetrics(baseUrl, "admin");

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.openJobs, 42);
    assert.equal(payload.data.flaggedAccounts, 3);
  });
});
