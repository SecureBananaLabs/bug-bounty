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

async function getMetrics(baseUrl, authorization) {
  const response = await fetch(`${baseUrl}/api/admin/metrics`, {
    headers: authorization ? { authorization } : {}
  });
  const payload = await response.json();

  return { response, payload };
}

test("auth middleware accepts bearer schemes case-insensitively", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_admin", role: "admin" });

    for (const scheme of ["Bearer", "bearer", "BEARER"]) {
      const { response, payload } = await getMetrics(baseUrl, `${scheme} ${token}`);

      assert.equal(response.status, 200);
      assert.equal(payload.success, true);
      assert.equal(payload.data.openJobs, 42);
    }
  });
});

test("auth middleware rejects missing, blank, or invalid bearer tokens", async () => {
  await withServer(async (baseUrl) => {
    const missing = await getMetrics(baseUrl);
    assert.equal(missing.response.status, 401);
    assert.deepEqual(missing.payload, { success: false, message: "Unauthorized" });

    const blank = await getMetrics(baseUrl, "bearer ");
    assert.equal(blank.response.status, 401);
    assert.deepEqual(blank.payload, { success: false, message: "Unauthorized" });

    const invalid = await getMetrics(baseUrl, "bearer not-a-token");
    assert.equal(invalid.response.status, 401);
    assert.deepEqual(invalid.payload, { success: false, message: "Invalid token" });
  });
});
