import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /api/messages requires authentication", async () => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => { server.once("listening", resolve); server.once("error", reject); });
  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}/api/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: "Hello", recipientId: "usr_2" })
  });
  assert.equal(res.status, 401);
  await new Promise((resolve, reject) => server.close(e => e ? reject(e) : resolve()));
});
