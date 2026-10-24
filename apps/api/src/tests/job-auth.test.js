import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /api/jobs requires authentication", async () => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Test Job",
      description: "A test job description",
      budgetMin: 100,
      budgetMax: 500,
      categoryId: "cat_1"
    })
  });
  assert.equal(res.status, 401, "unauthenticated job creation must return 401");
  await new Promise((resolve, reject) => server.close(e => e ? reject(e) : resolve()));
});
