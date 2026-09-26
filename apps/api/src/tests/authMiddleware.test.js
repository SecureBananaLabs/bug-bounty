import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function withServer(callback) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    return await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("auth middleware accepts Bearer scheme case-insensitively", async () => {
  const token = signAccessToken({ sub: "usr_admin", role: "admin" });

  await withServer(async (baseUrl) => {
    for (const scheme of ["Bearer", "bearer", "BEARER"]) {
      const response = await fetch(`${baseUrl}/api/admin/metrics`, {
        headers: { authorization: `${scheme} ${token}` }
      });
      const payload = await response.json();

      assert.equal(response.status, 200);
      assert.equal(payload.success, true);
    }
  });
});

test("auth middleware still rejects non-Bearer authorization schemes", async () => {
  const token = signAccessToken({ sub: "usr_admin", role: "admin" });

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { authorization: `Basic ${token}` }
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, { success: false, message: "Unauthorized" });
  });
});
