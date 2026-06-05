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

test("protected routes accept Bearer auth scheme case-insensitively", async () => {
  const token = signAccessToken({ sub: "usr_case_test", role: "admin" });

  await withServer(async (baseUrl) => {
    for (const scheme of ["Bearer", "bearer", "BEARER"]) {
      const response = await fetch(`${baseUrl}/api/admin/metrics`, {
        headers: { Authorization: `${scheme} ${token}` }
      });
      const payload = await response.json();

      assert.equal(response.status, 200);
      assert.equal(payload.success, true);
    }
  });
});

test("protected routes still reject non-Bearer auth schemes", async () => {
  const token = signAccessToken({ sub: "usr_case_test", role: "admin" });

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { Authorization: `Basic ${token}` }
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, { success: false, message: "Unauthorized" });
  });
});
