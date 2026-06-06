import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function startApp() {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  return server;
}

test("async route Zod errors return 400 through error middleware", async () => {
  const server = await startApp();
  const { port } = server.address();

  const response = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "not-an-email", password: "short" })
  });
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.success, false);
  assert.ok(Array.isArray(payload.errors));

  const jobResponse = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "ab" })
  });
  const jobPayload = await jobResponse.json();

  assert.equal(jobResponse.status, 400);
  assert.equal(jobPayload.success, false);

  await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
});
