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

  const { port } = server.address();

  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function requestMetrics(baseUrl, role) {
  const token = signAccessToken({ sub: `usr_${role}`, role });
  const response = await fetch(`${baseUrl}/api/admin/metrics`, {
    headers: { authorization: `Bearer ${token}` }
  });

  return { response, payload: await response.json() };
}

test("admin metrics allows admin users", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await requestMetrics(baseUrl, "admin");

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
  });
});

test("admin metrics rejects non-admin users", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await requestMetrics(baseUrl, "client");

    assert.equal(response.status, 403);
    assert.deepEqual(payload, { success: false, message: "Forbidden" });
  });
});
