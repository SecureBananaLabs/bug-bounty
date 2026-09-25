import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function withServer(run) {
  const server = createApp().listen(0);

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
  const headers = {};
  if (role) {
    headers.authorization = `Bearer ${signAccessToken({ sub: `${role}-user`, role })}`;
  }

  const response = await fetch(`${baseUrl}/api/admin/metrics`, { headers });
  const payload = await response.json();
  return { response, payload };
}

test("admin metrics require authentication and admin role", async () => {
  await withServer(async (baseUrl) => {
    const unauthenticated = await getMetrics(baseUrl);
    assert.equal(unauthenticated.response.status, 401);
    assert.deepEqual(unauthenticated.payload, { success: false, message: "Unauthorized" });

    for (const role of ["client", "freelancer"]) {
      const forbidden = await getMetrics(baseUrl, role);
      assert.equal(forbidden.response.status, 403);
      assert.deepEqual(forbidden.payload, { success: false, message: "Forbidden" });
    }

    const admin = await getMetrics(baseUrl, "admin");
    assert.equal(admin.response.status, 200);
    assert.equal(admin.payload.success, true);
    assert.deepEqual(admin.payload.data, {
      openJobs: 42,
      activeFreelancers: 185,
      flaggedAccounts: 3,
      monthlyVolume: 128900
    });
  });
});
