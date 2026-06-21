import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("registration without fullName returns 400", async () => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "user@example.com", password: "password123" })
  });
  assert.equal(res.status, 400, "missing fullName should produce a 400 response");
  await new Promise((resolve, reject) => server.close(e => e ? reject(e) : resolve()));
});
