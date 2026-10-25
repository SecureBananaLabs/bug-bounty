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

async function getAdminMetrics(baseUrl, tokenPayload) {
  const headers = tokenPayload
    ? { authorization: `Bearer ${signAccessToken(tokenPayload)}` }
    : {};

  const response = await fetch(`${baseUrl}/api/admin/metrics`, { headers });
  return {
    response,
    payload: await response.json()
  };
}

test("admin metrics rejects missing bearer tokens", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await getAdminMetrics(baseUrl);

    assert.equal(response.status, 401);
    assert.deepEqual(payload, { success: false, message: "Unauthorized" });
  });
});

test("admin metrics rejects authenticated non-admin users", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await getAdminMetrics(baseUrl, {
      sub: "usr_client",
      role: "client"
    });

    assert.equal(response.status, 403);
    assert.deepEqual(payload, { success: false, message: "Forbidden" });
  });
});

test("admin metrics allows authenticated admin users", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await getAdminMetrics(baseUrl, {
      sub: "usr_admin",
      role: "admin"
    });

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.deepEqual(Object.keys(payload.data).sort(), [
      "activeFreelancers",
      "flaggedAccounts",
      "monthlyVolume",
      "openJobs"
    ]);
  });
});
