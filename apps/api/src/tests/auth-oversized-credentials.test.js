import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("GET /api/admin/metrics rejects oversized bearer credentials with 400", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const oversizedToken = "a".repeat(4097);
  const response = await fetch(`http://127.0.0.1:${port}/api/admin/metrics`, {
    headers: { Authorization: `Bearer ${oversizedToken}` }
  });
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.deepEqual(payload, { success: false, message: "Credential too large" });

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
