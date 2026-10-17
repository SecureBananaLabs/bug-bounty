import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("Zod validation failure returns 400 not 500", async () => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => { server.once("listening", resolve); server.once("error", reject); });
  const { port } = server.address();
  // POST /api/auth/register with invalid email triggers ZodError
  const res = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "not-an-email", password: "short" })
  });
  assert.equal(res.status, 400, "Zod validation error must return 400");
  const body = await res.json();
  assert.equal(body.success, false);
  await new Promise((resolve, reject) => server.close(e => e ? reject(e) : resolve()));
});
