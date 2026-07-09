import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("unsupported method returns JSON 405", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  // Sending PUT to /api/jobs should fail with 405 Method Not Allowed
  const response = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Updated Title" })
  });

  const payload = await response.json();

  assert.equal(response.status, 405);
  assert.equal(response.headers.get("Allow"), "GET, POST");
  assert.deepEqual(payload, {
    success: false,
    message: "Method not allowed"
  });

  // Sending GET to /api/jobs should still succeed (returning list of jobs)
  const responseOk = await fetch(`http://127.0.0.1:${port}/api/jobs`);
  assert.equal(responseOk.status, 200);

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
