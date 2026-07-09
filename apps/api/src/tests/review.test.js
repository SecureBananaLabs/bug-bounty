import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("Review Security & Validation", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const token = signAccessToken({ sub: "usr_sender_1", role: "client" });

  t.after(() => {
    server.close();
  });

  await t.test("POST /api/reviews blocks unauthenticated requests", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: "job_123", reviewerId: "usr_sender_1", rating: 5, comment: "greate work" })
    });
    assert.equal(response.status, 401);
  });

  await t.test("POST /api/reviews permits authenticated request with valid payload", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ jobId: "job_123", reviewerId: "usr_sender_1", rating: 5, comment: "greate work" })
    });
    assert.equal(response.status, 201);
    const data = await response.json();
    assert.equal(data.success, true);
    assert.equal(data.data.comment, "greate work");
  });

  await t.test("POST /api/reviews rejects invalid payloads", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ jobId: "", rating: 10 })
    });
    assert.equal(response.status, 500);
  });

  await t.test("POST /api/reviews ignores client-controlled id", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        id: "rev_override_123",
        jobId: "job_123",
        reviewerId: "usr_sender_1",
        rating: 5,
        comment: "greate work"
      })
    });
    assert.equal(response.status, 201);
    const data = await response.json();
    assert.equal(data.success, true);
    assert.notEqual(data.data.id, "rev_override_123");
  });
});
