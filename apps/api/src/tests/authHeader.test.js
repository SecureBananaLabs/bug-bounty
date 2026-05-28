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
    return await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("auth middleware accepts bearer auth scheme case-insensitively", async () => {
  const token = signAccessToken({ sub: "usr_1", role: "client" });

  await withServer(async (baseUrl) => {
    for (const scheme of ["Bearer", "bearer", "BEARER"]) {
      const response = await fetch(`${baseUrl}/api/admin/metrics`, {
        headers: { Authorization: `${scheme} ${token}` }
      });

      assert.equal(response.status, 200);
    }
  });
});

test("auth middleware rejects an empty bearer token", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { Authorization: "bearer    " }
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, { success: false, message: "Unauthorized" });
  });
});
