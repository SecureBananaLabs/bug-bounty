import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("proposal endpoints authentication", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Unauthenticated GET /api/proposals returns 401
    const resGetUnauth = await fetch(`${baseUrl}/api/proposals`);
    assert.equal(resGetUnauth.status, 401);

    // 2. Unauthenticated POST /api/proposals returns 401
    const resPostUnauth = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: "job_1", coverLetter: "test", proposedRate: 100 }),
    });
    assert.equal(resPostUnauth.status, 401);

    // 3. Authenticated GET /api/proposals returns 200
    const token = signAccessToken({ userId: "usr_1", email: "user@example.com", role: "freelancer" });
    const resGetAuth = await fetch(`${baseUrl}/api/proposals`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(resGetAuth.status, 200);

    // 4. Authenticated POST /api/proposals returns 201
    const resPostAuth = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ jobId: "job_1", coverLetter: "test", proposedRate: 100 }),
    });
    assert.equal(resPostAuth.status, 201);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
});
