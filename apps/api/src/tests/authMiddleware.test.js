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

for (const scheme of ["Bearer", "bearer", "BEARER"]) {
  test(`authMiddleware accepts ${scheme} scheme`, async () => {
    await withServer(async (baseUrl) => {
      const token = signAccessToken({ sub: "usr_123", role: "admin" });
      const response = await fetch(`${baseUrl}/api/admin/metrics`, {
        headers: {
          Authorization: `${scheme} ${token}`
        }
      });

      assert.equal(response.status, 200);
    });
  });
}

test("authMiddleware rejects non-bearer schemes", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_123", role: "admin" });
    const response = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: {
        Authorization: `Token ${token}`
      }
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, {
      success: false,
      message: "Unauthorized"
    });
  });
});
