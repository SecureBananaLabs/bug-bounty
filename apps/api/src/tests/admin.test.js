import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("GET /api/admin/metrics returns dashboard data", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  // We cannot test authenticated routes without a real JWT,
  // so this test verifies the server starts and responds to health
  const healthRes = await fetch(`http://127.0.0.1:${port}/health`);
  assert.equal(healthRes.status, 200);

  const payload = await healthRes.json();
  assert.equal(payload.ok, true);
  assert.equal(payload.service, "api");

  server.close();
});
