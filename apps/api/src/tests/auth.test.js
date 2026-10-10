import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function withServer(t) {
  const app = createApp();
  const server = app.listen(0, "127.0.0.1");

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  t.after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  const { port } = server.address();
  return `http://127.0.0.1:${port}`;
}

test("admin metrics accepts Bearer scheme case-insensitively", async (t) => {
  const baseUrl = await withServer(t);
  const token = signAccessToken({ sub: "usr_test" });

  for (const scheme of ["Bearer", "bearer", "BEARER"]) {
    const response = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { Authorization: `${scheme} ${token}` }
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.openJobs, 42);
  }
});

test("admin metrics rejects non-bearer auth schemes", async (t) => {
  const baseUrl = await withServer(t);
  const token = signAccessToken({ sub: "usr_test" });

  const response = await fetch(`${baseUrl}/api/admin/metrics`, {
    headers: { Authorization: `Basic ${token}` }
  });
  const payload = await response.json();

  assert.equal(response.status, 401);
  assert.deepEqual(payload, { success: false, message: "Unauthorized" });
});
