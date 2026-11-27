import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /api/reviews requires authentication", async (t) => {
  const server = createApp().listen(0);
  t.after(() => new Promise((resolve) => server.close(resolve)));

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/reviews`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ rating: 5, comment: "Great work" })
  });
  const payload = await response.json();

  assert.equal(response.status, 401);
  assert.deepEqual(payload, { success: false, message: "Unauthorized" });
});
